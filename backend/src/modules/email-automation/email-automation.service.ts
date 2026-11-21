import type { EmailMessage, EmailTemplateStatus, EmailTemplateType, EmailTrigger, Prisma, PrismaClient } from "@prisma/client";
import {
  MAX_ATTEMPTS,
  SAFE_IDEMPOTENCY_WINDOW_MS,
  SAMPLE_VARS,
  autoKey,
  backoffMinutes,
  canEmail,
  classifySendError,
  effectiveType,
  isValidEmail,
  manualKey,
  normalizeEmail,
  oneLine,
  payloadHash,
  renderEmail,
  unknownVariables,
  type EmailType,
  type TemplateVars,
} from "./email.lib.js";

/** Input to the actual mail provider (Resend). Throws on failure; the error's `name` drives retry decisions. */
export interface EmailSender {
  send(msg: { to: string; subject: string; html: string; text: string; idempotencyKey: string; headers?: Record<string, string> }): Promise<{ id: string }>;
  /** Cheap authenticated call used by "Test connection". */
  check(): Promise<void>;
}

export class EmailError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "EmailError";
  }
}

export interface EmailAutomationDeps {
  db: PrismaClient;
  sender: EmailSender;
  /** The engine switch (EMAIL_AUTOMATION_ENABLED). Automatic triggers, scheduled sends and the worker need it on. */
  isEnabled: () => boolean;
  /** RESEND_API_KEY + SMTP_FROM_EMAIL present. */
  isConfigured: () => boolean;
  /** Signed unsubscribe link for a person, or null when no secret is configured (promotional email is then refused). */
  unsubscribeUrl: (userId: string) => string | null;
  appName: string;
  now?: () => Date;
}

export const TRIGGERS: EmailTrigger[] = ["USER_REGISTERED", "FOLLOW_UP", "SCHEDULED_EMAIL", "MANUAL_SEND"];
export const ANCHOR_EVENTS = ["USER_REGISTERED", "DEMO_REQUESTED"] as const;
export type AnchorEvent = (typeof ANCHOR_EVENTS)[number];

const MAX_MANUAL_RECIPIENTS = 25;
const STALE_LOCK_MS = 10 * 60_000;
/** A queued email this far past its time (e.g. after a long outage) is cancelled instead of sent late. */
const MESSAGE_TTL_MS = 48 * 3600_000;
/** A scheduled blast this far past its time without running is expired instead of sent late. */
const SCHEDULE_GRACE_MS = 24 * 3600_000;
const BATCH = 20;
const MAX_DELAY_MINUTES = 60 * 24 * 90;
const SEND_TIMEOUT_MS = 15_000;
/** Buffered webhook events that never matched one of our messages (OTP/receipt mail from the same account) are dropped after this. */
const UNMATCHED_EVENT_TTL_MS = 24 * 3600_000;
const APPLIED_EVENT_TTL_MS = 7 * 24 * 3600_000;

const SCHEDULED_NEEDS_PROMO = "A scheduled email goes to many people, so it must use a Promotional template (it is only ever sent to people who opted in and have not unsubscribed).";

const firstName = (full: string) => full.trim().split(/\s+/)[0] ?? "";
const isUniqueViolation = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

function str(v: unknown, field: string, max: number, required = true): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s && required) throw new EmailError(`${field} is required.`);
  if (s.length > max) throw new EmailError(`${field} must be ${max} characters or fewer.`);
  return s;
}

type UserRow = { id: string; fullName: string; email: string; companyName: string | null; isActive: boolean; emailVerified: boolean; marketingEmailOptIn: boolean; emailUnsubscribedAt: Date | null };
type TemplateRow = { subject: string; htmlBody: string; textBody: string | null; type: EmailTemplateType };

/** Everything stored on a queued message: the exact content that will be sent. */
interface Snapshot {
  toEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  listUnsubscribe: string | null;
  contentHash: string;
  templateType: EmailType;
}

export class EmailAutomationService {
  private now: () => Date;
  constructor(private d: EmailAutomationDeps) {
    this.now = d.now ?? (() => new Date());
  }

  // ─── status ────────────────────────────────────────────────────────────────
  status() {
    return {
      provider: "Resend",
      configured: this.d.isConfigured(),
      engineEnabled: this.d.isEnabled(),
      webhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET?.trim()),
    };
  }

  /** Real call to Resend. A sending-only key is rejected for this call with "restricted_api_key", which still proves the key works. */
  async checkConnection(): Promise<{ ok: boolean; message: string }> {
    if (!this.d.isConfigured()) return { ok: false, message: "RESEND_API_KEY / SMTP_FROM_EMAIL are not set on the server." };
    try {
      await this.d.sender.check();
      return { ok: true, message: "Connected to Resend." };
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name === "restricted_api_key") return { ok: true, message: "Connected (sending-only API key)." };
      return { ok: false, message: (err.message ?? "Could not reach Resend.").slice(0, 200) };
    }
  }

  async stats() {
    const rows = await this.d.db.emailMessage.groupBy({ by: ["status"], where: { isTest: false }, _count: { _all: true } });
    const n = (...s: string[]) => rows.filter((r) => s.includes(r.status)).reduce((a, r) => a + r._count._all, 0);
    const [activeAutomations, templates] = await Promise.all([
      this.d.db.emailAutomation.count({ where: { isActive: true } }),
      this.d.db.emailTemplate.count({ where: { status: { not: "ARCHIVED" } } }),
    ]);
    return {
      totalSent: n("SENT", "DELIVERED", "BOUNCED", "COMPLAINED"),
      delivered: n("DELIVERED"),
      failed: n("FAILED", "BOUNCED"),
      pendingScheduled: n("QUEUED", "SENDING"),
      skipped: n("SKIPPED"),
      /** Outcome unknown; an admin must reconcile these (they are never retried automatically). */
      needsReview: n("UNCONFIRMED"),
      activeAutomations,
      templates,
    };
  }

  // ─── templates ─────────────────────────────────────────────────────────────
  private parseTemplate(b: Record<string, unknown>) {
    const name = str(b.name, "Name", 120);
    const subject = oneLine(str(b.subject, "Subject", 200));
    const htmlBody = str(b.htmlBody, "HTML body", 200_000);
    const textBody = str(b.textBody, "Plain-text body", 100_000, false) || null;
    const type = b.type === "PROMOTIONAL" ? "PROMOTIONAL" : "TRANSACTIONAL";
    const status: EmailTemplateStatus = b.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const unknown = unknownVariables(subject, htmlBody, textBody ?? "");
    if (unknown.length) throw new EmailError(`Unknown variable${unknown.length > 1 ? "s" : ""}: ${unknown.map((u) => `{{${u}}}`).join(", ")}.`);
    return { name, subject, htmlBody, textBody, type: type as EmailTemplateType, status };
  }

  listTemplates(includeArchived = false) {
    return this.d.db.emailTemplate.findMany({
      where: includeArchived ? {} : { status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { automations: true } } },
    });
  }

  async getTemplate(id: string) {
    const t = await this.d.db.emailTemplate.findUnique({ where: { id } });
    if (!t) throw new EmailError("Template not found.", 404);
    return t;
  }

  async createTemplate(body: Record<string, unknown>, adminId?: string) {
    return this.d.db.emailTemplate.create({ data: { ...this.parseTemplate(body), createdById: adminId } });
  }

  /** Editing a template never changes emails already queued: they carry their own snapshot. */
  async updateTemplate(id: string, body: Record<string, unknown>) {
    const existing = await this.getTemplate(id);
    const data = this.parseTemplate(body);
    if (existing.status === "ARCHIVED") throw new EmailError("This template is archived. Create a new one instead.");
    if (data.type !== "PROMOTIONAL") {
      const bulk = await this.d.db.emailAutomation.count({ where: { templateId: id, trigger: "SCHEDULED_EMAIL", firedAt: null, expiredAt: null } });
      if (bulk) throw new EmailError(`A scheduled email uses this template. ${SCHEDULED_NEEDS_PROMO}`, 409);
    }
    return this.d.db.emailTemplate.update({ where: { id }, data });
  }

  /** Archive (the row stays so history keeps its template). Refused while an active automation uses it. Queued emails are unaffected. */
  async archiveTemplate(id: string) {
    await this.getTemplate(id);
    const inUse = await this.d.db.emailAutomation.count({ where: { templateId: id, isActive: true } });
    if (inUse) throw new EmailError("An active automation uses this template. Turn the automation off first.", 409);
    return this.d.db.emailTemplate.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  /** Renders a saved template or an unsaved draft with sample data. Pure: nothing is sent. */
  async preview(input: { templateId?: string; draft?: Record<string, unknown> }) {
    const t = input.templateId ? await this.getTemplate(input.templateId) : this.parseTemplate(input.draft ?? {});
    const r = renderEmail(t, SAMPLE_VARS, { footer: t.type === "PROMOTIONAL" });
    return { ...r, type: t.type };
  }

  /** Sends one [TEST] copy to the signed-in admin's own address (never to anyone else). */
  async sendTest(templateId: string, admin: { id?: string; email: string | null }) {
    if (!admin.email || !isValidEmail(admin.email)) throw new EmailError("Your admin account has no valid email address to send the test to.");
    this.requireConfigured();
    const t = await this.getTemplate(templateId);
    const to = normalizeEmail(admin.email);
    const r = renderEmail(t, { ...SAMPLE_VARS, email: to }, { footer: t.type === "PROMOTIONAL" });
    const subject = `[TEST] ${r.subject}`;
    const snap: Snapshot = { toEmail: to, subject, bodyHtml: r.html, bodyText: r.text, listUnsubscribe: null, templateType: t.type, contentHash: payloadHash({ toEmail: to, subject, html: r.html, text: r.text, listUnsubscribe: null }) };
    const msg = await this.d.db.emailMessage.create({
      data: { ...snap, templateId: t.id, trigger: "MANUAL_SEND", status: "SENDING", attempts: 1, lockedAt: this.now(), dedupeKey: `test:${t.id}:${admin.id ?? "admin"}:${this.now().getTime()}`, isTest: true, createdById: admin.id },
    });
    return this.transmit(msg);
  }

  // ─── automations ───────────────────────────────────────────────────────────
  private async parseAutomation(b: Record<string, unknown>, current?: { isActive: boolean }) {
    const name = str(b.name, "Name", 120);
    const trigger = b.trigger as EmailTrigger;
    if (!TRIGGERS.includes(trigger) || trigger === "MANUAL_SEND") throw new EmailError("Choose a trigger: user registered, follow-up or scheduled email.");
    const templateId = str(b.templateId, "Template", 64);
    const tpl = await this.d.db.emailTemplate.findUnique({ where: { id: templateId } });
    if (!tpl || tpl.status === "ARCHIVED") throw new EmailError("Choose an existing, non-archived template.");
    // A broadcast must carry marketing consent rules, so the template has to say so (also enforced again when it runs and when each email is sent).
    if (trigger === "SCHEDULED_EMAIL" && tpl.type !== "PROMOTIONAL") throw new EmailError(SCHEDULED_NEEDS_PROMO);
    let delayMinutes = 0;
    let anchorEvent: string | null = null;
    let scheduledAt: Date | null = null;
    if (trigger === "USER_REGISTERED" || trigger === "FOLLOW_UP") {
      delayMinutes = Number(b.delayMinutes ?? 0);
      if (!Number.isInteger(delayMinutes) || delayMinutes < 0 || delayMinutes > MAX_DELAY_MINUTES) throw new EmailError("Delay must be a whole number of minutes between 0 and 129600 (90 days).");
      if (trigger === "FOLLOW_UP") {
        anchorEvent = String(b.anchorEvent ?? "");
        if (!(ANCHOR_EVENTS as readonly string[]).includes(anchorEvent)) throw new EmailError("Choose which event the follow-up counts from.");
        if (delayMinutes < 1) throw new EmailError("A follow-up needs a delay of at least 1 minute.");
      }
    } else {
      const when = new Date(String(b.scheduledAt ?? ""));
      if (Number.isNaN(when.getTime())) throw new EmailError("Choose a date and time to send.");
      scheduledAt = when;
    }
    const wantsActive = b.isActive === true;
    if (wantsActive && scheduledAt && scheduledAt.getTime() < this.now().getTime() - 60_000) throw new EmailError("The scheduled time is in the past.");
    return { name, trigger, templateId, delayMinutes, anchorEvent, scheduledAt, isActive: current ? wantsActive : false, template: tpl };
  }

  async listAutomations() {
    const rows = await this.d.db.emailAutomation.findMany({ orderBy: { createdAt: "desc" }, include: { template: { select: { id: true, name: true, type: true, status: true } } } });
    const counts = await this.d.db.emailMessage.groupBy({ by: ["automationId", "status"], where: { automationId: { in: rows.map((r) => r.id) } }, _count: { _all: true } });
    return rows.map((r) => {
      const c = counts.filter((x) => x.automationId === r.id);
      const n = (...s: string[]) => c.filter((x) => s.includes(x.status)).reduce((a, x) => a + x._count._all, 0);
      return { ...r, runs: { queued: n("QUEUED", "SENDING"), sent: n("SENT", "DELIVERED"), failed: n("FAILED", "BOUNCED"), skipped: n("SKIPPED", "CANCELLED"), needsReview: n("UNCONFIRMED") } };
    });
  }

  async createAutomation(body: Record<string, unknown>, adminId?: string) {
    const { template: _t, ...data } = await this.parseAutomation(body);
    return this.d.db.emailAutomation.create({ data: { ...data, createdById: adminId } });
  }

  async updateAutomation(id: string, body: Record<string, unknown>) {
    const cur = await this.d.db.emailAutomation.findUnique({ where: { id } });
    if (!cur) throw new EmailError("Automation not found.", 404);
    if (cur.firedAt) throw new EmailError("This scheduled email already ran. Create a new one.", 409);
    const { template: _t, isActive: _a, ...data } = await this.parseAutomation({ ...body, isActive: cur.isActive }, cur);
    return this.d.db.emailAutomation.update({ where: { id }, data });
  }

  async setAutomationActive(id: string, active: boolean) {
    const cur = await this.d.db.emailAutomation.findUnique({ where: { id }, include: { template: true } });
    if (!cur) throw new EmailError("Automation not found.", 404);
    if (active) {
      if (cur.template.status !== "ACTIVE") throw new EmailError("Its template is not active.", 409);
      if (cur.trigger === "SCHEDULED_EMAIL" && cur.template.type !== "PROMOTIONAL") throw new EmailError(SCHEDULED_NEEDS_PROMO, 409);
      if (cur.firedAt || cur.expiredAt) throw new EmailError("This scheduled email already ran or expired. Create a new one.", 409);
      if (cur.scheduledAt && cur.scheduledAt.getTime() < this.now().getTime() - 60_000) throw new EmailError("The scheduled time is in the past.", 409);
    } else {
      // Switching off cancels what is still waiting; the worker also re-checks this at send time.
      await this.d.db.emailMessage.updateMany({ where: { automationId: id, status: "QUEUED" }, data: { status: "CANCELLED", failureReason: "AUTOMATION_OFF" } });
    }
    return this.d.db.emailAutomation.update({ where: { id }, data: { isActive: active } });
  }

  async deleteAutomation(id: string) {
    const cur = await this.d.db.emailAutomation.findUnique({ where: { id } });
    if (!cur) throw new EmailError("Automation not found.", 404);
    await this.d.db.emailMessage.updateMany({ where: { automationId: id, status: "QUEUED" }, data: { status: "CANCELLED", failureReason: "AUTOMATION_DELETED" } });
    await this.d.db.emailAutomation.delete({ where: { id } }); // history rows keep their data (automation_id becomes null)
  }

  // ─── snapshots ─────────────────────────────────────────────────────────────
  /**
   * Renders the email for ONE person now and returns exactly what will be stored and sent, or the reason it must not be sent.
   * Consent is decided here (queue time) with the effective type, and again at send time.
   */
  private buildSnapshot(t: TemplateRow, user: UserRow, trigger: EmailTrigger): { ok: true; snap: Snapshot } | { ok: false; reason: string } {
    const type = effectiveType(trigger, t.type);
    const allowed = canEmail(type, user);
    if (!allowed.ok) return { ok: false, reason: allowed.reason };
    const unsub = type === "PROMOTIONAL" ? this.d.unsubscribeUrl(user.id) : null;
    if (type === "PROMOTIONAL" && !unsub) return { ok: false, reason: "UNSUBSCRIBE_NOT_CONFIGURED" };
    const vars: TemplateVars = { name: user.fullName, first_name: firstName(user.fullName), email: user.email, company: user.companyName ?? "", app_name: this.d.appName, unsubscribe_url: unsub ?? "" };
    const r = renderEmail(t, vars, { footer: type === "PROMOTIONAL" });
    const toEmail = normalizeEmail(user.email);
    const listUnsubscribe = unsub ? `<${unsub}>` : null;
    return { ok: true, snap: { toEmail, subject: r.subject, bodyHtml: r.html, bodyText: r.text, listUnsubscribe, templateType: type, contentHash: payloadHash({ toEmail, subject: r.subject, html: r.html, text: r.text, listUnsubscribe }) } };
  }

  // ─── manual send ───────────────────────────────────────────────────────────
  /** Search real Adoption accounts to pick recipients (no free-typed addresses: only people with an account). */
  async searchRecipients(q: string) {
    const term = q.trim();
    const where: Prisma.AdoptionUserWhereInput = { isActive: true, emailVerified: true, ...(term ? { OR: [{ email: { contains: term, mode: "insensitive" } }, { fullName: { contains: term, mode: "insensitive" } }] } : {}) };
    const users = await this.d.db.adoptionUser.findMany({ where, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, fullName: true, email: true, marketingEmailOptIn: true, emailUnsubscribedAt: true } });
    return users.map((u) => ({ id: u.id, name: u.fullName, email: u.email, marketingOptIn: u.marketingEmailOptIn, unsubscribed: Boolean(u.emailUnsubscribedAt) }));
  }

  /** Send a template to chosen accounts now, or at `scheduledFor`. Returns what happened per person. */
  async manualSend(input: { templateId: string; userIds: string[]; scheduledFor?: string | null }, adminId?: string) {
    const ids = [...new Set(input.userIds.filter((x) => typeof x === "string" && x))];
    if (ids.length === 0) throw new EmailError("Choose at least one recipient.");
    if (ids.length > MAX_MANUAL_RECIPIENTS) throw new EmailError(`Send to at most ${MAX_MANUAL_RECIPIENTS} people at a time.`);
    const t = await this.getTemplate(input.templateId);
    if (t.status !== "ACTIVE") throw new EmailError("Only an active template can be sent.");
    this.requireConfigured();
    const now = this.now();
    let when: Date | null = null;
    if (input.scheduledFor) {
      when = new Date(input.scheduledFor);
      if (Number.isNaN(when.getTime())) throw new EmailError("The scheduled time is not valid.");
      if (when.getTime() <= now.getTime() + 30_000) when = null; // effectively now
      else if (!this.d.isEnabled()) throw new EmailError("Scheduled sending needs the email automation engine switched on (EMAIL_AUTOMATION_ENABLED=true).", 409);
      else if (when.getTime() > now.getTime() + 365 * 86_400_000) throw new EmailError("Choose a time within the next year.");
    }
    const users = await this.d.db.adoptionUser.findMany({ where: { id: { in: ids } } });
    const results: { userId: string; email?: string; outcome: "queued" | "sent" | "skipped" | "duplicate" | "failed" | "needs_review"; reason?: string }[] = [];
    for (const id of ids) {
      const u = users.find((x) => x.id === id);
      if (!u) {
        results.push({ userId: id, outcome: "skipped", reason: "UNKNOWN_RECIPIENT" });
        continue;
      }
      const built = this.buildSnapshot(t, u, "MANUAL_SEND");
      const common = { userId: u.id, templateId: t.id, trigger: "MANUAL_SEND" as const, scheduledFor: when ?? now, dedupeKey: manualKey(t.id, u.id, when, now.getTime()), createdById: adminId };
      let msg: EmailMessage;
      try {
        msg = await this.d.db.emailMessage.create({
          data: built.ok
            ? { ...common, ...built.snap, status: when ? "QUEUED" : "SENDING", attempts: when ? 0 : 1, lockedAt: when ? null : now }
            : { ...common, toEmail: normalizeEmail(u.email), subject: oneLine(t.subject), status: "SKIPPED", failureReason: built.reason },
        });
      } catch (e) {
        if (isUniqueViolation(e)) {
          results.push({ userId: id, email: u.email, outcome: "duplicate", reason: "ALREADY_SENT_OR_QUEUED" });
          continue;
        }
        throw e;
      }
      if (!built.ok) results.push({ userId: id, email: u.email, outcome: "skipped", reason: built.reason });
      else if (when) results.push({ userId: id, email: u.email, outcome: "queued" });
      else {
        const r = await this.deliver(msg.id);
        results.push({ userId: id, email: u.email, outcome: r.status === "SENT" ? "sent" : r.status === "UNCONFIRMED" ? "needs_review" : r.status === "QUEUED" ? "queued" : "failed", reason: r.reason });
      }
    }
    return { results };
  }

  // ─── scheduled / activity ──────────────────────────────────────────────────
  listScheduled() {
    return this.d.db.emailMessage.findMany({
      where: { status: { in: ["QUEUED", "SENDING"] }, isTest: false },
      orderBy: { scheduledFor: "asc" },
      take: 200,
      select: {
        id: true, toEmail: true, subject: true, status: true, trigger: true, scheduledFor: true, attempts: true, failureReason: true, createdAt: true,
        template: { select: { name: true } }, automation: { select: { name: true } },
      },
    });
  }

  async cancelScheduled(id: string) {
    const r = await this.d.db.emailMessage.updateMany({ where: { id, status: "QUEUED" }, data: { status: "CANCELLED", failureReason: "CANCELLED_BY_ADMIN" } });
    if (r.count === 0) throw new EmailError("This email can no longer be cancelled (already sending or sent).", 409);
  }

  async activity(q: { search?: string; status?: string; page?: number; limit?: number; automationId?: string }) {
    const limit = Math.min(Math.max(q.limit ?? 25, 1), 100);
    const page = Math.max(q.page ?? 1, 1);
    const where: Prisma.EmailMessageWhereInput = {
      ...(q.status && q.status !== "ALL" ? { status: q.status as never } : {}),
      ...(q.automationId ? { automationId: q.automationId } : {}),
      ...(q.search?.trim()
        ? { OR: [{ toEmail: { contains: q.search.trim(), mode: "insensitive" } }, { subject: { contains: q.search.trim(), mode: "insensitive" } }] }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.d.db.emailMessage.count({ where }),
      this.d.db.emailMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        // Content snapshots are never sent to the browser.
        select: {
          id: true, toEmail: true, subject: true, status: true, trigger: true, scheduledFor: true, attempts: true, sentAt: true, deliveredAt: true,
          failureReason: true, resendId: true, isTest: true, createdAt: true, maybeAccepted: true,
          template: { select: { name: true } }, automation: { select: { name: true } },
        },
      }),
    ]);
    return { total, page, limit, items };
  }

  /**
   * Explicit operator retry of a FAILED email. FAILED only ever means the provider definitely refused it (anything uncertain
   * is UNCONFIRMED), so a fresh idempotency key cannot duplicate. It sends the ORIGINAL snapshot, not the current template.
   */
  async retry(id: string) {
    const m = await this.d.db.emailMessage.findUnique({ where: { id } });
    if (!m || m.status !== "FAILED") throw new EmailError("Only a failed email can be retried.", 409);
    if (m.maybeAccepted) throw new EmailError("This email may already have been accepted by Resend. Resolve it as sent or not sent instead of retrying.", 409);
    if (!m.bodyHtml || !m.bodyText) throw new EmailError("The content of this email is no longer stored, so it cannot be retried.", 409);
    const r = await this.d.db.emailMessage.updateMany({
      where: { id, status: "FAILED", maybeAccepted: false },
      data: { status: "QUEUED", scheduledFor: this.now(), attempts: MAX_ATTEMPTS - 1, retryEpoch: { increment: 1 }, failureReason: null },
    });
    if (r.count === 0) throw new EmailError("Only a failed email can be retried.", 409);
    if (!this.d.isEnabled()) await this.processDue(); // engine off: nothing else would pick it up
    return { queued: true };
  }

  /**
   * Reconciles an UNCONFIRMED email once an admin has checked Resend (dashboard / logs) for that recipient and subject.
   * "SENT": it was accepted. "NOT_SENT": it was not; the message is closed and never retried. Neither sends anything.
   * To send again after NOT_SENT, send a fresh manual email (a deliberate new message).
   */
  async resolveUnconfirmed(id: string, outcome: "SENT" | "NOT_SENT") {
    if (outcome !== "SENT" && outcome !== "NOT_SENT") throw new EmailError("Choose whether the email was sent or not.");
    const clear = { bodyHtml: null, bodyText: null, lockedAt: null };
    const r = await this.d.db.emailMessage.updateMany({
      where: { id, status: "UNCONFIRMED" },
      data: outcome === "SENT" ? { ...clear, status: "SENT", sentAt: this.now(), failureReason: "CONFIRMED_SENT_BY_ADMIN" } : { ...clear, status: "CANCELLED", failureReason: "CONFIRMED_NOT_SENT" },
    });
    if (r.count === 0) throw new EmailError("Only an email that needs review can be resolved.", 409);
  }

  // ─── events (real application events only) ─────────────────────────────────
  /**
   * Called after a real event has been saved. USER_REGISTERED: a person verified their email (or signed up with Google).
   * DEMO_REQUESTED: a demo request linked to a signed-in account. Never throws into the caller's flow.
   * The email is rendered and stored now; later template edits do not change it.
   */
  async handleEvent(ev: { event: AnchorEvent; userId: string; subjectId: string }): Promise<{ queued: number; skipped: number; duplicates: number }> {
    const out = { queued: 0, skipped: 0, duplicates: 0 };
    if (!this.d.isEnabled() || !this.d.isConfigured()) return out;
    const user = await this.d.db.adoptionUser.findUnique({ where: { id: ev.userId } });
    if (!user) return out;
    const autos = await this.d.db.emailAutomation.findMany({
      where: { isActive: true, OR: [...(ev.event === "USER_REGISTERED" ? [{ trigger: "USER_REGISTERED" as const }] : []), { trigger: "FOLLOW_UP" as const, anchorEvent: ev.event }] },
      include: { template: true },
    });
    const now = this.now();
    for (const a of autos) {
      const built = a.template.status === "ACTIVE" ? this.buildSnapshot(a.template, user, a.trigger) : ({ ok: false, reason: "TEMPLATE_NOT_ACTIVE" } as const);
      const common = { userId: user.id, templateId: a.templateId, automationId: a.id, trigger: a.trigger, scheduledFor: new Date(now.getTime() + a.delayMinutes * 60_000), dedupeKey: autoKey(a.id, ev.event, ev.subjectId) };
      try {
        await this.d.db.emailMessage.create({
          data: built.ok ? { ...common, ...built.snap, status: "QUEUED" } : { ...common, toEmail: normalizeEmail(user.email), subject: oneLine(a.template.subject), status: "SKIPPED", failureReason: built.reason },
        });
        if (built.ok) out.queued++;
        else out.skipped++;
      } catch (e) {
        if (isUniqueViolation(e)) out.duplicates++;
        else throw e;
      }
    }
    return out;
  }

  // ─── worker ────────────────────────────────────────────────────────────────
  /** One pass of the background worker. Safe to run from several processes: every step is claimed atomically. */
  async processDue(): Promise<{ sent: number; failed: number; cancelled: number; fired: number; review: number }> {
    const res = { sent: 0, failed: 0, cancelled: 0, fired: 0, review: 0 };
    if (!this.d.isConfigured()) return res;
    const now = this.now();
    if (this.d.isEnabled()) res.fired = await this.fireScheduledAutomations(now);

    await this.recoverStale(now);
    // Too old to still be wanted (long outage): cancel instead of sending late. Possibly-accepted ones are handled above.
    const expired = await this.d.db.emailMessage.updateMany({ where: { status: "QUEUED", maybeAccepted: false, scheduledFor: { lt: new Date(now.getTime() - MESSAGE_TTL_MS) } }, data: { status: "CANCELLED", failureReason: "EXPIRED" } });
    res.cancelled += expired.count;

    const due = await this.d.db.emailMessage.findMany({ where: { status: "QUEUED", scheduledFor: { lte: now } }, orderBy: { scheduledFor: "asc" }, take: BATCH, select: { id: true } });
    for (const { id } of due) {
      const claimed = await this.d.db.emailMessage.updateMany({ where: { id, status: "QUEUED" }, data: { status: "SENDING", lockedAt: now, attempts: { increment: 1 } } });
      if (claimed.count !== 1) continue; // another worker has it
      const r = await this.deliver(id);
      if (r.status === "SENT") res.sent++;
      else if (r.status === "CANCELLED" || r.status === "SKIPPED") res.cancelled++;
      else if (r.status === "FAILED") res.failed++;
      else if (r.status === "UNCONFIRMED") res.review++;
    }
    await this.reconcileWebhookEvents(now);
    return res;
  }

  /**
   * Crash recovery. A worker that died mid-send leaves SENDING rows; the provider may or may not have accepted the request.
   * Within the idempotency window the SAME snapshot is re-sent under the SAME key (safe: Resend returns the original result).
   * Past the window a re-send could duplicate, so the message is parked as UNCONFIRMED for a human.
   */
  private async recoverStale(now: Date) {
    const stale = await this.d.db.emailMessage.findMany({ where: { status: "SENDING", lockedAt: { lt: new Date(now.getTime() - STALE_LOCK_MS) } } });
    for (const m of stale) {
      const since = m.firstAttemptAt ?? m.lockedAt ?? now;
      if (now.getTime() - since.getTime() > SAFE_IDEMPOTENCY_WINDOW_MS) await this.d.db.emailMessage.updateMany({ where: { id: m.id, status: "SENDING" }, data: { status: "UNCONFIRMED", lockedAt: null, maybeAccepted: true, firstAttemptAt: since, failureReason: "WORKER_STOPPED_BEFORE_RESULT" } });
      else await this.d.db.emailMessage.updateMany({ where: { id: m.id, status: "SENDING" }, data: { status: "QUEUED", lockedAt: null, maybeAccepted: true, firstAttemptAt: since } });
    }
    // Retrying a possibly-accepted message after the window could duplicate: park it.
    await this.d.db.emailMessage.updateMany({
      where: { status: "QUEUED", maybeAccepted: true, firstAttemptAt: { lt: new Date(now.getTime() - SAFE_IDEMPOTENCY_WINDOW_MS) } },
      data: { status: "UNCONFIRMED", failureReason: "IDEMPOTENCY_WINDOW_PASSED" },
    });
  }

  /** SCHEDULED_EMAIL automations whose time has come: queue one email per eligible account (once). Overdue ones expire. */
  private async fireScheduledAutomations(now: Date): Promise<number> {
    const stale = new Date(now.getTime() - SCHEDULE_GRACE_MS);
    await this.d.db.emailAutomation.updateMany({ where: { trigger: "SCHEDULED_EMAIL", isActive: true, firedAt: null, expiredAt: null, scheduledAt: { lt: stale } }, data: { expiredAt: now, isActive: false } });
    const due = await this.d.db.emailAutomation.findMany({ where: { trigger: "SCHEDULED_EMAIL", isActive: true, firedAt: null, expiredAt: null, scheduledAt: { lte: now } }, include: { template: true } });
    let fired = 0;
    for (const a of due) {
      // Defence in depth: a broadcast never runs from a non-promotional or inactive template, however it got here.
      if (a.template.status !== "ACTIVE" || a.template.type !== "PROMOTIONAL") {
        await this.d.db.emailAutomation.update({ where: { id: a.id }, data: { isActive: false, expiredAt: now } });
        continue;
      }
      if (this.d.unsubscribeUrl("probe") === null) continue; // cannot send promotional mail without an unsubscribe link
      let cursor: string | undefined;
      for (;;) {
        const users = await this.d.db.adoptionUser.findMany({
          where: { isActive: true, emailVerified: true, marketingEmailOptIn: true, emailUnsubscribedAt: null },
          orderBy: { id: "asc" },
          take: 500,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        });
        if (users.length === 0) break;
        const rows: Prisma.EmailMessageCreateManyInput[] = [];
        for (const u of users) {
          const built = this.buildSnapshot(a.template, u, "SCHEDULED_EMAIL");
          if (!built.ok) continue;
          rows.push({ ...built.snap, userId: u.id, templateId: a.templateId, automationId: a.id, trigger: a.trigger, scheduledFor: now, dedupeKey: autoKey(a.id, "SCHEDULED", u.id) });
        }
        // The unique dedupe key makes re-running this (e.g. after a crash) harmless.
        if (rows.length) await this.d.db.emailMessage.createMany({ data: rows, skipDuplicates: true });
        cursor = users[users.length - 1].id;
        if (users.length < 500) break;
      }
      await this.d.db.emailAutomation.update({ where: { id: a.id }, data: { firedAt: now, isActive: false } });
      fired++;
    }
    return fired;
  }

  /**
   * Re-checks the recipient and automation at send time (the world may have changed since queueing), then sends the STORED
   * snapshot. The template is deliberately not consulted: edits or archiving after queueing must not change a queued email.
   */
  private async deliver(id: string): Promise<{ status: string; reason?: string }> {
    const m = await this.d.db.emailMessage.findUnique({ where: { id }, include: { automation: true } });
    if (!m || m.status !== "SENDING") return { status: m?.status ?? "MISSING" };
    const stop = async (status: "CANCELLED" | "SKIPPED" | "FAILED", reason: string) => {
      // Never close a possibly-accepted message as an ordinary outcome.
      const final = m.maybeAccepted ? "UNCONFIRMED" : status;
      await this.d.db.emailMessage.update({ where: { id }, data: { status: final, failureReason: reason, lockedAt: null } });
      return { status: final, reason };
    };
    if (m.automationId && (!m.automation || !m.automation.isActive) && !(m.automation?.trigger === "SCHEDULED_EMAIL" && m.automation.firedAt)) return stop("CANCELLED", "AUTOMATION_OFF");
    if (!m.userId) return stop("SKIPPED", "NO_RECIPIENT_RECORD");
    const user = await this.d.db.adoptionUser.findUnique({ where: { id: m.userId } });
    if (!user) return stop("SKIPPED", "UNKNOWN_RECIPIENT");
    // Consent is judged by the type recorded when it was queued (a broadcast is always promotional), against the person's CURRENT state.
    const ok = canEmail(effectiveType(m.trigger, m.templateType), user);
    if (!ok.ok) return stop("SKIPPED", ok.reason);
    if (normalizeEmail(user.email) !== m.toEmail) return stop("SKIPPED", "RECIPIENT_EMAIL_CHANGED");
    if (!m.bodyHtml || !m.bodyText || !m.contentHash) return stop("CANCELLED", "NO_SNAPSHOT");
    if (payloadHash({ toEmail: m.toEmail, subject: m.subject, html: m.bodyHtml, text: m.bodyText, listUnsubscribe: m.listUnsubscribe }) !== m.contentHash) return stop("FAILED", "CONTENT_CHANGED");
    return this.transmit(m);
  }

  /**
   * The only place that calls the provider. It sends exactly the stored snapshot under `email-msg-<id>-<retryEpoch>`.
   * The key is only replaced by an explicit retry of a message the provider definitely refused, so it never covers two payloads.
   */
  private async transmit(m: EmailMessage): Promise<{ status: string; reason?: string }> {
    if (!m.bodyHtml || !m.bodyText) return { status: "FAILED", reason: "NO_SNAPSHOT" };
    const now = this.now();
    let sent: { id: string };
    try {
      sent = await withTimeout(
        this.d.sender.send({
          to: m.toEmail,
          subject: m.subject,
          html: m.bodyHtml,
          text: m.bodyText,
          idempotencyKey: `email-msg-${m.id}-${m.retryEpoch}`,
          ...(m.listUnsubscribe ? { headers: { "List-Unsubscribe": m.listUnsubscribe, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
        }),
        SEND_TIMEOUT_MS,
      );
    } catch (e) {
      return this.afterSendFailure(m, e, now);
    }
    // Resend has accepted it. Record that OUTSIDE the failure handling above: if this write fails (database down, process killed),
    // the row stays SENDING, and crash recovery re-sends the same snapshot under the same key, which the provider de-duplicates.
    // Content is no longer needed once accepted: keep stored personal data to a minimum.
    await this.d.db.emailMessage.update({ where: { id: m.id }, data: { status: "SENT", resendId: sent.id, sentAt: now, lockedAt: null, failureReason: null, bodyHtml: null, bodyText: null } });
    try {
      await this.applyBufferedEvents(sent.id); // delivery events that raced ahead of this update
    } catch {
      /* the worker's reconcile pass applies them later; the email itself is already recorded as SENT */
    }
    return { status: "SENT" };
  }

  /** Decides what a failed provider call means. A message that might have been accepted is never reported as an ordinary failure. */
  private async afterSendFailure(m: EmailMessage, err: unknown, now: Date): Promise<{ status: string; reason?: string }> {
    const o = classifySendError(err);
    const uncertain = o.kind === "AMBIGUOUS" || o.kind === "IN_FLIGHT" || o.kind === "CONFLICT";
    const maybe = m.maybeAccepted || uncertain;
    const track = maybe ? { maybeAccepted: true, firstAttemptAt: m.firstAttemptAt ?? now } : {};
    const finish = async (status: "FAILED" | "UNCONFIRMED") => {
      await this.d.db.emailMessage.update({ where: { id: m.id }, data: { status, failureReason: o.reason, lockedAt: null, ...track } });
      return { status, reason: o.reason };
    };
    if (m.isTest) return finish("FAILED"); // test emails are never retried or reconciled
    if (o.kind === "CONFLICT") return finish("UNCONFIRMED");
    const retryable = o.kind === "TRANSIENT" || o.kind === "AMBIGUOUS" || o.kind === "IN_FLIGHT";
    if (!retryable || m.attempts >= MAX_ATTEMPTS) return finish(maybe ? "UNCONFIRMED" : "FAILED");
    await this.d.db.emailMessage.update({
      where: { id: m.id },
      data: { status: "QUEUED", failureReason: `Retrying: ${o.reason}`, lockedAt: null, scheduledFor: new Date(now.getTime() + backoffMinutes(m.attempts) * 60_000), ...track },
    });
    return { status: "QUEUED", reason: o.reason };
  }

  // ─── unsubscribe + webhook ─────────────────────────────────────────────────
  async unsubscribe(userId: string) {
    await this.d.db.adoptionUser.updateMany({ where: { id: userId, emailUnsubscribedAt: null }, data: { emailUnsubscribedAt: this.now() } });
    // Anything promotional still waiting for this person is cancelled (a broadcast is always recorded as promotional).
    await this.d.db.emailMessage.updateMany({ where: { userId, status: "QUEUED", templateType: "PROMOTIONAL" }, data: { status: "CANCELLED", failureReason: "UNSUBSCRIBED" } });
  }

  /**
   * Delivery updates from Resend (signature already verified by the caller). Event shape per the Resend SDK:
   * `{ type, created_at, data: { email_id, bounce?.message, failed?.reason, suppressed?.message } }`.
   * An event for a message we cannot match yet (it raced ahead of the SENT update) is stored, not dropped, and applied as soon as
   * the message is known. Applying is idempotent and monotonic, so a provider retry of the same event changes nothing.
   */
  async handleWebhookEvent(type: string, data: Record<string, any>, meta: { eventId?: string; occurredAt?: Date } = {}) {
    const resendId: string | undefined = data?.email_id;
    if (!resendId || !HANDLED_EVENTS.has(type)) return;
    const detail = (type === "email.bounced" ? data.bounce?.message : type === "email.failed" ? data.failed?.reason : type === "email.suppressed" ? data.suppressed?.message : undefined) as string | undefined;
    const known = await this.d.db.emailMessage.findUnique({ where: { resendId } });
    if (known) {
      await this.applyEvent(known, type, detail);
      return;
    }
    try {
      await this.d.db.emailWebhookEvent.create({
        data: { svixId: meta.eventId ?? `${resendId}:${type}`, resendId, type, detail: detail?.slice(0, 300) ?? null, occurredAt: meta.occurredAt ?? this.now() },
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e; // already buffered by an earlier delivery of the same event
    }
    // Close the window where the SENT update committed between the lookup above and this insert.
    if (await this.d.db.emailMessage.findUnique({ where: { resendId } })) await this.applyBufferedEvents(resendId);
  }

  /** Statuses only move forward: delivered never overwrites a bounce, and replaying an event is a no-op. */
  private async applyEvent(m: EmailMessage, type: string, detail?: string) {
    const live = m.status === "SENT" || m.status === "DELIVERED";
    const set = (data: Prisma.EmailMessageUpdateManyMutationInput, from: string[]) => this.d.db.emailMessage.updateMany({ where: { id: m.id, status: { in: from as never } }, data });
    switch (type) {
      case "email.delivered":
        await set({ status: "DELIVERED", deliveredAt: this.now() }, ["SENT"]);
        break;
      case "email.bounced":
        if (live) await set({ status: "BOUNCED", failureReason: (detail ?? "Bounced").slice(0, 300) }, ["SENT", "DELIVERED"]);
        break;
      case "email.failed":
      case "email.suppressed":
        if (live) await set({ status: "FAILED", failureReason: (detail ?? (type === "email.failed" ? "Failed" : "Suppressed by Resend")).slice(0, 300) }, ["SENT", "DELIVERED"]);
        break;
      case "email.complained":
        await set({ status: "COMPLAINED", failureReason: "Marked as spam" }, ["SENT", "DELIVERED", "BOUNCED"]);
        if (m.userId) await this.unsubscribe(m.userId); // idempotent
        break;
    }
  }

  /** Applies stored events for a message in the order they happened, then marks them applied. */
  private async applyBufferedEvents(resendId: string) {
    const events = await this.d.db.emailWebhookEvent.findMany({ where: { resendId, appliedAt: null }, orderBy: { occurredAt: "asc" } });
    for (const ev of events) {
      const m = await this.d.db.emailMessage.findUnique({ where: { resendId } }); // re-read: each event may change the status
      if (!m) return;
      await this.applyEvent(m, ev.type, ev.detail ?? undefined);
      await this.d.db.emailWebhookEvent.updateMany({ where: { id: ev.id, appliedAt: null }, data: { appliedAt: this.now() } });
    }
  }

  /** Safety net run by the worker: apply anything that matches now, drop what never will (events for other emails in the account). */
  private async reconcileWebhookEvents(now: Date) {
    const pending = await this.d.db.emailWebhookEvent.findMany({ where: { appliedAt: null }, orderBy: { receivedAt: "asc" }, take: 200 });
    for (const resendId of new Set(pending.map((e) => e.resendId))) {
      if (await this.d.db.emailMessage.findUnique({ where: { resendId } })) await this.applyBufferedEvents(resendId);
    }
    await this.d.db.emailWebhookEvent.deleteMany({ where: { appliedAt: null, receivedAt: { lt: new Date(now.getTime() - UNMATCHED_EVENT_TTL_MS) } } });
    await this.d.db.emailWebhookEvent.deleteMany({ where: { appliedAt: { lt: new Date(now.getTime() - APPLIED_EVENT_TTL_MS) } } });
  }

  private requireConfigured() {
    if (!this.d.isConfigured()) throw new EmailError("Email sending is not configured on the server (RESEND_API_KEY and SMTP_FROM_EMAIL).", 503);
  }
}

const HANDLED_EVENTS = new Set(["email.delivered", "email.bounced", "email.failed", "email.suppressed", "email.complained"]);

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("Sending timed out."), { name: "SendTimeout" })), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

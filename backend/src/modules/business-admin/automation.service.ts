import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import { eventByKey, EVENTS } from "./automation.events.js";
import { cleanParam, type TemplateDto, type TemplatesService } from "./templates.service.js";
import type { AutomationStore, ExecutionRecord, HistoryEntry, RuleRecord, VariableMapping } from "./automation.store.js";
import type { InboxService } from "./inbox.service.js";
import type { InboxStore } from "./inbox.types.js";
import { InboxError } from "./inbox.errors.js";

export type AutomationErrorCode = "VALIDATION" | "NOT_FOUND";
export class AutomationError extends ApiError {
  constructor(readonly code: AutomationErrorCode, message: string, statusCode: number, readonly field?: string) {
    super(message, statusCode);
    Object.setPrototypeOf(this, AutomationError.prototype);
  }
}
const bad = (message: string, field?: string) => new AutomationError("VALIDATION", message, STATUS_CODES.BAD_REQUEST, field);

export interface RuleInput {
  name: unknown;
  triggerEvent: unknown;
  templateName: unknown;
  templateLanguage: unknown;
  variableMapping: unknown;
}

/** Retryable Meta error codes: rate limits and transient platform errors. Everything else is final. */
const TRANSIENT_CODES = new Set([130429, 131056, 131048, 131000, 2, 4, 17, 80007]);
/** Stable skip reasons (never retried): the message must not be sent. */
const SKIP_CODES = new Set(["CONSENT_WITHDRAWN", "OPT_IN_REQUIRED", "WINDOW_CLOSED", "TEMPLATE_INVALID", "NO_CONVERSATION"]);
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000];
export const QUEUE_TTL_MS = 6 * 60 * 60_000;
const STALE_SENDING_MS = 5 * 60_000;
const MAX_NAME = 120;

export interface AutomationDeps {
  store: AutomationStore;
  templates: TemplatesService;
  inbox: InboxService;
  inboxStore: InboxStore;
  /** Master switch (WHATSAPP_AUTOMATION_ENABLED). Off = events are recorded as SKIPPED and nothing is ever sent. */
  isEnabled: () => boolean;
  now?: () => Date;
}

export interface TriggerInput {
  event: string;
  /** Unique id of the thing that happened (e.g. an order id). The same (rule, eventId) never sends twice. */
  eventId: string;
  /** Recipient WhatsApp number, any format ("+91 98765 43210"). */
  phone: string;
  fields?: Record<string, unknown>;
}
export interface TriggerResult {
  matched: number;
  queued: number;
  skipped: number;
  duplicates: number;
}

/** Digits only, 8-15 long (E.164 without +). Returns null when it cannot be a WhatsApp number. */
export const normalizePhone = (raw: unknown): string | null => {
  const d = String(raw ?? "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 15 ? d : null;
};

/** Pure: fills the template's variables from the event fields. Returns the missing variable on failure. */
export function resolveVariables(template: Pick<TemplateDto, "variables">, mapping: VariableMapping, fields: Record<string, unknown>): { ok: true; params: string[] } | { ok: false; variable: string } {
  const params: string[] = [];
  for (const v of template.variables) {
    const m = mapping[v];
    let value: string | null = null;
    if (m?.source === "static") value = cleanParam(m.value);
    else if (m?.source === "field") value = cleanParam(fields[m.key] === undefined || fields[m.key] === null ? "" : String(fields[m.key])) ?? cleanParam(m.fallback ?? "");
    if (value === null) return { ok: false, variable: v };
    params.push(value);
  }
  return { ok: true, params };
}

const entry = (event: string, detail?: string, at = new Date()): HistoryEntry => ({ at: at.toISOString(), event, ...(detail ? { detail: detail.slice(0, 300) } : {}) });

export class AutomationService {
  private readonly now: () => Date;
  constructor(private readonly deps: AutomationDeps) {
    this.now = deps.now ?? (() => new Date());
  }

  events() {
    return EVENTS;
  }

  // ─── rules ────────────────────────────────────────────────────────────────
  /** Validates a rule against the catalog and the REAL approved template list. Nothing unapproved can be attached. */
  private async validateRule(input: RuleInput): Promise<{ name: string; triggerEvent: string; templateName: string; templateLanguage: string; variableMapping: VariableMapping }> {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) throw bad("Give the automation a name.", "name");
    if (name.length > MAX_NAME) throw bad(`The name can be at most ${MAX_NAME} characters.`, "name");
    const triggerEvent = String(input.triggerEvent ?? "");
    const ev = eventByKey(triggerEvent);
    if (!ev) throw bad("Choose a trigger event.", "triggerEvent");
    const templateName = String(input.templateName ?? "");
    const templateLanguage = String(input.templateLanguage ?? "");
    let template: TemplateDto | undefined;
    try {
      template = (await this.deps.templates.list()).find((t) => t.name === templateName && t.language === templateLanguage);
    } catch {
      throw new AutomationError("VALIDATION", "Could not load approved templates from WhatsApp right now, so the rule was not saved.", STATUS_CODES.SERVICE_UNAVAILABLE, "templateName");
    }
    if (!template) throw bad("Choose a template that exists in your WhatsApp Business account.", "templateName");
    if (!template.sendable) throw bad(template.unsupportedReason ?? "This template cannot be used for automations.", "templateName");

    const raw = (input.variableMapping && typeof input.variableMapping === "object" ? input.variableMapping : {}) as Record<string, any>;
    const mapping: VariableMapping = {};
    for (const v of template.variables) {
      const m = raw[v];
      if (!m || typeof m !== "object") throw bad(`Choose a value for {{${v}}}.`, `variableMapping.${v}`);
      if (m.source === "static") {
        const value = cleanParam(m.value);
        if (value === null) throw bad(`Enter the fixed text for {{${v}}}.`, `variableMapping.${v}`);
        mapping[v] = { source: "static", value };
      } else if (m.source === "field") {
        if (!ev.fields.some((f) => f.key === m.key)) throw bad(`"${String(m.key)}" is not available for this trigger event.`, `variableMapping.${v}`);
        const fallback = m.fallback === undefined || m.fallback === "" ? undefined : cleanParam(m.fallback);
        if (m.fallback && fallback === null) throw bad(`The fallback for {{${v}}} is not valid.`, `variableMapping.${v}`);
        mapping[v] = { source: "field", key: String(m.key), ...(fallback ? { fallback } : {}) };
      } else throw bad(`Choose a value for {{${v}}}.`, `variableMapping.${v}`);
    }
    return { name, triggerEvent, templateName, templateLanguage, variableMapping: mapping };
  }

  async listRules(): Promise<RuleRecord[]> {
    return this.deps.store.listRules();
  }

  /** New rules are ALWAYS created inactive: enabling is a separate, deliberate action. */
  async createRule(input: RuleInput, userId: string): Promise<RuleRecord> {
    const v = await this.validateRule(input);
    return this.deps.store.createRule({ ...v, isActive: false, createdByUserId: userId, updatedByUserId: userId });
  }

  async updateRule(id: string, input: RuleInput, userId: string): Promise<RuleRecord> {
    await this.needRule(id);
    const v = await this.validateRule(input);
    return this.deps.store.updateRule(id, { ...v, updatedByUserId: userId });
  }

  async setActive(id: string, active: boolean, userId: string): Promise<RuleRecord> {
    const rule = await this.needRule(id);
    if (active) {
      // Re-check the template is still approved before switching a rule on.
      await this.validateRule({ ...rule });
    }
    return this.deps.store.updateRule(id, { isActive: active, updatedByUserId: userId });
  }

  async deleteRule(id: string): Promise<void> {
    await this.needRule(id);
    await this.deps.store.deleteRule(id);
  }

  private async needRule(id: string): Promise<RuleRecord> {
    const r = await this.deps.store.getRule(id);
    if (!r) throw new AutomationError("NOT_FOUND", "Automation not found.", STATUS_CODES.NOT_FOUND);
    return r;
  }

  // ─── triggering ───────────────────────────────────────────────────────────
  /**
   * The reusable entry point. Endpoints call this when something happens. It only RECORDS work: it resolves variables and
   * queues one execution per matching active rule (idempotent per rule + eventId). Sending happens later in processDue(),
   * and only when the master switch is on. It never throws for a bad event: problems are recorded, so a caller's own
   * request is never broken by automation.
   */
  async trigger(input: TriggerInput): Promise<TriggerResult> {
    const result: TriggerResult = { matched: 0, queued: 0, skipped: 0, duplicates: 0 };
    try {
      if (!eventByKey(input.event) || !input.eventId) return result;
      const rules = await this.deps.store.activeRulesFor(input.event);
      const phone = normalizePhone(input.phone);
      const enabled = this.deps.isEnabled();
      const now = this.now();
      for (const rule of rules) {
        result.matched++;
        const base = {
          ruleId: rule.id, ruleName: rule.name, triggerEvent: rule.triggerEvent, eventId: String(input.eventId).slice(0, 200),
          idempotencyKey: `${rule.id}:${String(input.eventId).slice(0, 200)}`, contactWaId: phone ?? "", templateName: rule.templateName,
          templateLanguage: rule.templateLanguage, expiresAt: new Date(now.getTime() + QUEUE_TTL_MS),
        };
        const skip = async (reason: string, detail: string, params: string[] = []) => {
          const r = await this.deps.store.createExecution({ ...base, params, status: "SKIPPED", skipReason: reason, nextAttemptAt: null, history: [entry("skipped", detail, now)] });
          if (r.created) result.skipped++;
          else result.duplicates++;
        };
        if (!phone) {
          await skip("NO_PHONE", "The event had no valid WhatsApp phone number.");
          continue;
        }
        if (!enabled) {
          await skip("AUTOMATION_DISABLED", "Automation sending is switched off on this server.");
          continue;
        }
        const template = await this.findTemplate(rule);
        if (!template) {
          await skip("TEMPLATE_UNAVAILABLE", "The template is not approved or no longer exists.");
          continue;
        }
        const vars = resolveVariables(template, rule.variableMapping, input.fields ?? {});
        if (!vars.ok) {
          await skip("MISSING_VARIABLE", `No value for {{${vars.variable}}} and no fallback.`);
          continue;
        }
        const r = await this.deps.store.createExecution({ ...base, params: vars.params, status: "QUEUED", nextAttemptAt: now, history: [entry("queued", undefined, now)] });
        if (r.created) result.queued++;
        else result.duplicates++;
      }
    } catch (err) {
      logger.error(`[Automation] trigger failed: ${err instanceof Error ? err.name : "unknown error"}`);
    }
    return result;
  }

  private async findTemplate(rule: Pick<RuleRecord, "templateName" | "templateLanguage">): Promise<TemplateDto | undefined> {
    try {
      const t = (await this.deps.templates.list()).find((x) => x.name === rule.templateName && x.language === rule.templateLanguage);
      return t && t.sendable ? t : undefined;
    } catch {
      return undefined;
    }
  }

  // ─── queue worker ─────────────────────────────────────────────────────────
  /** Sends everything that is due. Safe to call concurrently (each row is claimed atomically). Does nothing when disabled. */
  async processDue(limit = 20): Promise<{ processed: number }> {
    if (!this.deps.isEnabled()) return { processed: 0 };
    const now = this.now();
    // A worker that died mid-send: we cannot know whether WhatsApp got it, so it is NEVER resent.
    for (const e of await this.deps.store.staleSending(new Date(now.getTime() - STALE_SENDING_MS), 20)) {
      await this.deps.store.updateExecution(e.id, { status: "FAILED", lastError: "Sending was interrupted; delivery is unconfirmed, so it was not resent.", history: [...e.history, entry("unconfirmed", "interrupted mid-send", now)] });
    }
    let processed = 0;
    for (const due of await this.deps.store.dueExecutions(now, limit)) {
      const claimed = await this.deps.store.claim(due.id, now);
      if (!claimed) continue;
      processed++;
      await this.attempt(claimed);
    }
    return { processed };
  }

  private async attempt(exec: ExecutionRecord): Promise<void> {
    const now = this.now();
    const n = exec.attempts + 1;
    const hist = [...exec.history];
    const finish = (patch: Parameters<AutomationStore["updateExecution"]>[1], event: string, detail?: string) =>
      this.deps.store.updateExecution(exec.id, { lockedAt: null, ...patch, history: [...hist, entry(event, detail, this.now())] });

    if (exec.expiresAt <= now) {
      await finish({ status: "SKIPPED", skipReason: "EXPIRED", nextAttemptAt: null }, "skipped", "Too old to send safely.");
      return;
    }
    try {
      const sent = await this.deps.inbox.sendTemplate({
        contactWaId: exec.contactWaId,
        clientRequestId: `auto:${exec.id}:${n}`,
        userId: "automation",
        name: exec.templateName,
        language: exec.templateLanguage,
        params: exec.params,
      });
      const m = sent.message;
      if (m.state === "failed" || m.state === "unconfirmed") {
        const ambiguous = m.state === "unconfirmed" || m.error?.ambiguous === true;
        const code = m.error?.code ?? null;
        const detail = m.error?.title ?? "WhatsApp did not accept the message.";
        const retry = !ambiguous && code !== null && TRANSIENT_CODES.has(code) && n < exec.maxAttempts;
        if (retry) {
          await finish({ status: "QUEUED", attempts: n, messageId: m.id, lastErrorCode: code, lastError: detail, nextAttemptAt: new Date(now.getTime() + BACKOFF_MS[Math.min(n - 1, BACKOFF_MS.length - 1)]) }, "retry_scheduled", `attempt ${n}: ${detail}`);
        } else {
          // Ambiguous outcomes are never retried: the customer may already have the message.
          await finish({ status: "FAILED", attempts: n, messageId: m.id, lastErrorCode: code, lastError: detail, nextAttemptAt: null }, ambiguous ? "unconfirmed" : "failed", detail);
        }
        return;
      }
      await finish({ status: "SENT", attempts: n, messageId: m.id, lastErrorCode: null, lastError: null, nextAttemptAt: null, sentAt: now }, "sent", `attempt ${n}`);
    } catch (err) {
      if (err instanceof InboxError) {
        if (SKIP_CODES.has(err.code)) {
          await finish({ status: "SKIPPED", attempts: n, skipReason: err.code, lastError: err.message, nextAttemptAt: null }, "skipped", err.message);
          return;
        }
        // NOT_CONFIGURED / CONSENT_CHECK_FAILED: nothing was sent; try again later.
        if (n < exec.maxAttempts) {
          await finish({ status: "QUEUED", attempts: n, lastError: err.message, nextAttemptAt: new Date(now.getTime() + BACKOFF_MS[Math.min(n - 1, BACKOFF_MS.length - 1)]) }, "retry_scheduled", err.message);
          return;
        }
        await finish({ status: "FAILED", attempts: n, lastError: err.message, nextAttemptAt: null }, "failed", err.message);
        return;
      }
      logger.error(`[Automation] attempt failed: ${err instanceof Error ? err.name : "unknown error"}`);
      // Unknown error: we cannot tell whether anything was sent. Do not resend.
      await finish({ status: "FAILED", attempts: n, lastError: "Unexpected error; delivery is unconfirmed, so it was not resent.", nextAttemptAt: null }, "failed", "unexpected error");
    }
  }

  /** Copies WhatsApp delivery receipts (delivered / read / failed) from the message rows onto their executions. */
  async syncDelivery(limit = 100): Promise<{ updated: number }> {
    let updated = 0;
    for (const e of await this.deps.store.inFlight(limit)) {
      if (!e.messageId) continue;
      const m = await this.deps.inboxStore.getMessage(e.messageId);
      if (!m) continue;
      const next: ExecutionRecord["status"] | null = m.status === "READ" ? "READ" : m.status === "DELIVERED" ? "DELIVERED" : m.status === "FAILED" ? "FAILED" : null;
      if (!next || next === e.status || (e.status === "DELIVERED" && next === "DELIVERED")) continue;
      await this.deps.store.updateExecution(e.id, {
        status: next,
        waMessageId: m.waMessageId ?? e.waMessageId,
        ...(next === "FAILED" ? { lastError: m.errorTitle ?? "WhatsApp reported the message as failed.", lastErrorCode: m.errorCode } : {}),
        history: [...e.history, entry(next.toLowerCase(), undefined, this.now())],
      });
      updated++;
    }
    return { updated };
  }

  // ─── history ──────────────────────────────────────────────────────────────
  async executions(f: { status?: string; ruleId?: string; page: number; pageSize: number }) {
    await this.syncDelivery().catch(() => undefined);
    const status = ["QUEUED", "SENDING", "SENT", "DELIVERED", "READ", "FAILED", "SKIPPED"].includes(String(f.status)) ? (f.status as ExecutionRecord["status"]) : undefined;
    return this.deps.store.listExecutions({ status, ruleId: f.ruleId, page: f.page, pageSize: f.pageSize });
  }

  async summary() {
    return { enabled: this.deps.isEnabled(), counts: await this.deps.store.countsByStatus() };
  }

  /** Puts a FAILED execution back in the queue by hand. Refused when the outcome was unconfirmed (it may have been delivered). */
  async requeue(id: string): Promise<ExecutionRecord> {
    const e = await this.deps.store.getExecution(id);
    if (!e) throw new AutomationError("NOT_FOUND", "Execution not found.", STATUS_CODES.NOT_FOUND);
    if (e.status !== "FAILED") throw bad("Only failed executions can be retried.");
    if (e.history.some((h) => h.event === "unconfirmed") || /unconfirmed/i.test(e.lastError ?? "")) throw bad("WhatsApp never confirmed this message, so it may already have been delivered. It was not resent to avoid a duplicate.");
    const now = this.now();
    return this.deps.store.updateExecution(id, { status: "QUEUED", maxAttempts: e.attempts + 1, nextAttemptAt: now, expiresAt: new Date(now.getTime() + QUEUE_TTL_MS), history: [...e.history, entry("requeued", "manual retry", now)] });
  }
}

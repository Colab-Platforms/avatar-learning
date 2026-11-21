// Regression tests for the pre-staging fixes (consent bypass, idempotency conflicts, content snapshots, Google welcome, webhook races).
// Everything is in-memory: a fake database and a fake Resend that MODELS idempotency (documented behaviour, not verified against the live API).
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { EmailAutomationService, EmailError, type EmailSender } from "../../src/modules/email-automation/email-automation.service.js";
import { payloadHash } from "../../src/modules/email-automation/email.lib.js";
import { resolveGoogleAccount } from "../../src/modules/adoption/adoption.google.js";
import { FakeDb } from "./fake-db.js";

const MIN = 60_000;
const HOUR = 60 * MIN;

type Call = { key: string; to: string; subject: string; html: string; text: string; headers?: Record<string, string> };

/**
 * Fake Resend. Modelled behaviour: the same idempotency key with the same payload returns the ORIGINAL message and delivers nothing new;
 * the same key with a different payload is an idempotency conflict. `script` entries fail a call: a plain error fails BEFORE
 * acceptance, `{ lostResponse: err }` accepts the message and then fails the response (the classic ambiguous timeout).
 */
class FakeResend implements EmailSender {
  calls: Call[] = [];
  deliveries: { id: string; to: string; subject: string; html: string }[] = [];
  script: unknown[] = [];
  onAccepted?: (id: string) => Promise<void>;
  private byKey = new Map<string, { id: string; sig: string }>();
  private n = 0;
  async send(m: Call & { idempotencyKey: string }) {
    const key = m.idempotencyKey;
    this.calls.push({ key, to: m.to, subject: m.subject, html: m.html, text: m.text, headers: m.headers });
    const next = this.script.shift() as { lostResponse?: unknown } | undefined;
    if (next && !("lostResponse" in next)) throw next;
    const sig = payloadHash({ toEmail: m.to, subject: m.subject, html: m.html, text: m.text, listUnsubscribe: m.headers?.["List-Unsubscribe"] ?? null });
    const seen = this.byKey.get(key);
    let id: string;
    if (seen) {
      if (seen.sig !== sig) throw Object.assign(new Error("key reused with a different payload"), { name: "invalid_idempotent_request" });
      id = seen.id;
    } else {
      id = `re_${++this.n}`;
      this.byKey.set(key, { id, sig });
      this.deliveries.push({ id, to: m.to, subject: m.subject, html: m.html });
      await this.onAccepted?.(id);
    }
    if (next && "lostResponse" in next) throw next.lostResponse;
    return { id };
  }
  async check() {}
}

let db: FakeDb;
let resend: FakeResend;
let svc: EmailAutomationService;
let enabled: boolean;
let seq = 0;

const make = (unsub: (id: string) => string | null = (id) => `https://api.test/unsub?u=${id}`) =>
  new EmailAutomationService({ db: db as unknown as PrismaClient, sender: resend, isEnabled: () => enabled, isConfigured: () => true, unsubscribeUrl: unsub, appName: "Avatar AI Adoption", now: db.now });
const user = (o: Record<string, unknown> = {}) => db.adoptionUser.create({ data: { fullName: "Priya Sharma", email: `p${++seq}@example.com`, ...o } });
const tpl = (o: Record<string, unknown> = {}) => db.emailTemplate.create({ data: { name: "T", subject: "Hello {{first_name}}", htmlBody: "<p>Hi {{name}}</p>", ...o } });
const auto = (templateId: string, o: Record<string, unknown> = {}) => db.emailAutomation.create({ data: { name: "A", trigger: "USER_REGISTERED", templateId, isActive: true, ...o } });
const msgs = () => db.emailMessage.rows;
const welcome = async (u: { id: string }) => svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
/** A transactional welcome automation + one user, queued and ready. */
const queuedWelcome = async (tplOver: Record<string, unknown> = {}) => {
  const u = await user();
  const t = await tpl(tplOver);
  await auto(t.id);
  await welcome(u);
  return { u, t };
};

beforeEach(() => {
  db = new FakeDb();
  resend = new FakeResend();
  enabled = true;
  seq = 0;
  svc = make();
});

// ═════════════════════════════ FIX 1 ═════════════════════════════════════════
describe("FIX 1: a scheduled broadcast can never bypass marketing consent", () => {
  it("subscribed, non-consenting and unsubscribed accounts: only the subscribed one is emailed (and only that one is even queued)", async () => {
    const yes = await user({ marketingEmailOptIn: true });
    await user({ marketingEmailOptIn: false });
    await user({ marketingEmailOptIn: true, emailUnsubscribedAt: new Date() });
    await user({ marketingEmailOptIn: false, emailUnsubscribedAt: new Date() });
    await auto((await tpl({ type: "PROMOTIONAL", subject: "News" })).id, { trigger: "SCHEDULED_EMAIL", scheduledAt: db.now() });
    db.advance(MIN);
    await svc.processDue();
    assert.deepEqual(resend.deliveries.map((d) => d.to), [yes.email]);
    assert.equal(msgs().length, 1, "non-consenting and unsubscribed accounts are never queued");
    assert.match(resend.deliveries[0].html, /Unsubscribe/);
  });

  it("a transactional template cannot be scheduled for a bulk audience (create, edit, activate, relabel)", async () => {
    const promo = await tpl({ type: "PROMOTIONAL" });
    const trans = await tpl({ type: "TRANSACTIONAL" });
    const at = new Date(db.now().getTime() + HOUR).toISOString();
    await assert.rejects(() => svc.createAutomation({ name: "x", trigger: "SCHEDULED_EMAIL", templateId: trans.id, scheduledAt: at }), /must use a Promotional template/);
    const a = await svc.createAutomation({ name: "x", trigger: "SCHEDULED_EMAIL", templateId: promo.id, scheduledAt: at });
    await assert.rejects(() => svc.updateAutomation(a.id, { name: "x", trigger: "SCHEDULED_EMAIL", templateId: trans.id, scheduledAt: at }), /Promotional/);
    // relabelling the template to transactional while a broadcast still depends on it is refused
    await assert.rejects(() => svc.updateTemplate(promo.id, { name: "T", subject: "s", htmlBody: "<p>x</p>", type: "TRANSACTIONAL", status: "ACTIVE" }), /scheduled email uses this template/);
    // and even if the label is changed behind the service's back, it cannot be switched on
    await db.emailTemplate.update({ where: { id: promo.id }, data: { type: "TRANSACTIONAL" } });
    await assert.rejects(() => svc.setAutomationActive(a.id, true), /Promotional/);
  });

  it("defence in depth: a transactional template that reaches the scheduler anyway sends nothing and the broadcast is closed", async () => {
    await user({ marketingEmailOptIn: true });
    await user();
    const a = await auto((await tpl({ type: "TRANSACTIONAL", subject: "50% off!" })).id, { trigger: "SCHEDULED_EMAIL", scheduledAt: db.now() });
    db.advance(MIN);
    await svc.processDue();
    assert.equal(resend.deliveries.length, 0);
    assert.equal(msgs().length, 0);
    const row = db.emailAutomation.rows.find((x) => x.id === a.id)!;
    assert.equal(row.isActive, false);
    assert.ok(row.expiredAt);
  });

  /** 23 accounts: 20 go out in the first tick, 3 stay queued so their consent can change before THEIR send. */
  const queuedBroadcast = async () => {
    for (let i = 0; i < 23; i++) await user({ marketingEmailOptIn: true });
    await auto((await tpl({ type: "PROMOTIONAL" })).id, { trigger: "SCHEDULED_EMAIL", scheduledAt: db.now() });
    db.advance(MIN);
    await svc.processDue();
    assert.equal(resend.deliveries.length, 20);
    return msgs().filter((m) => m.status === "QUEUED");
  };

  it("unsubscribing or withdrawing consent AFTER the broadcast was queued stops that person at send time", async () => {
    const waiting = await queuedBroadcast();
    assert.equal(waiting.length, 3);
    const [a, b, c] = waiting.map((m) => m.userId as string);
    await svc.unsubscribe(a); // via the unsubscribe link: cancels its waiting email
    await db.adoptionUser.update({ where: { id: b }, data: { marketingEmailOptIn: false } }); // consent withdrawn, nothing cancelled yet
    await db.adoptionUser.update({ where: { id: c }, data: { emailUnsubscribedAt: new Date() } }); // flag set directly
    await svc.processDue();
    assert.equal(resend.deliveries.length, 20, "none of the three received it");
    const status = (id: string) => msgs().find((m) => m.userId === id)!;
    assert.equal(status(a).failureReason, "UNSUBSCRIBED");
    assert.equal(status(b).failureReason, "NO_MARKETING_CONSENT");
    assert.equal(status(c).failureReason, "UNSUBSCRIBED");
  });

  it("send-time consent follows the broadcast rule, not a label: a tampered stored type cannot let an unsubscribed person through", async () => {
    const waiting = await queuedBroadcast();
    const c = waiting[0];
    await db.emailMessage.update({ where: { id: c.id }, data: { templateType: "TRANSACTIONAL" } });
    await db.adoptionUser.update({ where: { id: c.userId }, data: { emailUnsubscribedAt: new Date() } });
    await svc.processDue();
    assert.equal(msgs().find((m) => m.id === c.id)!.status, "SKIPPED");
    assert.equal(resend.deliveries.filter((d) => d.to === db.adoptionUser.rows.find((u) => u.id === c.userId)!.email).length, 0);
  });

  it("unsubscribed people are excluded from every promotional path: event follow-up, manual send and broadcast", async () => {
    const out = await user({ marketingEmailOptIn: true, emailUnsubscribedAt: new Date() });
    const promo = await tpl({ type: "PROMOTIONAL" });
    await auto(promo.id, { trigger: "FOLLOW_UP", anchorEvent: "USER_REGISTERED", delayMinutes: 1 });
    await welcome(out);
    const manual = await svc.manualSend({ templateId: promo.id, userIds: [out.id] });
    assert.equal(manual.results[0].reason, "UNSUBSCRIBED");
    await auto(promo.id, { trigger: "SCHEDULED_EMAIL", scheduledAt: db.now() });
    db.advance(2 * HOUR);
    await svc.processDue();
    assert.equal(resend.deliveries.length, 0);
  });
});

// ═════════════════════════════ FIX 2 ═════════════════════════════════════════
describe("FIX 2: Resend idempotency conflicts and ambiguous outcomes", () => {
  const conflict = (name: string) => Object.assign(new Error(name), { name });

  it("concurrent_idempotent_requests is retried LATER under the SAME key and then succeeds once", async () => {
    await queuedWelcome();
    resend.script.push(conflict("concurrent_idempotent_requests"));
    await svc.processDue();
    assert.equal(msgs()[0].status, "QUEUED");
    assert.equal(msgs()[0].maybeAccepted, true);
    db.advance(2 * MIN);
    await svc.processDue();
    assert.equal(msgs()[0].status, "SENT");
    assert.equal(resend.calls.length, 2);
    assert.equal(resend.calls[0].key, resend.calls[1].key, "same key");
    assert.equal(resend.deliveries.length, 1);
  });

  it("concurrent_idempotent_requests that never clears ends UNCONFIRMED, not FAILED", async () => {
    await queuedWelcome();
    for (let i = 0; i < 3; i++) {
      resend.script.push(conflict("concurrent_idempotent_requests"));
      await svc.processDue();
      db.advance(31 * MIN);
    }
    assert.equal(msgs()[0].status, "UNCONFIRMED");
    assert.equal(resend.deliveries.length, 0);
  });

  it("invalid_idempotent_request parks the message at once: no new key, no automatic retry, no manual retry", async () => {
    await queuedWelcome();
    resend.script.push(conflict("invalid_idempotent_request"));
    await svc.processDue();
    const m = msgs()[0];
    assert.equal(m.status, "UNCONFIRMED");
    assert.equal(m.retryEpoch, 0);
    db.advance(5 * HOUR);
    await svc.processDue();
    assert.equal(resend.calls.length, 1, "never retried automatically");
    await assert.rejects(() => svc.retry(m.id), /Only a failed email can be retried/);
    assert.equal(msgs()[0].retryEpoch, 0, "no fresh key was generated");
    assert.equal(new Set(resend.calls.map((c) => c.key)).size, 1);
  });

  it("a lost response (accepted, then timed out) is retried under the same key and delivered exactly ONCE", async () => {
    await queuedWelcome();
    resend.script.push({ lostResponse: Object.assign(new Error("Sending timed out."), { name: "SendTimeout" }) });
    await svc.processDue();
    assert.equal(resend.deliveries.length, 1, "the provider already accepted it");
    assert.equal(msgs()[0].status, "QUEUED");
    db.advance(2 * MIN);
    await svc.processDue();
    assert.equal(resend.deliveries.length, 1, "retry did not deliver a second copy");
    assert.equal(msgs()[0].status, "SENT");
    assert.equal(msgs()[0].resendId, resend.deliveries[0].id);
  });

  it("an unknown error name is treated as ambiguous", async () => {
    await queuedWelcome();
    resend.script.push(conflict("something_resend_added_later"));
    await svc.processDue();
    assert.equal(msgs()[0].maybeAccepted, true);
    assert.equal(msgs()[0].status, "QUEUED");
  });

  it("an ambiguous attempt followed by a definite refusal is UNCONFIRMED (the first attempt may have been accepted)", async () => {
    await queuedWelcome();
    resend.script.push(conflict("internal_server_error"), conflict("validation_error"));
    await svc.processDue();
    db.advance(2 * MIN);
    await svc.processDue();
    const m = msgs()[0];
    assert.equal(m.status, "UNCONFIRMED");
    await assert.rejects(() => svc.retry(m.id), EmailError);
  });

  it("a definite refusal alone is FAILED and may be retried by hand, once, with a fresh key and the ORIGINAL content", async () => {
    const { t } = await queuedWelcome({ subject: "Original {{first_name}}", htmlBody: "<p>Original body</p>" });
    resend.script.push(conflict("validation_error"));
    await svc.processDue();
    assert.equal(msgs()[0].status, "FAILED");
    await svc.updateTemplate(t.id, { name: "T", subject: "CHANGED", htmlBody: "<p>CHANGED</p>", type: "TRANSACTIONAL", status: "ACTIVE" });
    await svc.retry(msgs()[0].id);
    await svc.processDue();
    assert.equal(msgs()[0].status, "SENT");
    assert.notEqual(resend.calls[0].key, resend.calls[1].key);
    assert.equal(resend.deliveries.length, 1);
    assert.equal(resend.deliveries[0].subject, "Original Priya");
    assert.match(resend.deliveries[0].html, /Original body/);
  });

  it("rate-limit / quota refusals are retried under the same key and, if they persist, end FAILED (nothing was accepted) and can be retried", async () => {
    await queuedWelcome();
    for (let i = 0; i < 3; i++) {
      resend.script.push(conflict("daily_quota_exceeded"));
      await svc.processDue();
      db.advance(31 * MIN);
    }
    assert.equal(msgs()[0].status, "FAILED");
    assert.equal(msgs()[0].maybeAccepted, false);
    assert.equal(new Set(resend.calls.map((c) => c.key)).size, 1);
    await svc.retry(msgs()[0].id);
    await svc.processDue();
    assert.equal(msgs()[0].status, "SENT");
  });

  it("past the idempotency window a possibly-accepted message is parked, not retried (a retry could duplicate)", async () => {
    await queuedWelcome();
    resend.script.push(conflict("internal_server_error"));
    await svc.processDue();
    assert.equal(msgs()[0].status, "QUEUED");
    db.advance(13 * HOUR);
    await svc.processDue();
    assert.equal(msgs()[0].status, "UNCONFIRMED");
    assert.equal(msgs()[0].failureReason, "IDEMPOTENCY_WINDOW_PASSED");
    assert.equal(resend.calls.length, 1);
  });

  it("a worker that died mid-send more than the window ago is parked as UNCONFIRMED", async () => {
    await queuedWelcome();
    await db.emailMessage.update({ where: { id: msgs()[0].id }, data: { status: "SENDING", lockedAt: db.now() } });
    db.advance(13 * HOUR);
    await svc.processDue();
    assert.equal(msgs()[0].status, "UNCONFIRMED");
    assert.equal(resend.calls.length, 0);
  });

  it("resolving: SENT or NOT_SENT closes an UNCONFIRMED email, sends nothing, and cannot be applied to other statuses", async () => {
    await queuedWelcome();
    resend.script.push(conflict("invalid_idempotent_request"));
    await svc.processDue();
    const id = msgs()[0].id;
    assert.equal((await svc.stats()).needsReview, 1);
    await svc.resolveUnconfirmed(id, "NOT_SENT");
    assert.equal(msgs()[0].status, "CANCELLED");
    assert.equal(msgs()[0].failureReason, "CONFIRMED_NOT_SENT");
    await assert.rejects(() => svc.resolveUnconfirmed(id, "SENT"), /needs review/);

    const w = await user();
    await welcome(w);
    resend.script.push(conflict("invalid_idempotent_request"));
    await svc.processDue();
    const second = msgs().find((m) => m.userId === w.id)!;
    await svc.resolveUnconfirmed(second.id, "SENT");
    assert.equal(msgs().find((m) => m.id === second.id)!.status, "SENT");
    assert.equal(msgs().find((m) => m.id === second.id)!.bodyHtml, null);
    assert.equal(resend.calls.length, 2, "resolving never contacts the provider");
    assert.equal((await svc.stats()).needsReview, 0);
    await assert.rejects(() => svc.resolveUnconfirmed(second.id, "bogus" as never), EmailError);
  });
});

// ═════════════════════════════ FIX 3 ═════════════════════════════════════════
describe("FIX 3: queued emails carry their own content snapshot", () => {
  it("the exact rendered subject, HTML, text and fingerprint are stored when the message is queued", async () => {
    await queuedWelcome({ subject: "Welcome {{first_name}}", htmlBody: "<p>Hi {{name}} from {{app_name}}</p>" });
    const m = msgs()[0];
    assert.equal(m.status, "QUEUED");
    assert.equal(m.subject, "Welcome Priya");
    assert.match(m.bodyHtml, /Hi Priya Sharma from Avatar AI Adoption/);
    assert.ok(m.bodyText.includes("Priya Sharma"));
    assert.ok(!/\{\{/.test(m.subject + m.bodyHtml + m.bodyText), "no unresolved placeholders");
    assert.equal(m.contentHash, payloadHash({ toEmail: m.toEmail, subject: m.subject, html: m.bodyHtml, text: m.bodyText, listUnsubscribe: m.listUnsubscribe }));
  });

  it("a template edited after queueing does not change the email that is sent", async () => {
    const { t } = await queuedWelcome({ subject: "Original", htmlBody: "<p>Original</p>" });
    await svc.updateTemplate(t.id, { name: "T", subject: "Edited", htmlBody: "<p>Edited</p>", type: "TRANSACTIONAL", status: "ACTIVE" });
    await svc.processDue();
    assert.equal(resend.deliveries[0].subject, "Original");
    assert.match(resend.deliveries[0].html, /Original/);
  });

  it("SIMULATED WORKER CRASH between the provider accepting the email and the database recording it: recovery re-sends the ORIGINAL content under the SAME key and the person gets exactly one email", async () => {
    const { t } = await queuedWelcome({ subject: "Original {{first_name}}", htmlBody: "<p>Original for {{name}}</p>" });
    // the process dies right after Resend accepted the email, before "SENT" is written
    const real = db.emailMessage.update.bind(db.emailMessage);
    let crashed = false;
    db.emailMessage.update = async (args: any) => {
      if (!crashed && args.data?.status === "SENT") {
        crashed = true;
        throw new Error("process killed");
      }
      return real(args);
    };
    await assert.rejects(() => svc.processDue(), /process killed/);
    assert.equal(resend.deliveries.length, 1, "Resend already accepted it");
    assert.equal(msgs()[0].status, "SENDING", "the database never learnt that");
    // meanwhile an admin edits, then archives the template
    await svc.updateTemplate(t.id, { name: "T", subject: "EDITED", htmlBody: "<p>EDITED</p>", type: "TRANSACTIONAL", status: "ACTIVE" });
    await db.emailTemplate.update({ where: { id: t.id }, data: { status: "ARCHIVED" } });
    // the server restarts later and the worker recovers the stale row
    svc = make();
    db.advance(11 * MIN);
    await svc.processDue();
    assert.equal(resend.calls.length, 2);
    assert.equal(resend.calls[0].key, resend.calls[1].key, "same idempotency key");
    assert.equal(resend.calls[0].subject, resend.calls[1].subject, "identical payload");
    assert.equal(resend.calls[1].html, resend.calls[0].html);
    assert.match(resend.calls[1].html, /Original for Priya Sharma/);
    assert.doesNotMatch(resend.calls[1].html, /EDITED/);
    assert.equal(resend.deliveries.length, 1, "exactly one email reached the person");
    assert.equal(msgs()[0].status, "SENT");
    assert.equal(msgs()[0].resendId, resend.deliveries[0].id);
  });

  it("the stored content is checked against its fingerprint before every send; a changed row is never sent", async () => {
    await queuedWelcome();
    await db.emailMessage.update({ where: { id: msgs()[0].id }, data: { bodyHtml: "<p>tampered</p>" } });
    await svc.processDue();
    assert.equal(resend.calls.length, 0);
    assert.equal(msgs()[0].status, "FAILED");
    assert.equal(msgs()[0].failureReason, "CONTENT_CHANGED");
  });

  it("a tampered row that was already possibly-accepted is UNCONFIRMED, not an ordinary failure", async () => {
    await queuedWelcome();
    await db.emailMessage.update({ where: { id: msgs()[0].id }, data: { bodyHtml: "<p>tampered</p>", maybeAccepted: true } });
    await svc.processDue();
    assert.equal(msgs()[0].status, "UNCONFIRMED");
  });

  it("stored content is dropped once the email is accepted, and never returned by the activity API", async () => {
    await queuedWelcome();
    const before = await svc.activity({});
    assert.equal("bodyHtml" in before.items[0], false);
    assert.equal("contentHash" in before.items[0], false);
    await svc.processDue();
    assert.equal(msgs()[0].bodyHtml, null);
    assert.equal(msgs()[0].bodyText, null);
    const scheduled = await svc.listScheduled();
    assert.equal(scheduled.length, 0);
  });

  it("an email is never sent to an address the person has since changed away from", async () => {
    const { u } = await queuedWelcome();
    await db.adoptionUser.update({ where: { id: u.id }, data: { email: "new@example.com" } });
    await svc.processDue();
    assert.equal(resend.calls.length, 0);
    assert.equal(msgs()[0].failureReason, "RECIPIENT_EMAIL_CHANGED");
  });
});

// ═════════════════════════════ FIX 4 ═════════════════════════════════════════
describe("FIX 4: Google sign-in registration event", () => {
  const profile = (email: string, googleId = "g-1") => ({ googleId, email, fullName: "Priya Sharma" });
  const run = (emails: string, googleId?: string) => {
    const fired: string[] = [];
    return { fired, go: () => resolveGoogleAccount(db as unknown as PrismaClient, profile(emails, googleId), (id) => void fired.push(id)) };
  };

  it("a brand-new Google account fires the event once", async () => {
    const { fired, go } = run("new@example.com");
    const u = await go();
    assert.equal(u.emailVerified, true);
    assert.deepEqual(fired, [u.id]);
  });

  it("an existing UNVERIFIED account that Google now verifies fires the event, once, and its old sessions are dropped", async () => {
    const existing = await user({ email: "pending@example.com", emailVerified: false });
    await db.adoptionSession.create({ data: { userId: existing.id } });
    const { fired, go } = run("pending@example.com");
    const u = await go();
    assert.equal(u.id, existing.id);
    assert.equal(u.emailVerified, true);
    assert.equal(u.googleId, "g-1");
    assert.equal(u.passwordHash, null);
    assert.deepEqual(fired, [existing.id]);
    assert.equal(db.adoptionSession.rows.length, 0);
  });

  it("an existing VERIFIED account (linking Google) never fires it", async () => {
    await user({ email: "verified@example.com", emailVerified: true });
    const { fired, go } = run("verified@example.com");
    const u = await go();
    assert.equal(u.googleId, "g-1");
    assert.deepEqual(fired, []);
  });

  it("signing in again later never fires it, whichever way the account first became verified", async () => {
    const a = run("again@example.com");
    await a.go();
    const b = run("again@example.com");
    await b.go();
    await b.go();
    assert.deepEqual(b.fired, []);
    await user({ email: "pending2@example.com", emailVerified: false });
    const c = run("pending2@example.com", "g-2");
    await c.go();
    await c.go();
    assert.equal(c.fired.length, 1);
  });

  it("end to end: the unverified-then-Google account gets ONE welcome email, even if the event is delivered twice", async () => {
    await auto((await tpl({ subject: "Welcome {{first_name}}" })).id);
    await user({ email: "pending3@example.com", emailVerified: false });
    const fired: string[] = [];
    const u = await resolveGoogleAccount(db as unknown as PrismaClient, profile("pending3@example.com", "g-3"), (id) => void fired.push(id));
    for (const id of [...fired, ...fired]) await svc.handleEvent({ event: "USER_REGISTERED", userId: id, subjectId: id });
    await svc.processDue();
    await svc.processDue();
    assert.equal(resend.deliveries.length, 1);
    assert.equal(resend.deliveries[0].to, u.email);
    assert.equal(resend.deliveries[0].subject, "Welcome Priya");
  });
});

// ═════════════════════════════ FIX 5 ═════════════════════════════════════════
describe("FIX 5: webhook events that race ahead of the SENT update", () => {
  const T = (m: number) => new Date(db.now().getTime() + m * MIN);

  it("a delivered event that arrives WHILE the email is still being sent is kept and applied", async () => {
    await queuedWelcome();
    // Resend fires the webhook before the send call has even returned
    resend.onAccepted = async (id) => svc.handleWebhookEvent("email.delivered", { email_id: id }, { eventId: "evt-1", occurredAt: T(0) });
    await svc.processDue();
    assert.equal(msgs()[0].status, "DELIVERED");
    assert.ok(msgs()[0].deliveredAt);
    assert.ok(db.emailWebhookEvent.rows[0].appliedAt, "the buffered event is marked applied");
  });

  it("an inline manual send applies an early event immediately, without waiting for the worker", async () => {
    const u = await user();
    const t = await tpl();
    resend.onAccepted = async (id) => svc.handleWebhookEvent("email.delivered", { email_id: id }, { eventId: "inline-1", occurredAt: T(0) });
    const r = await svc.manualSend({ templateId: t.id, userIds: [u.id] });
    assert.equal(r.results[0].outcome, "sent");
    assert.equal(msgs()[0].status, "DELIVERED", "no processDue() ran: applied by the send path itself");
  });

  it("a provider retry of the same event (same svix id) is harmless, before and after it was applied", async () => {
    await queuedWelcome();
    await svc.handleWebhookEvent("email.delivered", { email_id: "re_1" }, { eventId: "evt-A", occurredAt: T(0) });
    await svc.handleWebhookEvent("email.delivered", { email_id: "re_1" }, { eventId: "evt-A", occurredAt: T(0) });
    assert.equal(db.emailWebhookEvent.rows.length, 1, "stored once");
    await svc.processDue();
    assert.equal(msgs()[0].status, "DELIVERED");
    await svc.handleWebhookEvent("email.delivered", { email_id: "re_1" }, { eventId: "evt-A", occurredAt: T(0) });
    assert.equal(msgs()[0].status, "DELIVERED");
    assert.equal(db.emailWebhookEvent.rows.filter((e) => !e.appliedAt).length, 0);
  });

  it("the final status does not depend on arrival order: a late 'delivered' never hides a bounce (transitions are monotonic)", async () => {
    await queuedWelcome();
    // arrival order: bounced (happened at +2) then delivered (happened at +1)
    await svc.handleWebhookEvent("email.bounced", { email_id: "re_1", bounce: { message: "Mailbox full" } }, { eventId: "e2", occurredAt: T(2) });
    await svc.handleWebhookEvent("email.delivered", { email_id: "re_1" }, { eventId: "e1", occurredAt: T(1) });
    await svc.processDue();
    assert.equal(msgs()[0].status, "BOUNCED");
    assert.equal(msgs()[0].failureReason, "Mailbox full");
  });

  it("closes the gap where the SENT update commits between the lookup and the buffering insert", async () => {
    await queuedWelcome();
    await db.emailMessage.updateMany({ where: {}, data: { status: "SENDING" } });
    const realCreate = db.emailWebhookEvent.create.bind(db.emailWebhookEvent);
    db.emailWebhookEvent.create = async (args: any) => {
      const r = await realCreate(args);
      await db.emailMessage.updateMany({ where: {}, data: { status: "SENT", resendId: "re_9" } }); // commits right after the insert
      return r;
    };
    await svc.handleWebhookEvent("email.delivered", { email_id: "re_9" }, { eventId: "gap-1", occurredAt: T(0) });
    assert.equal(msgs()[0].status, "DELIVERED", "applied immediately by the re-check, no waiting for the worker");
  });

  it("the worker's reconcile pass applies anything that matches by then and prunes what never will", async () => {
    await queuedWelcome();
    await db.emailMessage.updateMany({ where: {}, data: { status: "SENDING" } });
    await svc.handleWebhookEvent("email.delivered", { email_id: "re_5" }, { eventId: "r1", occurredAt: T(0) });
    await svc.handleWebhookEvent("email.delivered", { email_id: "otp_mail" }, { eventId: "r2", occurredAt: T(0) }); // another email in the same Resend account
    await db.emailMessage.updateMany({ where: {}, data: { status: "SENT", resendId: "re_5" } }); // SENT commit whose apply was missed
    await svc.processDue();
    assert.equal(msgs()[0].status, "DELIVERED");
    assert.equal(db.emailWebhookEvent.rows.length, 2, "kept for now");
    db.advance(25 * HOUR);
    await svc.processDue();
    assert.deepEqual(db.emailWebhookEvent.rows.map((e) => e.svixId), ["r1"], "unmatched one pruned after 24h, applied one kept");
    db.advance(8 * 24 * HOUR);
    await svc.processDue();
    assert.equal(db.emailWebhookEvent.rows.length, 0, "applied ones pruned after 7 days");
  });

  it("reads the reason from the SDK's real event fields (bounce.message, failed.reason, suppressed.message)", async () => {
    for (const [type, data, expected, status] of [
      ["email.bounced", { bounce: { message: "Mailbox does not exist" } }, "Mailbox does not exist", "BOUNCED"],
      ["email.failed", { failed: { reason: "Provider rejected it" } }, "Provider rejected it", "FAILED"],
      ["email.suppressed", { suppressed: { message: "Address is suppressed" } }, "Address is suppressed", "FAILED"],
    ] as const) {
      db = new FakeDb();
      svc = make();
      resend = new FakeResend();
      svc = make();
      await queuedWelcome();
      await svc.processDue();
      await svc.handleWebhookEvent(type, { email_id: msgs()[0].resendId, ...data }, { eventId: `x-${type}` });
      assert.equal(msgs()[0].status, status, type);
      assert.equal(msgs()[0].failureReason, expected, type);
    }
  });

  it("event types we do not track are ignored and not buffered", async () => {
    await svc.handleWebhookEvent("email.opened", { email_id: "re_1" }, { eventId: "o1" });
    await svc.handleWebhookEvent("domain.created", {}, { eventId: "o2" });
    assert.equal(db.emailWebhookEvent.rows.length, 0);
  });

  it("an early spam complaint unsubscribes the person once it is applied, and cancels their waiting promotional email", async () => {
    const u = await user({ marketingEmailOptIn: true });
    const promo = await tpl({ type: "PROMOTIONAL" });
    await auto(promo.id);
    await welcome(u);
    resend.onAccepted = async (id) => svc.handleWebhookEvent("email.complained", { email_id: id }, { eventId: "c1" });
    await auto(promo.id, { trigger: "FOLLOW_UP", anchorEvent: "USER_REGISTERED", delayMinutes: 600 });
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: "second-event" });
    await svc.processDue();
    const row = msgs().find((m) => m.status === "COMPLAINED")!;
    assert.ok(row);
    assert.ok(db.adoptionUser.rows.find((x) => x.id === u.id)!.emailUnsubscribedAt);
    assert.equal(msgs().filter((m) => m.status === "QUEUED").length, 0, "the waiting follow-up was cancelled");
  });
});

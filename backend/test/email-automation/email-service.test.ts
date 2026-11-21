import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PrismaClient } from "@prisma/client";
import { EmailAutomationService, EmailError, type EmailSender } from "../../src/modules/email-automation/email-automation.service.js";
import { FakeDb } from "./fake-db.js";

const MIN = 60_000;
const HOUR = 60 * MIN;

interface Sent {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
  headers?: Record<string, string>;
}

let db: FakeDb;
let sent: Sent[];
let failWith: unknown[]; // queue of errors to throw before succeeding
let enabled: boolean;
let configured: boolean;
let svc: EmailAutomationService;
let n = 0;

const sender: EmailSender = {
  async send(m) {
    const err = failWith.shift();
    if (err) throw err;
    sent.push(m);
    return { id: `re_${++n}` };
  },
  async check() {},
};

const make = () =>
  new EmailAutomationService({
    db: db as unknown as PrismaClient,
    sender,
    isEnabled: () => enabled,
    isConfigured: () => configured,
    unsubscribeUrl: (id) => `https://api.test/unsub?u=${id}`,
    appName: "Avatar AI Adoption",
    now: db.now,
  });

const user = (o: Record<string, unknown> = {}) => db.adoptionUser.create({ data: { fullName: "Priya Sharma", email: `p${++n}@example.com`, ...o } });
const template = (o: Record<string, unknown> = {}) => db.emailTemplate.create({ data: { name: "T", subject: "Welcome {{first_name}}", htmlBody: "<p>Hi {{name}}</p>", ...o } });
const automation = (templateId: string, o: Record<string, unknown> = {}) => db.emailAutomation.create({ data: { name: "A", trigger: "USER_REGISTERED", templateId, isActive: true, ...o } });
const msgs = () => db.emailMessage.rows;

beforeEach(() => {
  db = new FakeDb();
  sent = [];
  failWith = [];
  enabled = true;
  configured = true;
  svc = make();
});

describe("welcome email (USER_REGISTERED)", () => {
  it("queues one email for a verified user and sends it with their details", async () => {
    const u = await user();
    const t = await template();
    await automation(t.id);
    assert.deepEqual(await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id }), { queued: 1, skipped: 0, duplicates: 0 });
    assert.equal(sent.length, 0, "nothing is sent inside the request");
    const r = await svc.processDue();
    assert.equal(r.sent, 1);
    assert.equal(sent[0].to, u.email.toLowerCase());
    assert.equal(sent[0].subject, "Welcome Priya");
    assert.match(sent[0].html, /Hi Priya Sharma/);
    assert.equal(msgs()[0].status, "SENT");
    assert.match(msgs()[0].resendId, /^re_/);
  });

  it("is idempotent: the same event twice produces one email", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    const again = await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    assert.equal(again.duplicates, 1);
    await svc.processDue();
    await svc.processDue();
    assert.equal(sent.length, 1);
    assert.equal(msgs().length, 1);
  });

  it("does nothing when the engine is switched off, and nothing for inactive automations", async () => {
    const u = await user();
    const t = await template();
    const a = await automation(t.id);
    enabled = false;
    assert.deepEqual(await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id }), { queued: 0, skipped: 0, duplicates: 0 });
    enabled = true;
    await db.emailAutomation.update({ where: { id: a.id }, data: { isActive: false } });
    assert.equal((await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id })).queued, 0);
    assert.equal(msgs().length, 0);
  });

  it("never emails an unverified or deactivated account (recorded as skipped, not sent)", async () => {
    const t = await template();
    await automation(t.id);
    const a = await user({ emailVerified: false });
    const b = await user({ isActive: false });
    for (const u of [a, b]) await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await svc.processDue();
    assert.equal(sent.length, 0);
    assert.deepEqual(msgs().map((m) => [m.status, m.failureReason]), [["SKIPPED", "EMAIL_NOT_VERIFIED"], ["SKIPPED", "ACCOUNT_INACTIVE"]]);
  });

  it("an unknown user id is ignored", async () => {
    await automation((await template()).id);
    assert.equal((await svc.handleEvent({ event: "USER_REGISTERED", userId: "nope", subjectId: "nope" })).queued, 0);
  });
});

describe("follow-up", () => {
  it("is not sent before its delay and is sent after it; it also survives a restart", async () => {
    const u = await user();
    const t = await template({ subject: "Checking in" });
    await automation(t.id, { trigger: "FOLLOW_UP", anchorEvent: "USER_REGISTERED", delayMinutes: 120 });
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    db.advance(119 * MIN);
    await svc.processDue();
    assert.equal(sent.length, 0);
    svc = make(); // "server restart": a new instance over the same persisted rows
    db.advance(2 * MIN);
    await svc.processDue();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].subject, "Checking in");
  });

  it("DEMO_REQUESTED follow-ups are separate per request and do not fire for registration", async () => {
    const u = await user();
    await automation((await template()).id, { trigger: "FOLLOW_UP", anchorEvent: "DEMO_REQUESTED", delayMinutes: 5 });
    assert.equal((await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id })).queued, 0);
    assert.equal((await svc.handleEvent({ event: "DEMO_REQUESTED", userId: u.id, subjectId: "req1" })).queued, 1);
    assert.equal((await svc.handleEvent({ event: "DEMO_REQUESTED", userId: u.id, subjectId: "req2" })).queued, 1);
    assert.equal((await svc.handleEvent({ event: "DEMO_REQUESTED", userId: u.id, subjectId: "req1" })).duplicates, 1);
  });

  it("turning the automation off cancels waiting emails and they are never sent", async () => {
    const u = await user();
    const a = await automation((await template()).id, { trigger: "FOLLOW_UP", anchorEvent: "USER_REGISTERED", delayMinutes: 60 });
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await svc.setAutomationActive(a.id, false);
    db.advance(2 * HOUR);
    await svc.processDue();
    assert.equal(sent.length, 0);
    assert.equal(msgs()[0].status, "CANCELLED");
  });

  it("editing a template after queueing does not change the already-queued follow-up", async () => {
    const u = await user();
    const t = await template({ subject: "Checking in {{first_name}}", htmlBody: "<p>Original for {{name}}</p>" });
    await automation(t.id, { trigger: "FOLLOW_UP", anchorEvent: "USER_REGISTERED", delayMinutes: 60 });
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await svc.updateTemplate(t.id, { name: "T", subject: "CHANGED", htmlBody: "<p>CHANGED</p>", type: "TRANSACTIONAL", status: "ACTIVE" });
    db.advance(2 * HOUR);
    await svc.processDue();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].subject, "Checking in Priya");
    assert.match(sent[0].html, /Original for Priya Sharma/);
    assert.doesNotMatch(sent[0].html, /CHANGED/);
  });

  it("archiving or deactivating a template after queueing does not stop the already-queued email", async () => {
    const u = await user();
    const t = await template({ subject: "Hello {{first_name}}", htmlBody: "<p>Original</p>" });
    const when = new Date(db.now().getTime() + 2 * HOUR).toISOString();
    await svc.manualSend({ templateId: t.id, userIds: [u.id], scheduledFor: when });
    await svc.archiveTemplate(t.id);
    assert.equal(db.emailTemplate.rows[0].status, "ARCHIVED");
    assert.equal(msgs()[0].status, "QUEUED", "archiving does not cancel it");
    db.advance(3 * HOUR);
    await svc.processDue();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].subject, "Hello Priya");
    assert.match(sent[0].html, /Original/);
  });
});

describe("consent for promotional email", () => {
  it("is skipped without opt-in or after unsubscribe, sent with opt-in (with unsubscribe link and header)", async () => {
    const t = await template({ type: "PROMOTIONAL" });
    await automation(t.id);
    const no = await user();
    const out = await user({ marketingEmailOptIn: true, emailUnsubscribedAt: new Date() });
    const yes = await user({ marketingEmailOptIn: true });
    for (const u of [no, out, yes]) await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await svc.processDue();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, yes.email.toLowerCase());
    assert.match(sent[0].html, /Unsubscribe/);
    assert.match(sent[0].headers?.["List-Unsubscribe"] ?? "", /unsub\?u=/);
    assert.equal(sent[0].headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    assert.deepEqual(msgs().filter((m) => m.status === "SKIPPED").map((m) => m.failureReason).sort(), ["NO_MARKETING_CONSENT", "UNSUBSCRIBED"]);
  });

  it("consent is re-checked at send time: unsubscribing after queueing stops the email", async () => {
    const t = await template({ type: "PROMOTIONAL" });
    await automation(t.id, { trigger: "FOLLOW_UP", anchorEvent: "USER_REGISTERED", delayMinutes: 30 });
    const u = await user({ marketingEmailOptIn: true });
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await svc.unsubscribe(u.id);
    db.advance(HOUR);
    await svc.processDue();
    assert.equal(sent.length, 0);
    assert.equal(msgs()[0].status, "CANCELLED");
  });

  it("transactional email ignores marketing consent", async () => {
    const u = await user({ marketingEmailOptIn: false });
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await svc.processDue();
    assert.equal(sent.length, 1);
  });
});

describe("failures and retries", () => {
  it("retries a temporary failure with backoff, using the SAME idempotency key", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    failWith.push({ statusCode: 503, message: "unavailable" });
    await svc.processDue();
    assert.equal(msgs()[0].status, "QUEUED");
    assert.match(msgs()[0].failureReason, /Retrying/);
    await svc.processDue(); // too early: backoff
    assert.equal(sent.length, 0);
    db.advance(2 * MIN);
    await svc.processDue();
    assert.equal(sent.length, 1);
    assert.equal(msgs()[0].status, "SENT");
    assert.equal(msgs()[0].attempts, 2);
    assert.equal(sent[0].idempotencyKey, `email-msg-${msgs()[0].id}-0`);
  });

  it("an unknown server-side failure repeated three times ends as UNCONFIRMED, never as an ordinary failure", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    for (let i = 0; i < 3; i++) {
      failWith.push({ name: "internal_server_error", message: "boom" });
      await svc.processDue();
      db.advance(31 * MIN);
    }
    assert.equal(msgs()[0].status, "UNCONFIRMED");
    assert.equal(msgs()[0].failureReason, "boom");
    assert.equal(msgs()[0].maybeAccepted, true);
    await svc.processDue();
    assert.equal(sent.length, 0, "never retried automatically once ambiguous");
  });

  it("a definite refusal (bad address) fails at once and is not retried", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    failWith.push({ name: "validation_error", message: "Invalid `to` field" });
    await svc.processDue();
    assert.equal(msgs()[0].status, "FAILED");
    assert.equal(msgs()[0].attempts, 1);
    assert.equal(msgs()[0].maybeAccepted, false);
  });

  it("a timeout is treated as retryable (the idempotency key makes the retry safe)", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    failWith.push({ name: "SendTimeout", message: "Sending timed out." });
    await svc.processDue();
    assert.equal(msgs()[0].status, "QUEUED");
  });

  it("manual retry of a definitely-refused email sends exactly once more, with a fresh idempotency key", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    failWith.push({ name: "validation_error", message: "nope" });
    await svc.processDue();
    await svc.retry(msgs()[0].id);
    await svc.processDue();
    assert.equal(msgs()[0].status, "SENT");
    assert.equal(sent[0].idempotencyKey, `email-msg-${msgs()[0].id}-1`);
    await assert.rejects(() => svc.retry(msgs()[0].id), EmailError); // only FAILED can be retried
  });

  it("a worker that died mid-send is recovered, and an overdue email is cancelled instead of sent late", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await db.emailMessage.update({ where: { id: msgs()[0].id }, data: { status: "SENDING", lockedAt: db.now() } });
    db.advance(11 * MIN);
    await svc.processDue();
    assert.equal(msgs()[0].status, "SENT");

    const u2 = await user();
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u2.id, subjectId: u2.id });
    db.advance(49 * HOUR);
    await svc.processDue();
    assert.equal(msgs()[1].status, "CANCELLED");
    assert.equal(msgs()[1].failureReason, "EXPIRED");
    assert.equal(sent.length, 1);
  });

  it("when mail is not configured nothing is attempted and queued emails wait", async () => {
    const u = await user();
    await automation((await template()).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    configured = false;
    await svc.processDue();
    assert.equal(msgs()[0].status, "QUEUED");
    assert.equal(msgs()[0].attempts, 0);
  });
});

describe("scheduled email (SCHEDULED_EMAIL)", () => {
  it("runs at its time for opted-in accounts exactly once", async () => {
    const t = await template({ type: "PROMOTIONAL", subject: "Announcement" });
    await user({ marketingEmailOptIn: true });
    await user({ marketingEmailOptIn: true, emailVerified: false });
    await user({ marketingEmailOptIn: true, isActive: false });
    await user({ marketingEmailOptIn: true });
    const a = await automation(t.id, { trigger: "SCHEDULED_EMAIL", scheduledAt: new Date(db.now().getTime() + HOUR) });
    await svc.processDue();
    assert.equal(sent.length, 0, "before its time");
    db.advance(HOUR + MIN);
    const r = await svc.processDue();
    assert.equal(r.fired, 1);
    assert.equal(sent.length, 2, "only the two active, verified, opted-in accounts");
    await svc.processDue();
    await svc.processDue();
    assert.equal(sent.length, 2, "never queued twice");
    const row = db.emailAutomation.rows.find((x) => x.id === a.id)!;
    assert.ok(row.firedAt);
    assert.equal(row.isActive, false);
  });

  it("promotional blasts only reach opted-in, not-unsubscribed accounts", async () => {
    const t = await template({ type: "PROMOTIONAL" });
    await user();
    await user({ marketingEmailOptIn: true });
    await user({ marketingEmailOptIn: true, emailUnsubscribedAt: new Date() });
    await automation(t.id, { trigger: "SCHEDULED_EMAIL", scheduledAt: db.now() });
    db.advance(MIN);
    await svc.processDue();
    assert.equal(sent.length, 1);
  });

  it("expires instead of sending when far past its time, and a switched-off one never runs", async () => {
    const t = await template();
    await user();
    const late = await automation(t.id, { trigger: "SCHEDULED_EMAIL", scheduledAt: db.now() });
    const off = await automation(t.id, { trigger: "SCHEDULED_EMAIL", scheduledAt: db.now(), isActive: false });
    db.advance(25 * HOUR);
    await svc.processDue();
    assert.equal(sent.length, 0);
    assert.ok(db.emailAutomation.rows.find((x) => x.id === late.id)!.expiredAt);
    assert.equal(db.emailAutomation.rows.find((x) => x.id === off.id)!.firedAt, null);
  });

  it("validates: needs a real time, cannot be activated in the past, cannot be edited after running", async () => {
    const t = await template({ type: "PROMOTIONAL" });
    await assert.rejects(() => svc.createAutomation({ name: "x", trigger: "SCHEDULED_EMAIL", templateId: t.id }), /date and time/);
    const a = await svc.createAutomation({ name: "x", trigger: "SCHEDULED_EMAIL", templateId: t.id, scheduledAt: new Date(db.now().getTime() - 2 * HOUR).toISOString() });
    assert.equal(a.isActive, false, "new automations start switched off");
    await assert.rejects(() => svc.setAutomationActive(a.id, true), /in the past/);
  });
});

describe("manual send", () => {
  it("sends now to chosen accounts and a double click is a duplicate, not a second email", async () => {
    const u = await user();
    const t = await template();
    const r1 = await svc.manualSend({ templateId: t.id, userIds: [u.id] });
    assert.equal(r1.results[0].outcome, "sent");
    const r2 = await svc.manualSend({ templateId: t.id, userIds: [u.id] });
    assert.equal(r2.results[0].outcome, "duplicate");
    assert.equal(sent.length, 1);
  });

  it("skips unknown ids and non-consenting recipients, refuses more than 25 and inactive templates", async () => {
    const t = await template({ type: "PROMOTIONAL" });
    const u = await user();
    const r = await svc.manualSend({ templateId: t.id, userIds: [u.id, "ghost"] });
    assert.deepEqual(r.results.map((x) => x.outcome), ["skipped", "skipped"]);
    assert.equal(sent.length, 0);
    await assert.rejects(() => svc.manualSend({ templateId: t.id, userIds: Array.from({ length: 26 }, (_, i) => `u${i}`) }), /at most 25/);
    await assert.rejects(() => svc.manualSend({ templateId: t.id, userIds: [] }), /at least one/);
    const off = await template({ status: "INACTIVE" });
    await assert.rejects(() => svc.manualSend({ templateId: off.id, userIds: [u.id] }), /active template/);
  });

  it("scheduled manual sends wait in the queue, can be cancelled, and need the engine on", async () => {
    const u = await user();
    const t = await template();
    const when = new Date(db.now().getTime() + 2 * HOUR).toISOString();
    const r = await svc.manualSend({ templateId: t.id, userIds: [u.id], scheduledFor: when });
    assert.equal(r.results[0].outcome, "queued");
    assert.equal((await svc.listScheduled()).length, 1);
    await svc.cancelScheduled(msgs()[0].id);
    db.advance(3 * HOUR);
    await svc.processDue();
    assert.equal(sent.length, 0);
    await assert.rejects(() => svc.cancelScheduled(msgs()[0].id), /no longer be cancelled/);
    enabled = false;
    const later = new Date(db.now().getTime() + 2 * HOUR).toISOString();
    await assert.rejects(() => svc.manualSend({ templateId: t.id, userIds: [u.id], scheduledFor: later }), /switched on/);
  });

  it("a refused inline send is reported and recorded, not hidden", async () => {
    const u = await user();
    const t = await template();
    failWith.push({ name: "validation_error", message: "rejected" });
    const r = await svc.manualSend({ templateId: t.id, userIds: [u.id] });
    assert.equal(r.results[0].outcome, "failed");
    assert.equal(msgs()[0].status, "FAILED");
  });
});

describe("templates and test email", () => {
  it("rejects unknown variables, header-breaking subjects and empty fields", async () => {
    await assert.rejects(() => svc.createTemplate({ name: "x", subject: "Hi {{nmae}}", htmlBody: "<p>x</p>" }), /Unknown variable/);
    await assert.rejects(() => svc.createTemplate({ name: "", subject: "s", htmlBody: "<p>x</p>" }), /Name is required/);
    const t = await svc.createTemplate({ name: "x", subject: "a\r\nb", htmlBody: "<p>x</p>" });
    assert.equal(t.subject, "a b");
  });

  it("previews with sample data and sends nothing", async () => {
    const t = await template();
    const p = await svc.preview({ templateId: t.id });
    assert.equal(p.subject, "Welcome Priya");
    assert.match(p.html, /Priya Sharma/);
    assert.equal(sent.length, 0);
    assert.equal((await svc.preview({ draft: { name: "d", subject: "S {{name}}", htmlBody: "<b>{{company}}</b>" } })).subject, "S Priya Sharma");
  });

  it("test email goes only to the signed-in admin, is marked as a test and excluded from stats", async () => {
    const t = await template();
    await svc.sendTest(t.id, { id: "admin1", email: "Admin@Example.com" });
    assert.equal(sent[0].to, "admin@example.com");
    assert.match(sent[0].subject, /^\[TEST\] /);
    assert.equal(msgs()[0].isTest, true);
    assert.equal((await svc.stats()).totalSent, 0);
    await assert.rejects(() => svc.sendTest(t.id, { id: "a", email: null }), /no valid email/);
  });

  it("archiving is refused while an active automation uses it, and cancels waiting emails otherwise", async () => {
    const t = await template();
    const a = await automation(t.id);
    await assert.rejects(() => svc.archiveTemplate(t.id), /active automation/);
    await db.emailAutomation.update({ where: { id: a.id }, data: { isActive: false } });
    await svc.archiveTemplate(t.id);
    assert.equal((await svc.listTemplates()).length, 0);
    assert.equal((await svc.listTemplates(true)).length, 1);
  });
});

describe("delivery webhook events and stats", () => {
  const sentMessage = async () => {
    const u = await user({ marketingEmailOptIn: true });
    await automation((await template({ type: "PROMOTIONAL" })).id);
    await svc.handleEvent({ event: "USER_REGISTERED", userId: u.id, subjectId: u.id });
    await svc.processDue();
    return { u, m: msgs()[0] };
  };

  it("delivered, bounced and complained update the activity row; a complaint unsubscribes the person", async () => {
    const { u, m } = await sentMessage();
    await svc.handleWebhookEvent("email.delivered", { email_id: m.resendId });
    assert.equal(msgs()[0].status, "DELIVERED");
    assert.ok(msgs()[0].deliveredAt);
    await svc.handleWebhookEvent("email.bounced", { email_id: m.resendId, bounce: { message: "Mailbox full" } });
    assert.equal(msgs()[0].status, "BOUNCED");
    assert.equal(msgs()[0].failureReason, "Mailbox full");
    await svc.handleWebhookEvent("email.complained", { email_id: m.resendId });
    assert.equal(msgs()[0].status, "COMPLAINED");
    assert.ok(db.adoptionUser.rows.find((x) => x.id === u.id)!.emailUnsubscribedAt);
  });

  it("unknown message ids are ignored", async () => {
    await svc.handleWebhookEvent("email.delivered", { email_id: "nope" });
    await svc.handleWebhookEvent("email.delivered", {});
  });

  it("stats count sent, delivered, failed, pending and active automations", async () => {
    const { m } = await sentMessage();
    await svc.handleWebhookEvent("email.delivered", { email_id: m.resendId });
    const s = await svc.stats();
    assert.equal(s.totalSent, 1);
    assert.equal(s.delivered, 1);
    assert.equal(s.failed, 0);
    assert.equal(s.activeAutomations, 1);
  });

  it("activity search and status filter work", async () => {
    await sentMessage();
    assert.equal((await svc.activity({ search: "EXAMPLE.com" })).total, 1);
    assert.equal((await svc.activity({ search: "zzz" })).total, 0);
    assert.equal((await svc.activity({ status: "SENT" })).total, 1);
    assert.equal((await svc.activity({ status: "FAILED" })).total, 0);
  });
});

describe("connection check", () => {
  it("reports not configured, ok, restricted-key ok, and a real error", async () => {
    configured = false;
    assert.equal((await svc.checkConnection()).ok, false);
    configured = true;
    assert.equal((await svc.checkConnection()).ok, true);
    const mk = (check: () => Promise<void>) => new EmailAutomationService({ db: db as unknown as PrismaClient, sender: { ...sender, check }, isEnabled: () => true, isConfigured: () => true, unsubscribeUrl: () => null, appName: "x" });
    assert.equal((await mk(async () => { throw Object.assign(new Error("restricted"), { name: "restricted_api_key" }); }).checkConnection()).ok, true);
    const bad = await mk(async () => { throw Object.assign(new Error("API key is invalid"), { name: "validation_error" }); }).checkConnection();
    assert.equal(bad.ok, false);
    assert.match(bad.message, /invalid/);
  });
});

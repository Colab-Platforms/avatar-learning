import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { backoffMinutes, canEmail, classifySendError, effectiveType, isValidEmail, payloadHash, manualKey, oneLine, renderEmail, renderString, unknownVariables, unsubscribeToken, verifyResendSignature, verifyUnsubscribeToken } from "../../src/modules/email-automation/email.lib.js";

describe("template rendering", () => {
  it("fills variables and HTML-escapes values in the body but not in subject/text", () => {
    assert.equal(renderString("Hi {{ name }}", { name: "<b>A&B</b>" }, "html"), "Hi &lt;b&gt;A&amp;B&lt;/b&gt;");
    assert.equal(renderString("Hi {{name}}", { name: "A&B" }, "text"), "Hi A&B");
  });
  it("missing variables become empty and unknown ones are detected", () => {
    assert.equal(renderString("x{{company}}y", {}, "html"), "xy");
    assert.deepEqual(unknownVariables("Hello {{nmae}}", "{{name}} {{foo_bar}}"), ["nmae", "foo_bar"]);
  });
  it("subject can never contain a line break (header injection)", () => {
    assert.equal(oneLine("a\r\nBcc: x@y.com"), "a Bcc: x@y.com");
    const r = renderEmail({ subject: "Hi {{name}}", htmlBody: "<p>x</p>" }, { name: "A\r\nBcc: evil@x.com" });
    assert.ok(!/[\r\n]/.test(r.subject));
  });
  it("promotional footer adds an unsubscribe link; plain text is derived when absent", () => {
    const r = renderEmail({ subject: "s", htmlBody: "<p>Hello <b>you</b></p>" }, { unsubscribe_url: "https://x.test/u?a=1&b=2" }, { footer: true });
    assert.match(r.html, /Unsubscribe/);
    assert.match(r.html, /a=1&amp;b=2/);
    assert.match(r.text, /Hello you/);
    assert.match(r.text, /Unsubscribe: https:\/\/x\.test/);
  });
});

describe("recipient validation and consent", () => {
  it("validates addresses", () => {
    for (const ok of ["a@b.co", "first.last+tag@sub.example.com"]) assert.equal(isValidEmail(ok), true, ok);
    for (const bad of ["", "a@b", "a b@c.com", "a@b.c", "<a@b.com>", "a@b.com,c@d.com", 5 as unknown as string]) assert.equal(isValidEmail(bad), false, String(bad));
  });
  const base = { isActive: true, emailVerified: true, marketingEmailOptIn: false, emailUnsubscribedAt: null as Date | null };
  it("transactional needs only an active, verified account", () => {
    assert.deepEqual(canEmail("TRANSACTIONAL", base), { ok: true });
    assert.deepEqual(canEmail("TRANSACTIONAL", { ...base, emailVerified: false }), { ok: false, reason: "EMAIL_NOT_VERIFIED" });
    assert.deepEqual(canEmail("TRANSACTIONAL", { ...base, isActive: false }), { ok: false, reason: "ACCOUNT_INACTIVE" });
  });
  it("promotional needs consent and no unsubscribe", () => {
    assert.deepEqual(canEmail("PROMOTIONAL", base), { ok: false, reason: "NO_MARKETING_CONSENT" });
    assert.deepEqual(canEmail("PROMOTIONAL", { ...base, marketingEmailOptIn: true }), { ok: true });
    assert.deepEqual(canEmail("PROMOTIONAL", { ...base, marketingEmailOptIn: true, emailUnsubscribedAt: new Date() }), { ok: false, reason: "UNSUBSCRIBED" });
  });
});

describe("unsubscribe token", () => {
  it("verifies only for the same user and secret", () => {
    const t = unsubscribeToken("user1", "secret");
    assert.equal(verifyUnsubscribeToken("user1", t, "secret"), true);
    assert.equal(verifyUnsubscribeToken("user2", t, "secret"), false);
    assert.equal(verifyUnsubscribeToken("user1", t, "other"), false);
    assert.equal(verifyUnsubscribeToken("user1", "short", "secret"), false);
  });
});

describe("Resend webhook signature", () => {
  const secretBytes = crypto.randomBytes(24);
  const secret = `whsec_${secretBytes.toString("base64")}`;
  const body = JSON.stringify({ type: "email.delivered", data: { email_id: "abc" } });
  const sign = (id: string, ts: string, b: string) => `v1,${crypto.createHmac("sha256", secretBytes).update(`${id}.${ts}.${b}`).digest("base64")}`;
  const nowMs = 1_800_000_000_000;
  const ts = String(nowMs / 1000);

  it("accepts a correct signature (also among several)", () => {
    const good = sign("msg_1", ts, body);
    assert.equal(verifyResendSignature({ secret, id: "msg_1", timestamp: ts, signature: good, rawBody: body, nowMs }), true);
    assert.equal(verifyResendSignature({ secret, id: "msg_1", timestamp: ts, signature: `v1,AAAA ${good}`, rawBody: body, nowMs }), true);
  });
  it("rejects a tampered body, wrong secret, missing headers and replayed (stale) timestamps", () => {
    const good = sign("msg_1", ts, body);
    assert.equal(verifyResendSignature({ secret, id: "msg_1", timestamp: ts, signature: good, rawBody: body + " ", nowMs }), false);
    assert.equal(verifyResendSignature({ secret: `whsec_${crypto.randomBytes(24).toString("base64")}`, id: "msg_1", timestamp: ts, signature: good, rawBody: body, nowMs }), false);
    assert.equal(verifyResendSignature({ secret, id: undefined, timestamp: ts, signature: good, rawBody: body, nowMs }), false);
    assert.equal(verifyResendSignature({ secret, id: "msg_1", timestamp: ts, signature: good, rawBody: body, nowMs: nowMs + 10 * 60_000 }), false);
    assert.equal(verifyResendSignature({ secret: "", id: "msg_1", timestamp: ts, signature: good, rawBody: body, nowMs }), false);
  });
});

describe("retry policy and dedupe keys", () => {
  it("classifies by the SDK's typed error name, never by guessing an HTTP status", () => {
    const k = (name: string, statusCode?: number | null) => classifySendError({ name, statusCode, message: "m" }).kind;
    // outright refusals: nothing was sent
    for (const n of ["validation_error", "invalid_from_address", "invalid_api_key", "restricted_api_key", "missing_required_field", "invalid_idempotency_key"]) assert.equal(k(n), "REJECTED", n);
    // capacity refusals: nothing was sent, retry later (same key)
    for (const n of ["rate_limit_exceeded", "daily_quota_exceeded", "monthly_quota_exceeded"]) assert.equal(k(n), "TRANSIENT", n);
    // the two idempotency conflicts are handled explicitly
    assert.equal(k("concurrent_idempotent_requests"), "IN_FLIGHT");
    assert.equal(k("invalid_idempotent_request"), "CONFLICT");
    // outcome unknown: timeout, network failure (SDK: application_error + null status), server error, or anything unrecognised
    for (const n of ["application_error", "internal_server_error", "SendTimeout", "something_new"]) assert.equal(k(n), "AMBIGUOUS", n);
    assert.equal(classifySendError(new Error("socket hang up")).kind, "AMBIGUOUS");
  });
  it("a status code alone never makes an error a refusal (409, 422, 500 without a known name are all ambiguous)", () => {
    for (const code of [409, 422, 500, 401, null]) assert.equal(classifySendError({ statusCode: code, message: "x" }).kind, "AMBIGUOUS", String(code));
  });
  it("a name wins over whatever status accompanies it", () => {
    assert.equal(classifySendError({ name: "invalid_idempotent_request", statusCode: 422 }).kind, "CONFLICT");
    assert.equal(classifySendError({ name: "validation_error", statusCode: 500 }).kind, "REJECTED");
  });
  it("backs off 1, 5, 30 minutes", () => assert.deepEqual([1, 2, 3, 4].map(backoffMinutes), [1, 5, 30, 30]));
  it("manual keys collapse a double click but not a different time", () => {
    const t = Date.parse("2026-11-21T10:00:00Z");
    assert.equal(manualKey("t", "u", null, t), manualKey("t", "u", null, t + 60_000));
    assert.notEqual(manualKey("t", "u", null, t), manualKey("t", "u", null, t + 11 * 60_000));
    assert.notEqual(manualKey("t", "u", new Date("2026-12-01T00:00:00Z"), t), manualKey("t", "u", new Date("2026-12-02T00:00:00Z"), t));
  });
});

describe("consent type for broadcasts", () => {
  it("a scheduled broadcast is always promotional, whatever its template says; other triggers keep the template's type", () => {
    assert.equal(effectiveType("SCHEDULED_EMAIL", "TRANSACTIONAL"), "PROMOTIONAL");
    assert.equal(effectiveType("SCHEDULED_EMAIL", "PROMOTIONAL"), "PROMOTIONAL");
    assert.equal(effectiveType("USER_REGISTERED", "TRANSACTIONAL"), "TRANSACTIONAL");
    assert.equal(effectiveType("FOLLOW_UP", "PROMOTIONAL"), "PROMOTIONAL");
    assert.equal(effectiveType("MANUAL_SEND", "TRANSACTIONAL"), "TRANSACTIONAL");
  });
});

describe("payload hash", () => {
  const base = { toEmail: "a@b.co", subject: "s", html: "<p>h</p>", text: "t", listUnsubscribe: null as string | null };
  it("is stable and changes with any part of the payload", () => {
    assert.equal(payloadHash(base), payloadHash({ ...base }));
    for (const change of [{ toEmail: "x@b.co" }, { subject: "s2" }, { html: "<p>h2</p>" }, { text: "t2" }, { listUnsubscribe: "<u>" }]) assert.notEqual(payloadHash(base), payloadHash({ ...base, ...change }));
  });
  it("cannot be confused by moving text between fields", () => {
    assert.notEqual(payloadHash({ ...base, subject: "ab", html: "c" }), payloadHash({ ...base, subject: "a", html: "bc" }));
  });
});

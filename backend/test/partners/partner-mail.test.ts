import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { resend } from "../../src/utils/mailer.js";
import {
  getSupportEmail,
  sendPartnerApplicationEmail,
  sendPartnerClaimEmail,
  SupportEmailConfigError,
} from "../../src/modules/partners/partner.mail.js";

const partner = { type: "INDIVIDUAL", organizationName: "Org", contactPerson: "Pat", phone: "9876543210", email: "pat@example.com" };
const realSend = resend.emails.send;
const realSupport = process.env.SUPPORT_EMAIL;
const realError = console.error;
let calls: any[];
let sendResult: any;
let logged: unknown[][];

beforeEach(() => {
  calls = [];
  logged = [];
  sendResult = { data: { id: "fake" }, error: null };
  (resend.emails as any).send = async (p: any) => { calls.push(p); return sendResult; };
  console.error = (...a: unknown[]) => { logged.push(a); };
});
afterEach(() => {
  (resend.emails as any).send = realSend;
  console.error = realError;
  if (realSupport === undefined) delete process.env.SUPPORT_EMAIL; else process.env.SUPPORT_EMAIL = realSupport;
});

describe("partner.mail — SUPPORT_EMAIL configured", () => {
  beforeEach(() => { process.env.SUPPORT_EMAIL = "support@example.com"; });

  it("sends the application email to SUPPORT_EMAIL and returns true", async () => {
    assert.equal(await sendPartnerApplicationEmail(partner), true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].to, "support@example.com");
    assert.equal(calls[0].subject, "New partner application (INDIVIDUAL)");
    assert.match(calls[0].html, /Pat/);
  });

  it("sends the claim email to SUPPORT_EMAIL and returns true", async () => {
    assert.equal(await sendPartnerClaimEmail(partner, 500), true);
    assert.equal(calls[0].to, "support@example.com");
    assert.equal(calls[0].subject, "Partner payout claim — Rs.500");
  });

  it("returns false (never true) when Resend reports an error, as before it only logs", async () => {
    sendResult = { data: null, error: { message: "boom" } };
    assert.equal(await sendPartnerApplicationEmail(partner), false);
    assert.equal(await sendPartnerClaimEmail(partner, 1), false);
    assert.equal(logged.length, 2);
  });
});

describe("partner.mail — SUPPORT_EMAIL missing", () => {
  for (const value of [undefined, "", "   "]) {
    it(`getSupportEmail throws a controlled config error (${JSON.stringify(value)})`, () => {
      assert.throws(() => getSupportEmail({ SUPPORT_EMAIL: value }), (e: any) => {
        assert.ok(e instanceof SupportEmailConfigError);
        assert.equal(e.code, "SUPPORT_EMAIL_NOT_CONFIGURED");
        assert.equal(e.statusCode, 503);
        return true;
      });
    });
  }

  it("neither email is sent, both return false and the config error is logged clearly", async () => {
    delete process.env.SUPPORT_EMAIL;
    assert.equal(await sendPartnerApplicationEmail(partner), false);
    assert.equal(await sendPartnerClaimEmail(partner, 500), false);
    assert.equal(calls.length, 0, "Resend must not be called");
    assert.equal(logged.length, 2);
    for (const l of logged) assert.ok(l.some((x) => x instanceof SupportEmailConfigError));
  });

  it("the config error does not leak the partner's personal data", () => {
    assert.ok(!/pat@example\.com|9876543210/.test(new SupportEmailConfigError().message));
  });
});

describe("partner module import with no env (clean process)", () => {
  it("importing partner.mail and partner.service does not throw; sending reports false", () => {
    const env: NodeJS.ProcessEnv = { ...process.env, DOTENV_CONFIG_PATH: path.join("nonexistent", ".env") };
    for (const k of ["SUPPORT_EMAIL", "RESEND_API_KEY", "SMTP_FROM_EMAIL"]) delete env[k];
    const r = spawnSync(process.execPath, ["--import", "tsx", "test/partners/child-import.ts"], { env, encoding: "utf8", cwd: process.cwd() });
    assert.equal(r.status, 0, r.stderr);
    const line = r.stdout.split("\n").find((l) => l.startsWith("RESULT "));
    assert.ok(line, r.stdout + r.stderr);
    assert.deepEqual(JSON.parse(line.slice(7)), { imported: true, sent: false });
  });
});

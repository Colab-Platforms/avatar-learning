import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createMailClient, MailConfigError } from "../../src/utils/mailer.js";

class FakeResend {
  static keys: string[] = [];
  sent: unknown[] = [];
  emails = { send: async (p: unknown) => { this.sent.push(p); return { data: { id: "fake" }, error: null }; } };
  constructor(key: string) { FakeResend.keys.push(key); }
}

describe("createMailClient", () => {
  it("configured: builds the Resend client with the key and exposes the sender, unchanged behaviour", async () => {
    FakeResend.keys = [];
    const m = createMailClient({ RESEND_API_KEY: "re_test", SMTP_FROM_EMAIL: "no-reply@example.com" }, FakeResend);
    assert.equal(m.configured, true);
    assert.equal(m.fromEmail, "no-reply@example.com");
    assert.deepEqual(FakeResend.keys, ["re_test"]);
    assert.ok(m.client instanceof FakeResend);
    const r = await m.client.emails.send({ to: "x" });
    assert.equal(r.data.id, "fake");
  });

  for (const [label, env] of [
    ["no key", { SMTP_FROM_EMAIL: "a@b.co" }],
    ["blank key", { RESEND_API_KEY: "  ", SMTP_FROM_EMAIL: "a@b.co" }],
    ["no sender", { RESEND_API_KEY: "re_test" }],
    ["nothing", {}],
  ] as const) {
    it(`unconfigured (${label}): does not throw, never constructs Resend, send rejects with MailConfigError`, async () => {
      FakeResend.keys = [];
      const m = createMailClient(env, FakeResend);
      assert.equal(m.configured, false);
      assert.deepEqual(FakeResend.keys, []);
      await assert.rejects(() => m.client.emails.send({ to: "x" }), (e: any) => {
        assert.ok(e instanceof MailConfigError);
        assert.equal(e.code, "MAIL_NOT_CONFIGURED");
        assert.equal(e.statusCode, 503);
        return true;
      });
    });
  }

  it("the error message does not contain any env value", async () => {
    const m = createMailClient({ RESEND_API_KEY: "", SMTP_FROM_EMAIL: "secret@example.com" }, FakeResend);
    await assert.rejects(() => m.client.emails.send({}), (e: any) => !/secret@example\.com/.test(e.message));
  });
});

describe("mailer module with no mail env (real import in a clean process)", () => {
  it("imports without throwing and sendOtpEmail / sendPasswordResetEmail / resend.emails.send reject with MailConfigError", () => {
    const env: NodeJS.ProcessEnv = { ...process.env, DOTENV_CONFIG_PATH: path.join("nonexistent", ".env") };
    delete env.RESEND_API_KEY;
    delete env.SMTP_FROM_EMAIL;
    const r = spawnSync(process.execPath, ["--import", "tsx", "test/mailer/child-unconfigured.ts"], { env, encoding: "utf8", cwd: process.cwd() });
    assert.equal(r.status, 0, r.stderr);
    const line = r.stdout.split("\n").find((l) => l.startsWith("RESULT "));
    assert.ok(line, r.stdout + r.stderr);
    const res = JSON.parse(line.slice(7));
    const expected = { code: "MAIL_NOT_CONFIGURED", status: 503, isMailConfigError: true };
    assert.equal(res.configured, false);
    assert.deepEqual(res.otp, expected);
    assert.deepEqual(res.reset, expected);
    assert.deepEqual(res.direct, expected);
  });
});

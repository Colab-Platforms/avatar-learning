import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { resend } from "../../src/utils/mailer.js";
import { getRequiredLink, missingRequiredLinks, MissingConfigError } from "../../src/utils/requiredLinks.js";
import { sendPaymentConfirmationEmail } from "../../src/modules/payment/payment.mail.js";
import { sendWebinarPaymentConfirmationEmail, sendWebinarRecoveryOtpEmail } from "../../src/modules/webinar/webinar.mail.js";

const COMMUNITY = "https://chat.whatsapp.com/community-abc";
const GROUP = "https://chat.whatsapp.com/webinar-xyz";
const VARS = ["WHATSAPP_COMMUNITY_LINK", "WEBINAR_WHATSAPP_GROUP_LINK"] as const;
const saved: Record<string, string | undefined> = {};
const realSend = resend.emails.send;
const realLog = console.error;
let sent: any[];
let logged: string[];

const pay = () => sendPaymentConfirmationEmail("buyer@example.com", { name: "Pat", amount: 49900, productName: "Course" });
const web = () => sendWebinarPaymentConfirmationEmail("buyer@example.com", { name: "Pat", amount: 49900, currency: "INR", webinarTitle: "AI 101", webinarScheduledAt: new Date("2026-12-01T10:00:00Z") });
const otp = () => sendWebinarRecoveryOtpEmail("buyer@example.com", "123456");

beforeEach(() => {
  for (const v of VARS) saved[v] = process.env[v];
  sent = []; logged = [];
  (resend.emails as any).send = async (p: any) => { sent.push(p); return { data: { id: "fake" }, error: null }; };
  console.error = (...a: unknown[]) => { logged.push(a.map(String).join(" ")); };
});
afterEach(() => {
  for (const v of VARS) { if (saved[v] === undefined) delete process.env[v]; else process.env[v] = saved[v]; }
  (resend.emails as any).send = realSend;
  console.error = realLog;
});

describe("getRequiredLink / missingRequiredLinks", () => {
  it("returns a trimmed http(s) link", () => assert.equal(getRequiredLink("X", { X: "  https://a.b/c  " }), "https://a.b/c"));
  for (const bad of [undefined, "", "   ", "not a url", "javascript:alert(1)", "ftp://x.y", "your-link-here"]) {
    it(`rejects ${JSON.stringify(bad)} with MissingConfigError naming only the variable`, () => {
      assert.throws(() => getRequiredLink("X", { X: bad }), (e: any) => {
        assert.ok(e instanceof MissingConfigError);
        assert.equal(e.code, "CONFIG_NOT_SET");
        assert.equal(e.statusCode, 503);
        assert.equal(e.variable, "X");
        if (bad?.trim()) assert.ok(!e.message.includes(bad), "message must not echo the value");
        return true;
      });
    });
  }
  it("lists only the unusable names", () => assert.deepEqual(missingRequiredLinks(["A", "B"], { A: "https://x.y", B: " " }), ["B"]));
});

describe("payment confirmation email", () => {
  it("configured: sends with the real community link, unchanged recipient/subject", async () => {
    process.env.WHATSAPP_COMMUNITY_LINK = COMMUNITY;
    await pay();
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "buyer@example.com");
    assert.match(sent[0].subject, /We've received your payment — Course/);
    assert.ok(sent[0].html.includes(`href="${COMMUNITY}"`));
  });
  for (const [label, val] of [["missing", undefined], ["blank", "   "], ["placeholder", "changeme"]] as const) {
    it(`${label}: not sent, resolves normally (no failure after the DB write), logs the variable name only`, async () => {
      if (val === undefined) delete process.env.WHATSAPP_COMMUNITY_LINK; else process.env.WHATSAPP_COMMUNITY_LINK = val;
      await assert.doesNotReject(pay());
      assert.equal(sent.length, 0);
      assert.equal(logged.length, 1);
      assert.match(logged[0], /WHATSAPP_COMMUNITY_LINK/);
      assert.ok(!/buyer@example\.com|Pat/.test(logged[0]), "no personal data in the log");
    });
  }
});

describe("webinar confirmation email", () => {
  it("configured: both links appear in the email", async () => {
    process.env.WHATSAPP_COMMUNITY_LINK = COMMUNITY;
    process.env.WEBINAR_WHATSAPP_GROUP_LINK = GROUP;
    await web();
    assert.equal(sent.length, 1);
    assert.ok(sent[0].html.includes(`href="${GROUP}"`));
    assert.ok(sent[0].html.includes(`href="${COMMUNITY}"`));
  });
  const cases: Array<[string, string | undefined, string | undefined, string]> = [
    ["community missing", undefined, GROUP, "WHATSAPP_COMMUNITY_LINK"],
    ["group missing", COMMUNITY, undefined, "WEBINAR_WHATSAPP_GROUP_LINK"],
    ["group blank", COMMUNITY, "  ", "WEBINAR_WHATSAPP_GROUP_LINK"],
    ["community blank", "", GROUP, "WHATSAPP_COMMUNITY_LINK"],
  ];
  for (const [label, c, g, name] of cases) {
    it(`${label}: not sent, resolves normally, logs only the variable name`, async () => {
      if (c === undefined) delete process.env.WHATSAPP_COMMUNITY_LINK; else process.env.WHATSAPP_COMMUNITY_LINK = c;
      if (g === undefined) delete process.env.WEBINAR_WHATSAPP_GROUP_LINK; else process.env.WEBINAR_WHATSAPP_GROUP_LINK = g;
      await assert.doesNotReject(web());
      assert.equal(sent.length, 0);
      assert.match(logged[0], new RegExp(name));
      assert.ok(!/buyer@example\.com|Pat/.test(logged[0]));
    });
  }
  it("both missing: names both variables", async () => {
    delete process.env.WHATSAPP_COMMUNITY_LINK; delete process.env.WEBINAR_WHATSAPP_GROUP_LINK;
    await web();
    assert.equal(sent.length, 0);
    assert.match(logged[0], /WHATSAPP_COMMUNITY_LINK, WEBINAR_WHATSAPP_GROUP_LINK/);
  });
  it("recovery OTP email does not need the links and still sends", async () => {
    delete process.env.WHATSAPP_COMMUNITY_LINK; delete process.env.WEBINAR_WHATSAPP_GROUP_LINK;
    await otp();
    assert.equal(sent.length, 1);
  });
});

describe("clean-process import with no link/mail env", () => {
  it("payment/webinar mail + services import without throwing; confirmation emails are not sent, OTP still is", () => {
    const env: NodeJS.ProcessEnv = { ...process.env, DOTENV_CONFIG_PATH: path.join("nonexistent", ".env") };
    for (const k of [...VARS, "SUPPORT_EMAIL", "RESEND_API_KEY", "SMTP_FROM_EMAIL"]) delete env[k];
    const r = spawnSync(process.execPath, ["--import", "tsx", "test/mail-links/child-import.ts"], { env, encoding: "utf8", cwd: process.cwd() });
    assert.equal(r.status, 0, r.stderr);
    const line = r.stdout.split("\n").find((l) => l.startsWith("RESULT "));
    assert.ok(line, r.stdout + r.stderr);
    assert.deepEqual(JSON.parse(line.slice(7)), { imported: true, sends: 1 });
  });
});

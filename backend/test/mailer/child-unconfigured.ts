// Run in a child process with no mail env: verifies import never throws and sends fail loudly.
const m = await import("../../src/utils/mailer.js");
const out: Record<string, unknown> = { configured: m.isMailConfigured };
for (const [name, fn] of [
  ["otp", () => m.sendOtpEmail("a@b.co", "123456", "LOGIN")],
  ["reset", () => m.sendPasswordResetEmail("a@b.co", "tok")],
  ["direct", () => m.resend.emails.send({ from: "x", to: "a@b.co", subject: "s", html: "h" } as any)],
] as const) {
  try {
    await fn();
    out[name] = "resolved";
  } catch (e: any) {
    out[name] = { code: e.code, status: e.statusCode, isMailConfigError: e instanceof m.MailConfigError };
  }
}
console.log("RESULT " + JSON.stringify(out));

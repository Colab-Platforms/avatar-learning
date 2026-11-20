// Child process with NO link/mail env: imports must not throw; sends must fail safe.
const pay = await import("../../src/modules/payment/payment.mail.js");
const web = await import("../../src/modules/webinar/webinar.mail.js");
await import("../../src/modules/payment/payment.service.js");
await import("../../src/modules/webinar/webinar.service.js");
const { resend } = await import("../../src/utils/mailer.js");
let sends = 0;
(resend.emails as any).send = async () => { sends++; return { data: { id: "x" }, error: null }; };
await pay.sendPaymentConfirmationEmail("a@b.co", { name: "N", amount: 100, productName: "P" });
await web.sendWebinarPaymentConfirmationEmail("a@b.co", { name: "N", amount: 100, currency: "INR", webinarTitle: null, webinarScheduledAt: null });
await web.sendWebinarRecoveryOtpEmail("a@b.co", "123456");
console.log("RESULT " + JSON.stringify({ imported: true, sends }));

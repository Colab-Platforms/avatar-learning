// Run in a child process with NO mail/support env: importing must not throw.
const m = await import("../../src/modules/partners/partner.mail.js");
await import("../../src/modules/partners/partner.service.js");
const r = await m.sendPartnerApplicationEmail({ type: "X", organizationName: null, contactPerson: null, phone: "1", email: "a@b.co" });
console.log("RESULT " + JSON.stringify({ imported: true, sent: r }));

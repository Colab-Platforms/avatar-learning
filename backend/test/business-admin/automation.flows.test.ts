import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

// ─── SAFETY: this file runs the REAL auth / webinar / payment / course service code against an in-memory fake of the
// Prisma client. It must never reach a real database, mail provider, Google Sheets, Pabbly, Razorpay or Cashfree.
//  1. DATABASE_URL points at a dead local port BEFORE prisma is imported (dotenv never overrides an existing variable), so any
//     query we forgot to fake fails instantly instead of touching a real database.
//  2. Every integration credential is blanked the same way, and global fetch is replaced with a recorder that refuses.
const BLANK = ["RESEND_API_KEY", "SMTP_FROM_EMAIL", "GOOGLE_SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "PABBLY_SIGNUP_WEBHOOK_URL", "PABBLY_BASIC_COURSE_PURCHASE_WEBHOOK_URL", "PABBLY_D2H_PURCHASE_WEBHOOK_URL", "CASHFREE_APP_ID", "CASHFREE_SECRET_KEY", "RAZORPAY_KEY_ID", "MSG91_AUTH_KEY"];
const saved: Record<string, string | undefined> = {};
for (const k of [...BLANK, "DATABASE_URL", "RAZORPAY_KEY_SECRET", "JWT_SECRET", "WHATSAPP_AUTOMATION_ENABLED"]) saved[k] = process.env[k];
for (const k of BLANK) process.env[k] = "";
process.env.DATABASE_URL = "postgresql://nobody:nobody@127.0.0.1:1/none";
process.env.RAZORPAY_KEY_SECRET = "test_razorpay_secret_not_real";
process.env.JWT_SECRET = "test_jwt_secret_not_real_0123456789";
process.env.WHATSAPP_AUTOMATION_ENABLED = "true"; // only inside this test process; the engine below uses a fake sender
const realFetch = globalThis.fetch;
const netCalls: string[] = [];
globalThis.fetch = (async (url: unknown) => {
  netCalls.push(String(url));
  throw new Error("network is disabled in tests");
}) as typeof fetch;

const { default: prisma } = await import("../../prisma.js");
const { default: AuthService } = await import("../../src/modules/auth/auth.service.js");
const { WebinarService } = await import("../../src/modules/webinar/webinar.service.js");
const { PaymentService } = await import("../../src/modules/payment/payment.service.js");
const { PublicCourseService } = await import("../../src/modules/course/course.service.js");
const { setAutomationTrigger } = await import("../../src/modules/business-admin/automation.emit.js");
const { PrismaInboxStore } = await import("../../src/modules/business-admin/inbox.store.js");
const { InboxService } = await import("../../src/modules/business-admin/inbox.service.js");
const { TemplatesService } = await import("../../src/modules/business-admin/templates.service.js");
const { AutomationService } = await import("../../src/modules/business-admin/automation.service.js");
const { MemoryAutomationStore } = await import("../../src/modules/business-admin/automation.store.js");
const { EVENTS } = await import("../../src/modules/business-admin/automation.events.js");
const { FakeInboxDb, FakeSender, readyConfig } = await import("./fakes.js");

const db: any = prisma;
const originals: Array<() => void> = [];
/** Replace a method on the real prisma client object with a fake (restored after each test). */
function fake(path: string, fn: (...a: any[]) => any) {
  const parts = path.split(".");
  const key = parts.pop()!;
  const holder = parts.reduce((o, p) => o[p], db);
  const had = Object.prototype.hasOwnProperty.call(holder, key);
  const prev = holder[key];
  holder[key] = fn;
  originals.push(() => (had ? (holder[key] = prev) : delete holder[key]));
}

const WA = "919876543210";
const world = (opts: { consent?: Record<string, "granted" | "withdrawn" | "unknown"> } = {}) => {
  const inboxDb = new FakeInboxDb();
  const inboxStore = new PrismaInboxStore(inboxDb, { BUSINESS_ADMIN_EMAILS: "" });
  const sender = new FakeSender();
  const defs = EVENTS.map((e, i) => ({ id: String(500000 + i), name: e.suggested.name, language: "en", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: e.suggested.body }] }));
  const templates = new TemplatesService({ fetchTemplates: async () => defs, ttlMs: 0 });
  const inbox = new InboxService({ store: inboxStore, sender, getConfig: () => readyConfig(), templates, consent: { check: async (w: string) => opts.consent?.[w] ?? "granted" } });
  const store = new MemoryAutomationStore();
  for (const e of EVENTS) {
    store.rules.push({
      id: `rule_${e.key}`, name: e.activity, triggerEvent: e.key, templateName: e.suggested.name, templateLanguage: "en", isActive: true,
      variableMapping: Object.fromEntries(e.suggested.mapping.map((k, i) => [String(i + 1), { source: "field" as const, key: k, ...(k === "name" ? { fallback: "there" } : {}) }])),
      createdByUserId: null, updatedByUserId: null, createdAt: new Date(), updatedAt: null,
    });
  }
  const engine = new AutomationService({ store, templates, inbox, inboxStore, isEnabled: () => true });
  setAutomationTrigger((i) => engine.trigger(i));
  /** Let the fire-and-forget hook finish, then drain the queue (what the worker does). */
  const settle = async () => {
    await new Promise((r) => setTimeout(r, 40));
    await engine.processDue();
  };
  const texts = () => inboxDb.messages.filter((m: any) => m.direction === "OUTBOUND").map((m: any) => m.textBody as string);
  return { engine, store, sender, settle, texts, execs: () => store.execs };
};

before(() => undefined);
beforeEach(() => {
  netCalls.length = 0;
});
after(() => {
  setAutomationTrigger(null);
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
});
const restore = () => {
  while (originals.length) originals.pop()!();
};

// ─── user.registered ─────────────────────────────────────────────────────────
describe("registration → user.registered (POST /api/auth/verify-otp)", () => {
  const user = (over: Record<string, unknown> = {}) => ({ id: "u1", email: "asha@example.com", firstName: "Asha", lastName: "K", phoneNo: "9876543210", password: "hashed", isEmailVerified: false, profileCompleted: true, authProvider: "EMAIL", userRoleMappings: [{ role: { name: "USER" } }], ...over });
  const wire = (u: any, otpFound = true) => {
    fake("otpVerification.findFirst", async () => (otpFound ? { id: "o1", expiresAt: new Date(Date.now() + 60_000) } : null));
    fake("otpVerification.update", async () => ({}));
    fake("user.findFirst", async () => u);
    fake("user.update", async () => u);
    fake("session.create", async () => ({}));
  };
  const verify = (type: string) => new AuthService().verifyOtp({ email: "asha@example.com", otp: "123456", type } as any);

  it("a successful registration verification sends the welcome message; verifying again sends nothing", async () => {
    const w = world();
    const u = user();
    wire(u);
    await verify("REGISTER");
    await w.settle();
    assert.deepEqual(w.texts(), ["Hi Asha, welcome to Avatar! Your account is ready. Explore our courses and start learning today."]);
    assert.equal(w.execs()[0].contactWaId, WA);
    assert.equal(w.execs()[0].status, "SENT");
    // the account is now verified: a second OTP verification (or a retry) must not message again
    wire({ ...u, isEmailVerified: true });
    await verify("REGISTER");
    await w.settle();
    assert.equal(w.texts().length, 1);
    restore();
  });
  it("a wrong/expired OTP, or a LOGIN verification, sends nothing", async () => {
    const w = world();
    wire(user(), false);
    await assert.rejects(() => verify("REGISTER"), /Invalid OTP/);
    restore();
    wire(user());
    await verify("LOGIN");
    await w.settle();
    assert.equal(w.execs().length, 0);
    restore();
  });
  it("a customer without a phone number gets nothing and the registration still succeeds", async () => {
    const w = world();
    wire(user({ phoneNo: null }));
    const r = await verify("REGISTER");
    await w.settle();
    assert.ok(r.accessToken);
    assert.equal(w.execs().length, 0);
    restore();
  });
  it("a messaging failure never breaks the registration", async () => {
    world();
    setAutomationTrigger(async () => {
      throw new Error("automation database down");
    });
    wire(user());
    const r = await verify("REGISTER");
    assert.ok(r.accessToken, "registration completed");
    restore();
  });
});

// ─── webinar.registered ──────────────────────────────────────────────────────
describe("webinar → webinar.registered (free registration, POST /api/webinar/verify-payment, Razorpay webhook)", () => {
  const schedule = { id: "s1", title: "AI for Beginners", scheduledAt: new Date("2026-11-28T12:00:00Z"), priceInPaise: 0, isPublished: true, isLive: true };
  let regs: any[];
  const wire = (price = 0) => {
    regs = [];
    const sch = { ...schedule, priceInPaise: price };
    fake("webinarSchedule.findFirst", async () => sch);
    fake("webinarRegistration.findFirst", async ({ where }: any) => regs.find((r) => r.email === where.email && r.status === where.status) ?? null);
    fake("webinarRegistration.create", async ({ data }: any) => {
      const r = { id: `reg${regs.length + 1}`, ...data };
      regs.push(r);
      return { ...r };
    });
    fake("webinarRegistration.update", async ({ where, data, include }: any) => {
      const r = regs.find((x) => x.id === where.id);
      Object.assign(r, data);
      return { ...r, ...(include ? { webinarSchedule: sch } : {}) };
    });
    fake("webinarRegistration.findUnique", async ({ where }: any) => {
      const r = regs.find((x) => x.razorpayOrderId === where.razorpayOrderId);
      return r ? { ...r, webinarSchedule: sch } : null;
    });
  };
  const sign = (order: string, pay: string) => createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${order}|${pay}`).digest("hex");
  const pending = (over: Record<string, unknown> = {}) => ({ id: "regP", name: "Asha", email: "asha@example.com", phoneNumber: "9876543210", amount: 49900, currency: "INR", status: "PENDING", razorpayOrderId: "order_W1", paidAt: null, ...over });

  it("a free registration confirms the seat and sends the message once", async () => {
    const w = world();
    wire(0);
    const r: any = await new WebinarService().createOrder({ name: "Asha", email: "asha@example.com", phoneNumber: "9876543210" } as any);
    await w.settle();
    assert.equal(r.isFree, true);
    assert.deepEqual(w.texts(), ["Hi Asha, your registration for AI for Beginners is confirmed. We will see you at the webinar."]);
    assert.equal(w.execs()[0].triggerEvent, "webinar.registered");
    restore();
  });
  it("a verified payment sends it once; a second verify call and the webhook for the same registration add nothing", async () => {
    const w = world();
    wire(49900);
    regs.push(pending());
    const svc = new WebinarService();
    await svc.verifyPayment("order_W1", "pay_W1", sign("order_W1", "pay_W1"));
    await svc.verifyPayment("order_W1", "pay_W1", sign("order_W1", "pay_W1")); // already PAID → no-op
    await svc.handleRazorpayWebhook({ event: "payment.captured", payload: { payment: { entity: { id: "pay_W1", order_id: "order_W1" } } } } as any); // status no longer PENDING → ignored
    await w.settle();
    assert.equal(w.texts().length, 1);
    assert.equal(w.execs().length, 1);
    restore();
  });
  it("the webhook alone (client never called verify) also confirms once", async () => {
    const w = world();
    wire(49900);
    regs.push(pending());
    await new WebinarService().handleRazorpayWebhook({ event: "payment.captured", payload: { payment: { entity: { id: "pay_W2", order_id: "order_W1" } } } } as any);
    await w.settle();
    assert.equal(w.texts().length, 1);
    restore();
  });
  it("a bad signature or a failed payment sends nothing", async () => {
    const w = world();
    wire(49900);
    regs.push(pending());
    const svc = new WebinarService();
    await assert.rejects(() => svc.verifyPayment("order_W1", "pay_W1", "0".repeat(64)), /signature/i);
    await svc.handleRazorpayWebhook({ event: "payment.failed", payload: { payment: { entity: { id: "pay_X", order_id: "order_W1" } } } } as any);
    await w.settle();
    assert.equal(w.execs().length, 0);
    assert.equal(regs[0].status, "FAILED");
    restore();
  });
  it("two simultaneous confirmations of the same registration still send one message", async () => {
    const w = world();
    wire(49900);
    regs.push(pending());
    const svc = new WebinarService();
    await Promise.all([svc.verifyPayment("order_W1", "pay_W1", sign("order_W1", "pay_W1")), svc.handleRazorpayWebhook({ event: "payment.captured", payload: { payment: { entity: { id: "pay_W1", order_id: "order_W1" } } } } as any)]);
    await w.settle();
    assert.equal(w.texts().length, 1, "engine dedups on the registration id even when both paths won the race");
    restore();
  });
});

// ─── payment.succeeded + course.enrolled ─────────────────────────────────────
describe("payment → payment.succeeded / course.enrolled (POST /api/payment/verify, Razorpay + Cashfree webhooks)", () => {
  let order: any;
  let mappers: any[];
  let txs: any[];
  let failNextTxCreate: boolean;
  const wire = () => {
    mappers = [];
    txs = [];
    failNextTxCreate = false;
    order = { id: "po1", userId: "u1", gatewayOrderId: "order_P1", productType: "COURSE", courseId: "c1", amount: 49900, status: "PENDING", direct2hireEnrollmentId: null };
    const user = { firstName: "Asha", lastName: "K", email: "asha@example.com", phoneNo: "9876543210" };
    fake("paymentOrder.findUnique", async ({ where }: any) => (where.gatewayOrderId === order.gatewayOrderId ? { ...order } : null));
    fake("paymentTransaction.findUnique", async ({ where }: any) => txs.find((t) => t.gatewayPaymentId === where.gatewayPaymentId) ?? null);
    fake("user.findUnique", async () => user);
    fake("courses.findUnique", async () => ({ title: "AI Foundations" }));
    fake("$transaction", async (fn: any) =>
      fn({
        paymentTransaction: {
          create: async ({ data }: any) => {
            if (failNextTxCreate || txs.some((t) => t.gatewayPaymentId === data.gatewayPaymentId)) throw Object.assign(new Error("Unique constraint"), { code: "P2002" });
            txs.push(data);
            return data;
          },
        },
        paymentOrder: { update: async ({ data }: any) => void Object.assign(order, data) },
        courseUserMapper: {
          findUnique: async () => mappers[0] ?? null,
          create: async ({ data }: any) => void mappers.push(data),
        },
      }),
    );
  };
  const razorpayCaptured = (payId = "pay_P1") => ({ event: "payment.captured", payload: { payment: { entity: { id: payId, order_id: "order_P1", method: "upi", notes: {} } } } }) as any;
  const cashfreeSuccess = (cf = 9001) => ({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "order_P1" }, payment: { cf_payment_id: cf, payment_status: "SUCCESS", payment_group: "upi" } } }) as any;
  const sign = (o: string, p: string) => createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${o}|${p}`).digest("hex");

  it("a captured course payment sends 'payment received' and 'welcome to your course', once each", async () => {
    const w = world();
    wire();
    await new PaymentService().handleRazorpayWebhook(razorpayCaptured());
    await w.settle();
    const t = w.texts().sort();
    assert.equal(t.length, 2);
    assert.ok(t.some((x) => x === "Hi Asha, we have received your payment of Rs 499 for AI Foundations. Thank you!"));
    assert.ok(t.some((x) => x === "Hi Asha, welcome to AI Foundations! You can start learning from your Avatar dashboard right away."));
    assert.deepEqual(w.execs().map((e) => e.status), ["SENT", "SENT"]);
    assert.deepEqual(netCalls, [], "no Razorpay / mail / Pabbly / Sheets call was attempted that succeeded");
    restore();
  });
  it("verify (client) + Razorpay webhook + Cashfree webhook for the SAME order send each message once", async () => {
    const w = world();
    wire();
    const svc = new PaymentService();
    await svc.verifyRazorpayPayment("u1", "order_P1", "pay_P1", sign("order_P1", "pay_P1"));
    await svc.handleRazorpayWebhook(razorpayCaptured("pay_P1"));
    await svc.handleCashfreeWebhook(cashfreeSuccess(9001)); // a different gateway id for the same, already-PAID order
    await w.settle();
    assert.equal(w.texts().length, 2, "payment + enrolment, no repeats");
    assert.equal(w.execs().length, 2);
    restore();
  });
  it("verify and webhook racing: whichever loses the transaction (P2002) sends nothing; the engine also dedups on the order", async () => {
    const w = world();
    wire();
    const svc = new PaymentService();
    await Promise.all([svc.verifyRazorpayPayment("u1", "order_P1", "pay_P1", sign("order_P1", "pay_P1")), svc.handleRazorpayWebhook(razorpayCaptured("pay_P1"))]);
    await w.settle();
    assert.equal(w.texts().length, 2);
    restore();
  });
  it("a failed payment, a bad signature, an unknown order or a Cashfree non-success send nothing", async () => {
    const w = world();
    wire();
    const svc = new PaymentService();
    fake("paymentOrder.update", async ({ data }: any) => void Object.assign(order, data));
    await svc.handleRazorpayWebhook({ event: "payment.failed", payload: { payment: { entity: { id: "pay_F", order_id: "order_P1" } } } } as any);
    await assert.rejects(() => svc.verifyRazorpayPayment("u1", "order_P1", "pay_P1", "0".repeat(64)), /signature/i);
    await svc.handleRazorpayWebhook({ event: "payment.captured", payload: { payment: { entity: { id: "pay_Z", order_id: "order_UNKNOWN" } } } } as any);
    await svc.handleCashfreeWebhook({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "order_P1" }, payment: { cf_payment_id: 1, payment_status: "FAILED" } } } as any);
    await w.settle();
    assert.equal(w.execs().length, 0);
    assert.equal(txs.length, 0, "nothing recorded either");
    restore();
  });
  it("a course the learner already had (existing access) still sends the payment message but not 'welcome to your course' twice", async () => {
    const w = world();
    wire();
    mappers.push({ tier: "D2H" });
    await new PaymentService().handleRazorpayWebhook(razorpayCaptured());
    await w.settle();
    assert.deepEqual(w.texts(), ["Hi Asha, we have received your payment of Rs 499 for AI Foundations. Thank you!"]);
    restore();
  });
  it("a messaging failure never breaks the payment", async () => {
    world();
    setAutomationTrigger(async () => {
      throw new Error("automation database down");
    });
    wire();
    await assert.doesNotReject(() => new PaymentService().handleRazorpayWebhook(razorpayCaptured()));
    assert.equal(order.status, "PAID");
    restore();
  });
});

// ─── course.enrolled (free enrolment) ────────────────────────────────────────
describe("free enrolment → course.enrolled (POST /api/courses/:courseId/enroll)", () => {
  let mappers: any[];
  const wire = (course: Record<string, unknown> = {}) => {
    mappers = [];
    fake("courses.findUnique", async () => ({ id: "c1", title: "AI Foundations", slug: "ai-foundations", price: 0, isComingSoon: false, isPublished: true, ...course }));
    fake("courseUserMapper.findUnique", async () => mappers[0] ?? null);
    fake("courseUserMapper.create", async ({ data }: any) => (mappers.push(data), data));
    fake("user.findUnique", async () => ({ firstName: "Asha", lastName: "K", email: "asha@example.com", phoneNo: "9876543210" }));
  };
  it("sends the welcome message once; re-enrolling, a paid course or a coming-soon course send nothing", async () => {
    const w = world();
    wire();
    const svc = new PublicCourseService();
    await svc.enrollUser("ai-foundations", "u1");
    await w.settle();
    assert.deepEqual(w.texts(), ["Hi Asha, welcome to AI Foundations! You can start learning from your Avatar dashboard right away."]);
    await assert.rejects(() => svc.enrollUser("ai-foundations", "u1"), /Already enrolled/);
    restore();
    wire({ price: 49900 });
    await assert.rejects(() => svc.enrollUser("ai-foundations", "u1"), /Paid course/);
    restore();
    wire({ isComingSoon: true });
    await assert.rejects(() => svc.enrollUser("ai-foundations", "u1"), /coming soon/);
    await w.settle();
    assert.equal(w.texts().length, 1);
    restore();
  });
});

// ─── safeguards through the real hooks ───────────────────────────────────────
describe("safeguards apply to real customer flows", () => {
  const regWire = () => {
    fake("otpVerification.findFirst", async () => ({ id: "o1", expiresAt: new Date(Date.now() + 60_000) }));
    fake("otpVerification.update", async () => ({}));
    const u = { id: "u1", email: "a@example.com", firstName: "Asha", lastName: "K", phoneNo: "9876543210", password: "h", isEmailVerified: false, profileCompleted: true, authProvider: "EMAIL", userRoleMappings: [{ role: { name: "USER" } }] };
    fake("user.findFirst", async () => u);
    fake("user.update", async () => u);
    fake("session.create", async () => ({}));
  };
  it("an opted-out customer is skipped (CONSENT_WITHDRAWN) and one with no opt-in is skipped (OPT_IN_REQUIRED); the registration still succeeds", async () => {
    for (const [state, reason] of [["withdrawn", "CONSENT_WITHDRAWN"], ["unknown", "OPT_IN_REQUIRED"]] as const) {
      const w = world({ consent: { [WA]: state } });
      regWire();
      const r = await new AuthService().verifyOtp({ email: "a@example.com", otp: "1", type: "REGISTER" } as any);
      await w.settle();
      assert.ok(r.accessToken);
      assert.equal(w.texts().length, 0);
      assert.equal(w.execs()[0].skipReason, reason);
      restore();
    }
  });
  it("with WHATSAPP_AUTOMATION_ENABLED off, the hook does nothing at all", async () => {
    const w = world();
    process.env.WHATSAPP_AUTOMATION_ENABLED = "false";
    try {
      regWire();
      await new AuthService().verifyOtp({ email: "a@example.com", otp: "1", type: "REGISTER" } as any);
      await w.settle();
      assert.equal(w.execs().length, 0);
    } finally {
      process.env.WHATSAPP_AUTOMATION_ENABLED = "true";
      restore();
    }
  });
  it("a disabled rule sends nothing", async () => {
    const w = world();
    w.store.rules.find((r) => r.triggerEvent === "user.registered")!.isActive = false;
    regWire();
    await new AuthService().verifyOtp({ email: "a@example.com", otp: "1", type: "REGISTER" } as any);
    await w.settle();
    assert.equal(w.execs().length, 0);
    restore();
  });
  it("no real network call was attempted by any flow above that reached a provider", () => {
    // fetch is recorder-only in this file; anything non-empty would mean code tried to reach Razorpay/Meta/mail/Pabbly/Sheets
    const providers = netCalls.filter((u) => /razorpay|cashfree|facebook|resend|pabbly|googleapis/i.test(u));
    assert.deepEqual(providers, []);
  });
});

import { after, afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

// ─── SAFETY: the real demo service, controller, automation engine, consent service and template validation run over
// in-memory stores and a FAKE WhatsApp sender. DATABASE_URL points at a dead port before anything is imported and fetch
// is replaced by a recorder that refuses, so nothing can reach a database, Meta or WhatsApp.
const saved: Record<string, string | undefined> = {};
for (const k of ["DATABASE_URL", "WHATSAPP_AUTOMATION_ENABLED", "JWT_SECRET"]) saved[k] = process.env[k];
process.env.DATABASE_URL = "postgresql://nobody:nobody@127.0.0.1:1/none";
process.env.JWT_SECRET = "test_jwt_secret_not_real_0123456789";
process.env.WHATSAPP_AUTOMATION_ENABLED = "true"; // inside this test process only; the engine below uses a fake sender
const realFetch = globalThis.fetch;
const netCalls: string[] = [];
const guardedFetch = (async (url: unknown, init?: unknown) => {
  if (/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(String(url))) return realFetch(url as never, init as never); // our own test server
  netCalls.push(String(url));
  throw new Error("network is disabled in tests");
}) as typeof fetch;
globalThis.fetch = guardedFetch;

const { default: express } = await import("express");
const { DemoBookingService, requestKeyFor } = await import("../../src/modules/demo/demo.service.js");
const { createDemoController } = await import("../../src/modules/demo/demo.controller.js");
const { validateDemoBooking, istToDate } = await import("../../src/modules/demo/demo.validators.js");
const { MemoryDemoBookings } = await import("../../src/modules/business-admin/devtest/demo.memory.js");
const { setAutomationTrigger } = await import("../../src/modules/business-admin/automation.emit.js");
const { PrismaInboxStore } = await import("../../src/modules/business-admin/inbox.store.js");
const { InboxService } = await import("../../src/modules/business-admin/inbox.service.js");
const { TemplatesService } = await import("../../src/modules/business-admin/templates.service.js");
const { AutomationService } = await import("../../src/modules/business-admin/automation.service.js");
const { MemoryAutomationStore } = await import("../../src/modules/business-admin/automation.store.js");
const { ContactsService } = await import("../../src/modules/business-admin/contacts.service.js");
const { EVENTS } = await import("../../src/modules/business-admin/automation.events.js");
const { WhatsappApiError } = await import("../../src/modules/whatsapp/whatsapp.client.js");
const { FakeInboxDb, FakeSender, readyConfig } = await import("../business-admin/fakes.js");

const NOW = new Date("2026-11-20T08:00:00Z");
const WA = "919876543210";
const body = (over: Record<string, unknown> = {}) => ({
  name: "Asha Verma",
  email: "Asha@Example.com",
  phone: "98765 43210",
  preferredDate: "2026-11-25",
  preferredTime: "16:00",
  company: "Acme",
  interestedTools: ["crm"],
  whatsappConsent: true,
  ...over,
});

interface World {
  url: string;
  bookings: InstanceType<typeof MemoryDemoBookings>;
  inboxDb: InstanceType<typeof FakeInboxDb>;
  sender: InstanceType<typeof FakeSender>;
  store: InstanceType<typeof MemoryAutomationStore>;
  triggers: any[];
  post(payload: unknown): Promise<{ status: number; json: any }>;
  settle(): Promise<void>;
  texts(): string[];
  close(): Promise<void>;
}

async function world(opts: { approved?: boolean; withEngine?: boolean } = {}): Promise<World> {
  const inboxDb = new FakeInboxDb();
  const bookings = new MemoryDemoBookings();
  const sender = new FakeSender();
  const inboxStore = new PrismaInboxStore(inboxDb, { BUSINESS_ADMIN_EMAILS: "" });
  const defs = EVENTS.map((e, i) => ({ id: String(500000 + i), name: e.suggested.name, language: "en", status: opts.approved === false ? "PENDING" : "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: e.suggested.body }] }));
  const templates = new TemplatesService({ fetchTemplates: async () => defs, ttlMs: 0 });
  const contacts = new ContactsService(inboxDb as never);
  const inbox = new InboxService({ store: inboxStore, sender, getConfig: () => readyConfig(), templates, consent: { check: (w: string) => contacts.consentFor(w) } });
  const store = new MemoryAutomationStore();
  for (const e of EVENTS) {
    store.rules.push({
      id: `rule_${e.key}`, name: e.activity, triggerEvent: e.key, templateName: e.suggested.name, templateLanguage: "en", isActive: true,
      variableMapping: Object.fromEntries(e.suggested.mapping.map((k, i) => [String(i + 1), { source: "field" as const, key: k, ...(k === "name" ? { fallback: "there" } : {}) }])),
      createdByUserId: null, updatedByUserId: null, createdAt: new Date(), updatedAt: null,
    });
  }
  const engine = new AutomationService({ store, templates, inbox, inboxStore, isEnabled: () => true });
  const triggers: any[] = [];
  if (opts.withEngine !== false) setAutomationTrigger(async (i) => (triggers.push(i), engine.trigger(i)));

  const service = new DemoBookingService({ demoBooking: bookings, whatsappContact: inboxDb.whatsappContact as never }, () => NOW);
  const app = express();
  app.use(express.json());
  app.post("/api/demo/book", createDemoController(() => service, () => NOW).book);
  const server: Server = await new Promise((r) => {
    const s = app.listen(0, "127.0.0.1", () => r(s));
  });
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    url,
    bookings,
    inboxDb,
    sender,
    store,
    triggers,
    post: async (payload) => {
      const res = await fetch(`${url}/api/demo/book`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      return { status: res.status, json: await res.json().catch(() => null) };
    },
    settle: async () => {
      await new Promise((r) => setTimeout(r, 40));
      await engine.processDue();
    },
    texts: () => inboxDb.messages.filter((m: any) => m.direction === "OUTBOUND").map((m: any) => m.textBody as string),
    close: () => new Promise((r) => server.close(() => r(undefined))),
  };
}

let w: World;
beforeEach(() => void (netCalls.length = 0));
afterEach(async () => {
  setAutomationTrigger(null);
  await w?.close();
});
after(() => {
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
});

describe("validation (pure)", () => {
  const ok = (over: Record<string, unknown> = {}) => validateDemoBooking(body(over), NOW);
  it("accepts a complete booking and converts the IST date/time to the right UTC instant", () => {
    const v = ok();
    assert.ok(v.ok);
    if (v.ok) {
      assert.equal(v.value.preferredAt.toISOString(), "2026-11-25T10:30:00.000Z", "16:00 IST = 10:30 UTC");
      assert.equal(v.value.waPhone, WA);
      assert.equal(v.value.email, "asha@example.com", "email is normalised");
      assert.equal(v.value.whatsappConsent, true);
    }
  });
  it("rejects a missing or invalid phone number, with a specific message", () => {
    for (const phone of [undefined, "", "   ", "12345", "abcdefghij", "5555555555", "+91 12345 67890"]) {
      const v = ok({ phone });
      assert.equal(v.ok, false, String(phone));
      if (!v.ok) assert.ok(v.errors.phone, String(phone));
    }
    assert.match((ok({ phone: "" }) as any).errors.phone, /phone number/);
  });
  it("rejects bad names, emails, dates and times", () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ name: "" }, "name"],
      [{ name: "A" }, "name"],
      [{ email: "not-an-email" }, "email"],
      [{ email: "" }, "email"],
      [{ preferredDate: "" }, "preferredAt"],
      [{ preferredTime: "" }, "preferredAt"],
      [{ preferredDate: "2026-02-31" }, "preferredAt"],
      [{ preferredDate: "25/11/2026" }, "preferredAt"],
      [{ preferredTime: "25:00" }, "preferredAt"],
      [{ preferredDate: "2026-11-19", preferredTime: "10:00" }, "preferredAt"], // in the past
      [{ preferredDate: "2027-06-01" }, "preferredAt"], // too far ahead
    ];
    for (const [over, field] of cases) {
      const v = ok(over);
      assert.equal(v.ok, false, JSON.stringify(over));
      if (!v.ok) assert.ok(v.errors[field], `${JSON.stringify(over)} -> ${field}`);
    }
    assert.equal(istToDate("2026-02-31", "10:00"), null);
  });
  it("never trusts a truthy consent value: only literal true counts", () => {
    for (const c of ["true", 1, "yes", undefined, null]) {
      const v = ok({ whatsappConsent: c });
      assert.ok(v.ok && v.value.whatsappConsent === false, String(c));
    }
  });
  it("is robust to junk bodies", () => {
    for (const junk of [null, undefined, "x", 42, [], {}]) assert.equal(validateDemoBooking(junk, NOW).ok, false);
  });
});

describe("a successful booking", () => {
  it("saves name, email, phone and preferred date/time, answers 201 with a confirmation, and triggers demo.requested once", async () => {
    w = await world();
    const r = await w.post(body());
    assert.equal(r.status, 201);
    assert.equal(r.json.status, true);
    assert.match(r.json.message, /demo request has been received/);
    assert.equal(r.json.data.duplicate, false);
    assert.equal(w.bookings.rows.length, 1);
    const row = w.bookings.rows[0];
    assert.deepEqual([row.name, row.email, row.phone, row.waPhone], ["Asha Verma", "asha@example.com", "98765 43210", WA]);
    assert.equal(row.preferredAt.toISOString(), "2026-11-25T10:30:00.000Z");
    assert.equal(row.requestKey, requestKeyFor({ waPhone: WA, email: "asha@example.com", preferredAt: row.preferredAt }));
    await w.settle();
    assert.equal(w.triggers.length, 1);
    assert.equal(w.triggers[0].event, "demo.requested");
    assert.equal(w.triggers[0].eventId, row.id, "the booking id is the event id");
    assert.equal(w.triggers[0].phone, WA);
  });

  it("maps the customer's details into the event fields and the approved template variable", async () => {
    w = await world();
    await w.post(body());
    await w.settle();
    assert.deepEqual(w.triggers[0].fields, { name: "Asha Verma", email: "asha@example.com", demo_date: "25 Nov 2026", demo_time: "4:00 PM" });
    assert.deepEqual(w.texts(), ["Hi Asha Verma, thank you for booking a demo with Avatar. Our team will be in touch shortly to confirm the details."]);
    assert.equal(w.store.execs[0].status, "SENT");
    assert.equal(w.store.execs[0].contactWaId, WA);
    assert.equal(w.sender.templateCalls.length, 1);
    const sent = w.sender.templateCalls[0];
    assert.equal(sent.to, WA);
    assert.deepEqual([sent.tpl.name, sent.tpl.language, sent.tpl.bodyParams], ["demo_requested_thanks", "en", ["Asha Verma"]], "the approved template, with the customer name in {{1}}");
  });

  it("records a genuine website opt-in only because the customer ticked the box, with its evidence", async () => {
    w = await world();
    const r = await w.post(body());
    await w.settle();
    const c = (await w.inboxDb.whatsappContact.findUnique({ where: { waId: WA } }))!;
    assert.equal(c.optInStatus, "GRANTED");
    assert.match(c.optInEvidence, new RegExp(`^website_form: Book a demo form, booking ${r.json.data.id}`));
    assert.equal(c.source, "website_demo");
    assert.equal(c.optStatusByUserId, null, "the customer themself, not a team member");
  });
});

describe("invalid bookings", () => {
  it("a missing phone number is refused with a clear message: nothing saved, no event, no message", async () => {
    w = await world();
    for (const phone of [undefined, "", "123"]) {
      const r = await w.post(body({ phone }));
      assert.equal(r.status, 400, String(phone));
      assert.equal(r.json.status, false);
      assert.ok(r.json.data.errors.phone);
      assert.match(r.json.message, /phone/i);
    }
    await w.settle();
    assert.equal(w.bookings.rows.length, 0);
    assert.equal(w.triggers.length, 0);
    assert.equal(w.sender.templateCalls.length, 0);
  });

  it("invalid email / name / date are refused the same way", async () => {
    w = await world();
    for (const bad of [{ email: "nope" }, { name: "" }, { preferredDate: "2026-11-01" }, { preferredTime: "99:99" }]) {
      assert.equal((await w.post(body(bad))).status, 400, JSON.stringify(bad));
    }
    assert.equal(w.bookings.rows.length, 0);
    assert.equal(w.triggers.length, 0);
  });
});

describe("duplicate prevention", () => {
  it("submitting the same booking twice saves one booking and sends one WhatsApp message", async () => {
    w = await world();
    const first = await w.post(body());
    const second = await w.post(body());
    await w.settle();
    assert.equal(first.status, 201);
    assert.equal(second.status, 200, "a repeat is acknowledged, not an error");
    assert.equal(second.json.data.duplicate, true);
    assert.equal(second.json.data.id, first.json.data.id, "the same booking is reported");
    assert.match(second.json.message, /already have this demo request/);
    assert.equal(w.bookings.rows.length, 1);
    assert.equal(w.store.execs.filter((e) => e.triggerEvent === "demo.requested").length, 1, "one execution per (rule, booking)");
    assert.equal(w.sender.templateCalls.length, 1, "exactly one WhatsApp message");
  });

  it("a double click (two simultaneous requests) still yields one booking and one message", async () => {
    w = await world();
    const [a, b] = await Promise.all([w.post(body()), w.post(body())]);
    await w.settle();
    assert.deepEqual([a.status, b.status].sort(), [200, 201]);
    assert.equal(w.bookings.rows.length, 1);
    assert.equal(w.sender.templateCalls.length, 1);
  });

  it("the same person booking a DIFFERENT time is a new booking with its own confirmation", async () => {
    w = await world();
    await w.post(body());
    const r = await w.post(body({ preferredTime: "17:00" }));
    await w.settle();
    assert.equal(r.status, 201);
    assert.equal(w.bookings.rows.length, 2);
    assert.equal(w.sender.templateCalls.length, 2);
  });
});

describe("consent and the existing safeguards still apply", () => {
  it("without the consent box ticked, no opt-in is recorded and the WhatsApp message is skipped (OPT_IN_REQUIRED) — the booking is unaffected", async () => {
    w = await world();
    const r = await w.post(body({ whatsappConsent: false }));
    await w.settle();
    assert.equal(r.status, 201);
    assert.equal(w.bookings.rows.length, 1);
    assert.equal(await w.inboxDb.whatsappContact.findUnique({ where: { waId: WA } }), null, "no consent was invented");
    assert.equal(w.sender.templateCalls.length, 0);
    assert.equal(w.store.execs[0].status, "SKIPPED");
    assert.equal(w.store.execs[0].skipReason, "OPT_IN_REQUIRED");
  });

  it("a customer who opted out (STOP) stays opted out even if they tick the box: sending is blocked", async () => {
    w = await world();
    await w.inboxDb.whatsappContact.create({ data: { waId: WA, name: "Asha", tags: [], source: "inbound", optInStatus: "WITHDRAWN", optOutAt: new Date() } });
    const r = await w.post(body());
    await w.settle();
    assert.equal(r.status, 201);
    assert.equal((await w.inboxDb.whatsappContact.findUnique({ where: { waId: WA } }))!.optInStatus, "WITHDRAWN");
    assert.equal(w.sender.templateCalls.length, 0);
    assert.equal(w.store.execs[0].skipReason, "CONSENT_WITHDRAWN");
  });

  it("inside the customer's open 24-hour window a reply is allowed without recorded opt-in (existing rule)", async () => {
    w = await world();
    w.inboxDb.inbound(WA, "Hi, tell me about the demo", new Date(Date.now() - 3600_000), { contactName: "Asha" });
    await w.post(body({ whatsappConsent: false }));
    await w.settle();
    assert.equal(w.sender.templateCalls.length, 1);
    assert.equal(w.store.execs[0].status, "SENT");
  });

  it("a template that is not approved is never sent: skipped as TEMPLATE_UNAVAILABLE, booking saved", async () => {
    w = await world({ approved: false });
    const r = await w.post(body());
    await w.settle();
    assert.equal(r.status, 201);
    assert.equal(w.bookings.rows.length, 1);
    assert.equal(w.sender.templateCalls.length, 0);
    assert.equal(w.store.execs[0].skipReason, "TEMPLATE_UNAVAILABLE");
  });

  it("with the master switch OFF (the default) the booking works and nothing is triggered or sent", async () => {
    const prev = process.env.WHATSAPP_AUTOMATION_ENABLED;
    delete process.env.WHATSAPP_AUTOMATION_ENABLED;
    try {
      w = await world();
      const r = await w.post(body());
      await w.settle();
      assert.equal(r.status, 201);
      assert.equal(w.bookings.rows.length, 1);
      assert.equal(w.triggers.length, 0);
      assert.equal(w.sender.templateCalls.length, 0);
    } finally {
      process.env.WHATSAPP_AUTOMATION_ENABLED = prev;
    }
  });
});

describe("a WhatsApp failure never touches the booking", () => {
  it("Meta rejecting the send: the booking is saved, the customer still gets 201, and the failure is recorded for retry/diagnosis", async () => {
    w = await world();
    w.sender.sendTemplate = async () => {
      throw new WhatsappApiError("rejected by Meta", 400, 131047, false);
    };
    const r = await w.post(body());
    await w.settle();
    assert.equal(r.status, 201);
    assert.match(r.json.message, /demo request has been received/);
    assert.equal(w.bookings.rows.length, 1);
    assert.notEqual(w.store.execs[0].status, "SENT");
    assert.ok(["FAILED", "SKIPPED", "QUEUED", "SENDING"].includes(w.store.execs[0].status), w.store.execs[0].status);
    assert.ok(w.store.execs[0].attempts >= 1, "the attempt was recorded");
  });

  it("the automation engine itself crashing is swallowed: booking saved, 201", async () => {
    w = await world({ withEngine: false });
    setAutomationTrigger(async () => {
      throw new Error("engine down");
    });
    const r = await w.post(body());
    assert.equal(r.status, 201);
    assert.equal(w.bookings.rows.length, 1);
  });

  it("a timed-out (ambiguous) send is not retried blindly and never breaks the booking", async () => {
    w = await world();
    w.sender.sendTemplate = async () => {
      throw new WhatsappApiError("timed out", undefined, undefined, true);
    };
    const r = await w.post(body());
    await w.settle();
    assert.equal(r.status, 201);
    assert.ok(w.sender.templateCalls.length <= 1, "an unconfirmed send is not resent automatically");
  });
});

describe("when the booking itself cannot be saved", () => {
  it("answers a plain 500 (no database details), fires no event and sends nothing", async () => {
    w = await world();
    w.bookings.failNextCreate = new Error('relation "demo_bookings" does not exist (secret detail)');
    const r = await w.post(body());
    await w.settle();
    assert.equal(r.status, 500);
    assert.equal(r.json.status, false);
    assert.match(r.json.message, /could not save your request/);
    assert.doesNotMatch(JSON.stringify(r.json), /demo_bookings|secret detail/);
    assert.equal(w.triggers.length, 0);
    assert.equal(w.sender.templateCalls.length, 0);
  });
});

describe("safety", () => {
  it("nothing in this file ever touched the network", () => {
    assert.deepEqual(netCalls, []);
  });
});

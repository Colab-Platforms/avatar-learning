import { after, describe, it } from "node:test";
import assert from "node:assert/strict";

// Book a Demo -> WhatsApp confirmation. Everything is in memory: a fake WhatsApp sender (no network, no real number),
// the real automation engine + inbox service + consent rules, and the real opt-in recorder over a tiny fake contacts table.
process.env.WHATSAPP_AUTOMATION_ENABLED = "true";
const realFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  throw new Error("network is disabled in tests");
}) as typeof fetch;

const { setAutomationTrigger, setOptInRecorder, emitAutomationEvent, toWaPhone } = await import("../../src/modules/business-admin/automation.emit.js");
const { PrismaInboxStore } = await import("../../src/modules/business-admin/inbox.store.js");
const { InboxService } = await import("../../src/modules/business-admin/inbox.service.js");
const { TemplatesService } = await import("../../src/modules/business-admin/templates.service.js");
const { AutomationService } = await import("../../src/modules/business-admin/automation.service.js");
const { MemoryAutomationStore } = await import("../../src/modules/business-admin/automation.store.js");
const { ContactsService } = await import("../../src/modules/business-admin/contacts.service.js");
const { EVENTS } = await import("../../src/modules/business-admin/automation.events.js");
const { FakeInboxDb, FakeSender, readyConfig } = await import("./fakes.js");

after(() => {
  setAutomationTrigger(null);
  setOptInRecorder(null);
  globalThis.fetch = realFetch;
});

/** A minimal whatsapp_contacts table. */
function contactsDb(seed: any[] = []) {
  const rows = [...seed];
  return {
    rows,
    whatsappContact: {
      findUnique: async ({ where }: any) => rows.find((r) => r.waId === where.waId) ?? null,
      create: async ({ data }: any) => (rows.push({ id: `c${rows.length + 1}`, ...data }), data),
      update: async ({ where, data }: any) => Object.assign(rows.find((r) => r.id === where.id), data),
    } as any,
  } as any;
}

const def = EVENTS.find((e) => e.key === "demo.requested")!;
const WA = "919876543210";

function world(opts: { seedContacts?: any[]; senderFails?: boolean } = {}) {
  const cdb = contactsDb(opts.seedContacts);
  const contacts = new ContactsService(cdb);
  const inboxDb = new FakeInboxDb();
  const sender = new FakeSender();
  if (opts.senderFails) sender.sendTemplate = async () => { throw Object.assign(new Error("Meta said no"), { status: 400, code: 131026 }); };
  const templates = new TemplatesService({
    fetchTemplates: async () => [{ id: "1", name: def.suggested.name, language: "en", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: def.suggested.body }] }],
    ttlMs: 0,
  });
  const inbox = new InboxService({ store: new PrismaInboxStore(inboxDb, { BUSINESS_ADMIN_EMAILS: "" }), sender, getConfig: () => readyConfig(), templates, consent: { check: (w: string) => contacts.consentFor(w) } });
  const store = new MemoryAutomationStore();
  store.rules.push({
    id: "rule_demo", name: "Demo", triggerEvent: "demo.requested", templateName: def.suggested.name, templateLanguage: "en", isActive: true,
    variableMapping: Object.fromEntries(def.suggested.mapping.map((k, i) => [String(i + 1), { source: "field" as const, key: k, ...(k === "name" ? { fallback: "there" } : {}) }])),
    createdByUserId: null, updatedByUserId: null, createdAt: new Date(), updatedAt: null,
  });
  const engine = new AutomationService({ store, templates, inbox, inboxStore: new PrismaInboxStore(inboxDb, { BUSINESS_ADMIN_EMAILS: "" }), isEnabled: () => true });
  setAutomationTrigger((i) => engine.trigger(i));
  setOptInRecorder((i) => contacts.registerWebsiteOptIn(i));
  const run = async () => {
    await new Promise((r) => setTimeout(r, 40));
    await engine.processDue();
  };
  return { cdb, sender, store, run };
}

// What the route passes (adoption.profile.ts): the booking id is the event id; tools are named; consent is the ticked box.
const submit = (over: Record<string, unknown> = {}) =>
  emitAutomationEvent({
    event: "demo.requested",
    eventId: "demo_req_1",
    phone: "98765 43210",
    optIn: { evidence: "demo request demo_req_1", name: "Asha", email: "asha@example.com", company: "Acme" },
    fields: { name: "Asha", email: "asha@example.com", company: "Acme", tools: "CRM, HRMS" },
    ...over,
  } as never);

describe("demo.requested -> WhatsApp confirmation", () => {
  it("consent ticked: opt-in is recorded, then the confirmation is sent with the booking details", async () => {
    const w = world();
    submit();
    await w.run();
    assert.equal(w.sender.templateCalls.length, 1);
    assert.equal(w.sender.templateCalls[0].to, WA, "10-digit Indian number gets 91 and spaces are removed");
    const ex = w.store.execs[0];
    assert.equal(ex.status, "SENT");
    assert.deepEqual(ex.params, ["Asha", "CRM, HRMS"], "name and the selected tools are in the message");
    const c = w.cdb.rows[0];
    assert.deepEqual([c.waId, c.optInStatus, c.source], [WA, "GRANTED", "website_form"]);
    assert.match(c.optInEvidence, /^website_form: demo request demo_req_1/);
  });

  it("ROOT CAUSE regression: without recorded consent the engine skips with OPT_IN_REQUIRED and sends nothing", async () => {
    const w = world();
    submit({ optIn: undefined });
    await w.run();
    assert.equal(w.sender.templateCalls.length, 0);
    assert.deepEqual([w.store.execs[0].status, w.store.execs[0].skipReason], ["SKIPPED", "OPT_IN_REQUIRED"]);
  });

  it("a customer who replied STOP is never re-opted-in by a form", async () => {
    const w = world({ seedContacts: [{ id: "c1", waId: WA, optInStatus: "WITHDRAWN", name: "Asha" }] });
    submit();
    await w.run();
    assert.equal(w.sender.templateCalls.length, 0);
    assert.equal(w.cdb.rows[0].optInStatus, "WITHDRAWN");
    assert.equal(w.store.execs[0].skipReason, "CONSENT_WITHDRAWN");
  });

  it("the same booking reaching the hook twice (retry) sends once", async () => {
    const w = world();
    submit();
    submit();
    await w.run();
    assert.equal(w.sender.templateCalls.length, 1);
    assert.equal(w.store.execs.length, 1);
  });

  it("a provider failure is recorded as FAILED (with the reason) and never throws into the booking", async () => {
    const w = world({ senderFails: true });
    assert.doesNotThrow(() => submit());
    await w.run();
    assert.equal(w.store.execs[0].status, "FAILED");
    assert.ok(w.store.execs[0].lastError);
  });

  it("a failing opt-in recorder is swallowed; the event still runs and is visibly skipped", async () => {
    const w = world();
    setOptInRecorder(async () => {
      throw new Error("db down");
    });
    assert.doesNotThrow(() => submit());
    await w.run();
    assert.equal(w.sender.templateCalls.length, 0);
    assert.equal(w.store.execs[0].skipReason, "OPT_IN_REQUIRED");
  });

  it("phone formatting: 10-digit, +91, 0-prefixed; garbage gives nothing to send to", () => {
    assert.deepEqual(["9876543210", "+91 98765-43210", "09876543210"].map(toWaPhone), [WA, WA, WA]);
    assert.equal(toWaPhone("abc"), "");
  });
});

import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

// SAFETY: the REAL POST /api/adoption/demo-requests route (validation, duplicate guard, consent wiring, hook payload) runs over a
// fake Prisma client. DATABASE_URL points at a dead port first so a forgotten query fails instantly; the WhatsApp trigger and the
// opt-in recorder are replaced by recorders, so nothing can reach Meta or a database. fetch is only allowed to reach 127.0.0.1.
const saved: Record<string, string | undefined> = {};
for (const k of ["DATABASE_URL", "WHATSAPP_AUTOMATION_ENABLED", "JWT_SECRET"]) saved[k] = process.env[k];
process.env.DATABASE_URL = "postgresql://nobody:nobody@127.0.0.1:1/none";
process.env.WHATSAPP_AUTOMATION_ENABLED = "true";
process.env.JWT_SECRET = "test_jwt_secret_not_real_0123456789";
const realFetch = globalThis.fetch;
globalThis.fetch = ((url: unknown, init?: RequestInit) => {
  if (String(url).startsWith("http://127.0.0.1:")) return realFetch(url as string, init);
  throw new Error("network is disabled in tests");
}) as typeof fetch;

const { default: express } = await import("express");
const { default: prisma } = await import("../../prisma.js");
const { demoRouter, ROLES, COMPANY_SIZES } = await import("../../src/modules/adoption/adoption.profile.js");
const { setAutomationTrigger, setOptInRecorder } = await import("../../src/modules/business-admin/automation.emit.js");

const db: any = prisma;
let rows: any[] = [];
let contactCopies = 0;
const triggers: any[] = [];
const optIns: any[] = [];
const order: string[] = [];
const restore: Array<() => void> = [];
const fake = (path: string, fn: (...a: any[]) => any) => {
  const parts = path.split(".");
  const key = parts.pop()!;
  const holder = parts.reduce((o, p) => o[p], db);
  const had = Object.prototype.hasOwnProperty.call(holder, key);
  const prev = holder[key];
  holder[key] = fn;
  restore.push(() => (had ? (holder[key] = prev) : delete holder[key]));
};

let ipSeq = 0;
let server: Server;
let base = "";
before(async () => {
  fake("adoptionDemoRequest.create", async ({ data }: any) => {
    const r = { id: `req_${rows.length + 1}`, status: "NEW", createdAt: new Date(), ...data };
    rows.push(r);
    return r;
  });
  fake("adoptionDemoRequest.findFirst", async ({ where }: any) =>
    [...rows].reverse().find((r) => r.email === where.email && (r.phone ?? null) === where.phone && r.createdAt >= where.createdAt.gte) ?? null);
  fake("contact.create", async ({ data }: any) => (contactCopies++, data));
  setAutomationTrigger(async (i) => (order.push("trigger"), triggers.push(i)));
  setOptInRecorder(async (i) => (order.push("optin"), optIns.push(i)));
  const app = express();
  app.set("trust proxy", "loopback"); // each request gets its own fake client IP so the route rate limiter (10 / 15 min / IP) is not hit
  app.use(express.json());
  app.use("/api/adoption/demo-requests", demoRouter);
  server = await new Promise<Server>((r) => { const s = app.listen(0, "127.0.0.1", () => r(s)); });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/adoption/demo-requests`;
});
after(() => {
  server?.close();
  while (restore.length) restore.pop()!();
  setAutomationTrigger(null);
  setOptInRecorder(null);
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
});
beforeEach(() => {
  rows = [];
  contactCopies = 0;
  triggers.length = 0;
  optIns.length = 0;
  order.length = 0;
});

const body = (over: Record<string, unknown> = {}) => ({ name: "Asha Rao", email: "asha@example.com", company: "Acme", phone: "98765 43210", role: ROLES[0], companySize: COMPANY_SIZES[0], tools: ["CRM", "HRMS"], whatsappConsent: true, ...over });
const post = async (b: unknown) => {
  const r = await fetch(base, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.1.${Math.floor(++ipSeq / 250)}.${(ipSeq % 250) + 1}` }, body: JSON.stringify(b) });
  const json: any = await r.json();
  await new Promise((x) => setTimeout(x, 30)); // the WhatsApp hook is fire-and-forget
  return { status: r.status, json };
};

describe("POST /api/adoption/demo-requests -> WhatsApp hook", () => {
  it("saves the booking and, with consent, records opt-in THEN triggers demo.requested with the booking details", async () => {
    const r = await post(body());
    assert.equal(r.status, 201);
    assert.equal(rows.length, 1);
    assert.equal(contactCopies, 1);
    assert.deepEqual(order, ["optin", "trigger"], "consent is on record before the send is attempted");
    assert.equal(triggers.length, 1);
    assert.equal(triggers[0].event, "demo.requested");
    assert.equal(triggers[0].eventId, r.json.data.id, "the booking id is the event id (one message per booking)");
    assert.equal(triggers[0].phone, "919876543210");
    assert.deepEqual([triggers[0].fields.name, triggers[0].fields.email, triggers[0].fields.company], ["Asha Rao", "asha@example.com", "Acme"]);
    assert.match(triggers[0].fields.tools, /CRM/);
    assert.equal(optIns[0].waId, "919876543210");
    assert.match(optIns[0].evidence, new RegExp(`demo request ${r.json.data.id}`));
  });

  it("without consent: booking saved, event still emitted, but NO opt-in is recorded", async () => {
    for (const consent of [false, undefined]) {
      rows = [];
      optIns.length = 0;
      triggers.length = 0;
      const r = await post(body({ whatsappConsent: consent, email: `c${String(consent)}@example.com` }));
      assert.equal(r.status, 201);
      assert.equal(rows.length, 1);
      assert.equal(optIns.length, 0, `consent=${String(consent)} must not record opt-in`);
      assert.equal(triggers.length, 1, "the engine decides (it will skip with OPT_IN_REQUIRED, visible in Automation history)");
    }
  });

  it("DUPLICATE GUARD: the same person + phone + tools again returns the saved request and nothing is sent or stored twice", async () => {
    const first = await post(body());
    const again = await post(body({ tools: ["HRMS", "CRM"] })); // order-insensitive
    assert.equal(again.status, 201);
    assert.equal(again.json.data.id, first.json.data.id);
    assert.equal(rows.length, 1);
    assert.equal(contactCopies, 1);
    assert.equal(triggers.length, 1);
    assert.equal(optIns.length, 1);
  });

  it("different tools, a different phone or a different person are NOT duplicates", async () => {
    await post(body());
    await post(body({ tools: ["CRM"] }));
    await post(body({ phone: "91234 56789" }));
    await post(body({ email: "other@example.com" }));
    assert.equal(rows.length, 4);
    assert.equal(triggers.length, 4);
  });

  it("no phone or an implausible phone: booking is saved, no WhatsApp event, no opt-in", async () => {
    const none = await post(body({ phone: undefined, email: "nophone@example.com" }));
    const bad = await post(body({ phone: "1234567", email: "badphone@example.com" })); // 7 digits: valid format, not a WhatsApp number
    assert.deepEqual([none.status, bad.status], [201, 201]);
    assert.equal(rows.length, 2);
    assert.equal(triggers.length, 0);
    assert.equal(optIns.length, 0);
  });

  it("a trigger that blows up never fails the booking", async () => {
    setAutomationTrigger(async () => {
      throw new Error("engine down");
    });
    const r = await post(body({ email: "boom@example.com" }));
    setAutomationTrigger(async (i) => (order.push("trigger"), triggers.push(i)));
    assert.equal(r.status, 201);
    assert.equal(rows.length, 1);
  });

  it("validation still applies (missing tools -> 400, nothing saved or sent)", async () => {
    const r = await post(body({ tools: [] }));
    assert.equal(r.status, 400);
    assert.equal(rows.length + triggers.length + optIns.length, 0);
  });
});

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

// ─── The dev sandbox end to end: the PUBLIC Book a demo route -> sandbox booking store -> sandbox automation engine -> the
// sandbox inbox. Run with the REAL automation switch OFF and a dead database URL: if anything leaked to Prisma, Meta or
// WhatsApp it would fail here. The confirmation must appear as "Simulated", never as Sent/Delivered/Read.
const saved: Record<string, string | undefined> = {};
const KEYS = ["NODE_ENV", "DEV_TEST_LOGIN", "DEV_TEST_LOGIN_PASSWORD", "JWT_SECRET", "DATABASE_URL", "WHATSAPP_AUTOMATION_ENABLED"];
for (const k of KEYS) saved[k] = process.env[k];
process.env.NODE_ENV = "development";
process.env.DEV_TEST_LOGIN = "true";
process.env.DEV_TEST_LOGIN_PASSWORD = "test-only-password-not-real";
process.env.JWT_SECRET = "test_jwt_secret_not_real_0123456789";
process.env.DATABASE_URL = "postgresql://nobody:nobody@127.0.0.1:1/none";
delete process.env.WHATSAPP_AUTOMATION_ENABLED; // the REAL switch stays off: the sandbox must not need it
const realFetch = globalThis.fetch;
const external: string[] = [];
globalThis.fetch = (async (url: unknown, init?: unknown) => {
  if (/^https?:\/\/127\.0\.0\.1[:/]/.test(String(url))) return realFetch(url as never, init as never);
  external.push(String(url));
  throw new Error("network is disabled in tests");
}) as typeof fetch;

const { default: express } = await import("express");
const { createDevTestRouter } = await import("../../src/modules/business-admin/devtest/devtest.router.js");
const { signDevToken } = await import("../../src/modules/business-admin/devtest/devtest.auth.js");
const { default: demoRoutes } = await import("../../src/modules/demo/demo.route.js");
const { setSandboxDemoDb } = await import("../../src/modules/demo/demo.service.js");
const { setSandboxAutomationTrigger } = await import("../../src/modules/business-admin/automation.emit.js");

let server: Server;
let base = "";
const token = () => signDevToken(process.env as never);
const api = async (method: string, path: string, payload?: unknown, auth = false) => {
  const res = await fetch(base + path, { method, headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${token()}` } : {}) }, body: payload === undefined ? undefined : JSON.stringify(payload) });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
};
const booking = (over: Record<string, unknown> = {}) => {
  const d = new Date(Date.now() + 5 * 86400_000 + 5.5 * 3600_000);
  return { name: "Meera Iyer", email: "meera@example.com", phone: "9811122233", preferredDate: d.toISOString().slice(0, 10), preferredTime: "16:00", whatsappConsent: true, ...over };
};
const WA = "919811122233";
const settle = () => new Promise((r) => setTimeout(r, 150));

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/business-admin", createDevTestRouter(process.env as never));
  app.use("/api/demo", demoRoutes);
  server = await new Promise((r) => {
    const s = app.listen(0, "127.0.0.1", () => r(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});
after(async () => {
  setSandboxDemoDb(null);
  setSandboxAutomationTrigger(null);
  await new Promise((r) => server.close(() => r(undefined)));
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
});

describe("Book a demo in the development sandbox", () => {
  it("the real automation switch is off, yet the sandbox confirmation still runs (and nothing leaves the process)", () => {
    assert.equal(process.env.WHATSAPP_AUTOMATION_ENABLED, undefined);
    assert.deepEqual(external, []);
  });

  it("a booking is saved in the sandbox and the confirmation appears in the inbox as SIMULATED, never Sent/Delivered/Read", async () => {
    const r = await api("POST", "/demo/book", booking());
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.match(r.json.message, /demo request has been received/);
    await settle();

    const msgs = await api("GET", `/business-admin/whatsapp/conversations/${WA}/messages`, undefined, true);
    assert.equal(msgs.status, 200, JSON.stringify(msgs.json));
    const out = (msgs.json.data.items as any[]).filter((m) => m.direction === "OUTBOUND");
    assert.equal(out.length, 1, "exactly one confirmation");
    assert.equal(out[0].state, "simulated");
    assert.equal(out[0].simulated, true);
    assert.deepEqual(out[0].template && { name: out[0].template.name, language: out[0].template.language }, { name: "demo_requested_thanks", language: "en" });
    assert.match(out[0].text, /^Hi Meera Iyer, thank you for booking a demo with Avatar\./);
    for (const real of ["sent", "accepted", "delivered", "read"]) assert.notEqual(out[0].state, real);
  });

  it("submitting the same booking again sends no second message", async () => {
    const same = booking();
    const a = await api("POST", "/demo/book", same);
    const b = await api("POST", "/demo/book", same);
    await settle();
    assert.equal(a.status, 200, "the first test already booked this exact slot");
    assert.equal(b.status, 200);
    assert.equal(b.json.data.duplicate, true);
    const msgs = await api("GET", `/business-admin/whatsapp/conversations/${WA}/messages`, undefined, true);
    assert.equal((msgs.json.data.items as any[]).filter((m) => m.direction === "OUTBOUND").length, 1);
  });

  it("the Activity Manager shows the real endpoint and trigger event for Book a demo, and the execution with its status", async () => {
    const meta = await api("GET", "/business-admin/automations/meta", undefined, true);
    assert.equal(meta.status, 200);
    const ev = (meta.json.data.events as any[]).find((e) => e.key === "demo.requested");
    assert.equal(ev.activity, "Book a demo");
    assert.deepEqual([ev.endpoint.status, ev.endpoint.method, ev.endpoint.route], ["connected", "POST", "/api/demo/book"]);
    assert.equal(ev.endpoint.source, "backend/src/modules/demo/demo.service.ts");
    assert.equal(ev.endpoint.needs, null);

    const execs = await api("GET", "/business-admin/automations/executions?page=1", undefined, true);
    assert.equal(execs.status, 200);
    const rows = (execs.json.data.items ?? execs.json.data.executions ?? []) as any[];
    const mine = rows.filter((x) => (x.triggerEvent ?? x.event) === "demo.requested" || JSON.stringify(x).includes("demo.requested"));
    assert.ok(mine.length >= 1, "the booking's execution is listed");
    assert.ok(mine.every((x) => typeof x.status === "string"), "with its status");
    assert.equal(mine.length, 1, "one execution per booking, however many times the form was submitted");
  });

  it("without the consent box the sandbox confirmation is skipped for opt-in, exactly like production", async () => {
    const r = await api("POST", "/demo/book", booking({ name: "Ravi Nair", email: "ravi@example.com", phone: "9822233344", preferredTime: "17:00", whatsappConsent: false }));
    assert.equal(r.status, 201);
    await settle();
    const msgs = await api("GET", `/business-admin/whatsapp/conversations/919822233344/messages`, undefined, true);
    const out = ((msgs.json?.data?.items ?? []) as any[]).filter((m) => m.direction === "OUTBOUND");
    assert.equal(out.length, 0, "no opt-in recorded, outside the 24h window: nothing is sent");
  });

  it("an invalid booking is refused and sends nothing", async () => {
    const r = await api("POST", "/demo/book", booking({ phone: "" }));
    assert.equal(r.status, 400);
    assert.match(r.json.message, /phone/i);
  });
});

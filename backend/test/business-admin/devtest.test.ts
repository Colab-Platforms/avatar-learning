import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import jwt from "jsonwebtoken";
import { auth } from "../../src/middlewares/authMiddleware.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { createBusinessAdminRouter } from "../../src/modules/business-admin/business-admin.router.js";
import { requireBusinessAdmin } from "../../src/modules/business-admin/business-admin.access.js";
import { PrismaBusinessAdminStore, type BusinessDb } from "../../src/modules/business-admin/business-admin.store.js";
import { PrismaInboxStore } from "../../src/modules/business-admin/inbox.store.js";
import { InboxService } from "../../src/modules/business-admin/inbox.service.js";
import { withDevTestLogin } from "../../src/modules/business-admin/devtest/devtest.router.js";
import { DEV_TEST_EMAIL, DEV_TEST_USER_ID, devTestEnabled, signDevToken } from "../../src/modules/business-admin/devtest/devtest.auth.js";
import { FakeInboxDb, FakeSender, readyConfig } from "./fakes.js";
import { integrations, JWT_SECRET, tokenFor } from "./app.js";

const PASSWORD = "test-only-password-not-real";
const DEV_ENV: Record<string, string | undefined> = { NODE_ENV: "development", DEV_TEST_LOGIN: "true", DEV_TEST_LOGIN_PASSWORD: PASSWORD, JWT_SECRET };

/** Real auth + access + routes over an EMPTY fake db (stands in for the real database), wrapped by the dev dispatcher. */
function realRouter() {
  const db = new FakeInboxDb();
  db.users = [{ id: "superadmin-user-1", firstName: "Sam", lastName: "Super", email: "sam@example.com", roles: ["SUPERADMIN"] }];
  const env = { BUSINESS_ADMIN_EMAILS: "" };
  const inbox = new PrismaInboxStore(db, env);
  const findEmail = async (id: string) => db.users.find((u) => u.id === id)?.email ?? null;
  return createBusinessAdminRouter({
    store: new PrismaBusinessAdminStore(db as unknown as BusinessDb),
    inbox,
    service: new InboxService({ store: inbox, sender: new FakeSender(), getConfig: () => readyConfig() }),
    getIntegrations: () => integrations,
    findEmail,
    accessMiddleware: requireBusinessAdmin({ findEmail, env }),
    sendLimiter: (_req, _res, next) => next(),
  });
}

async function start(env: Record<string, string | undefined>) {
  const real = realRouter();
  const app = express();
  app.use(express.json());
  app.use("/api/business-admin", withDevTestLogin(real, env));
  // Stand-in for Learning Admin: the real auth("ADMIN") middleware, exactly as /api/admin routers use it.
  app.get("/api/admin/ping", auth("ADMIN"), (_req, res) => void res.json({ ok: true }));
  app.use(errorHandler);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const call = async (method: string, path: string, o: { token?: string; body?: unknown; headers?: Record<string, string> } = {}) => {
    const headers: Record<string, string> = { ...(o.headers ?? {}) };
    if (o.token) headers.Authorization = `Bearer ${o.token}`;
    if (o.body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(url + path, { method, headers, body: o.body === undefined ? undefined : JSON.stringify(o.body) });
    return { status: res.status, text: await res.text() };
  };
  return { call, close: () => new Promise<void>((r) => server.close(() => r())) };
}
type Harness = Awaited<ReturnType<typeof start>>;

const login = (a: Harness, body: unknown = { email: DEV_TEST_EMAIL, password: PASSWORD }, headers?: Record<string, string>) =>
  a.call("POST", "/business-admin/dev-login", { body, headers });

describe("dev test login is OFF everywhere except explicit local development", () => {
  const disabled: Array<[string, Record<string, string | undefined>]> = [
    ["production (flag + password set)", { ...DEV_ENV, NODE_ENV: "production" }],
    ["test", { ...DEV_ENV, NODE_ENV: "test" }],
    ["staging", { ...DEV_ENV, NODE_ENV: "staging" }],
    ["NODE_ENV unset", { ...DEV_ENV, NODE_ENV: undefined }],
    ["development but flag unset", { ...DEV_ENV, DEV_TEST_LOGIN: undefined }],
    ["development but flag not exactly 'true'", { ...DEV_ENV, DEV_TEST_LOGIN: "1" }],
    ["development but no password configured", { ...DEV_ENV, DEV_TEST_LOGIN_PASSWORD: undefined }],
    ["development but no JWT secret", { ...DEV_ENV, JWT_SECRET: undefined }],
  ];

  for (const [name, env] of disabled) {
    it(`${name}: not enabled, router is the untouched real router, login issues nothing`, async () => {
      assert.equal(devTestEnabled(env), false);
      const real = realRouter();
      assert.equal(withDevTestLogin(real, env), real, "must return the exact real router object");
      const a = await start(env);
      try {
        const r = await login(a);
        assert.equal(r.status, 401, "real auth answers: no token");
        assert.ok(!r.text.includes("accessToken"));
      } finally {
        await a.close();
      }
    });
  }

  it("a dev token minted while enabled is worthless once the feature is disabled", async () => {
    const token = signDevToken(DEV_ENV);
    const a = await start({ ...DEV_ENV, NODE_ENV: "production" });
    try {
      assert.equal((await a.call("GET", "/business-admin/me", { token })).status, 401);
      assert.equal((await a.call("GET", "/business-admin/overview", { token })).status, 401);
    } finally {
      await a.close();
    }
  });
});

describe("when explicitly enabled in development", () => {
  let a: Harness;
  before(async () => void (a = await start(DEV_ENV)));
  after(() => a.close());

  it("enabled predicate is true only for the full local opt-in", () => assert.equal(devTestEnabled(DEV_ENV), true));

  it("rejects wrong password, wrong email, missing fields and non-string values (401)", async () => {
    for (const body of [
      { email: DEV_TEST_EMAIL, password: "wrong" },
      { email: "someone.real@example.com", password: PASSWORD },
      { email: DEV_TEST_EMAIL },
      {},
      { email: DEV_TEST_EMAIL, password: { $ne: "" } },
    ]) {
      const r = await login(a, body);
      assert.equal(r.status, 401);
      assert.ok(!r.text.includes("accessToken"));
    }
  });

  it("refuses requests that arrived through a proxy (x-forwarded-for) with 404", async () => {
    const r = await login(a, undefined, { "x-forwarded-for": "203.0.113.9" });
    assert.equal(r.status, 404);
    assert.ok(!r.text.includes("accessToken"));
  });

  it("correct credentials return a token that opens ONLY the in-memory Business Admin", async () => {
    const r = await login(a);
    assert.equal(r.status, 200);
    const token = JSON.parse(r.text).data.accessToken as string;

    const me = JSON.parse((await a.call("GET", "/business-admin/me", { token })).text).data;
    assert.deepEqual({ role: me.role, access: me.access, userId: me.userId }, { role: "ADMIN", access: "allowlist", userId: DEV_TEST_USER_ID });

    // Seeded in-memory data (3 fictional contacts), NOT the (empty) "real" store behind the dispatcher.
    const overview = JSON.parse((await a.call("GET", "/business-admin/overview", { token })).text).data;
    assert.equal(overview.whatsapp.contacts, 4);

    // Replies work but go nowhere: the in-memory sender never reaches WhatsApp.
    const send = await a.call("POST", "/business-admin/whatsapp/conversations/15555550101/messages", {
      token,
      body: { text: "Sandbox reply", clientRequestId: "devtest-req-0001" },
    });
    assert.equal(send.status, 201);
  });

  it("repeated fresh logins each give a working 8-hour token (a new login never invalidates an earlier one)", async () => {
    const t1 = JSON.parse((await login(a)).text).data.accessToken as string;
    const t2 = JSON.parse((await login(a)).text).data.accessToken as string;
    for (const token of [t1, t2]) assert.equal((await a.call("GET", "/business-admin/me", { token })).status, 200);
    const claims = jwt.decode(t2) as { iat: number; exp: number };
    assert.equal(claims.exp - claims.iat, 8 * 3600);
  });

  it("the sandbox serves the same extra routes as production: profile, tags, templates, search, contacts, groups status", async () => {
    const token = JSON.parse((await login(a)).text).data.accessToken as string;
    const get = async (path: string) => {
      const r = await a.call("GET", "/business-admin" + path, { token });
      return { status: r.status, body: JSON.parse(r.text) };
    };
    const profile = await get("/whatsapp/conversations/15555550101/profile");
    assert.equal(profile.status, 200);
    assert.equal(profile.body.data.contact, null, "no saved contact yet for this seeded conversation");
    assert.ok(Array.isArray(profile.body.data.evidenceTypes) && profile.body.data.evidenceTypes.length > 0);
    assert.equal((await get("/whatsapp/tags")).status, 200);
    assert.equal((await get("/whatsapp/groups/status")).status, 200);
    const tpl = await get("/whatsapp/templates");
    assert.equal(tpl.status, 200);
    assert.equal(tpl.body.data.items.some((t: any) => t.name === "welcome_sandbox" && t.sendable), true);
    const found = await get("/whatsapp/search?q=weekend");
    assert.equal(found.status, 200);
    assert.ok(JSON.stringify(found.body.data).includes("weekend batch"), "message text search works over the in-memory messages");
    assert.equal((await get("/whatsapp/contacts")).status, 200);
    // A contact can be created in the sandbox and then shows up in its conversation profile.
    const created = await a.call("POST", "/business-admin/whatsapp/contacts", { token, body: { name: "Sandbox Sam", phone: "15555550199" } });
    assert.equal(created.status, 201);
    assert.equal((await get("/whatsapp/contacts?q=Sandbox")).body.data.total, 1);
    assert.equal((await get("/whatsapp/conversations/15555550199/profile")).body.data.contact.name, "Sandbox Sam");
  });

  it("the sandbox analytics endpoint answers 'not connected' and never calls Microsoft Clarity", async () => {
    const token = JSON.parse((await login(a)).text).data.accessToken as string;
    const status = await a.call("GET", "/business-admin/analytics/status", { token });
    assert.equal(status.status, 200);
    const body = JSON.parse(status.text).data;
    assert.equal(body.tokenConfigured, false);
    assert.equal(body.requestsUsedToday, 0);
    const overview = await a.call("GET", "/business-admin/analytics/overview?days=3", { token });
    assert.equal(overview.status, 503);
    assert.equal(JSON.parse(overview.text).data.code, "NOT_CONFIGURED");
  });

  it("the dev token does NOT work on Learning Admin (auth('ADMIN') rejects it with 401)", async () => {
    const token = signDevToken(DEV_ENV);
    assert.equal((await a.call("GET", "/admin/ping", { token })).status, 401);
    // Sanity: a genuine ADMIN token passes the same middleware.
    assert.equal((await a.call("GET", "/admin/ping", { token: tokenFor("ADMIN") })).status, 200);
  });

  it("a token signed with the REAL key but claiming the dev identity gets no Business Admin access", async () => {
    const forged = jwt.sign({ id: DEV_TEST_USER_ID, role: "ADMIN", devTest: true }, JWT_SECRET, { expiresIn: "5m" });
    assert.equal((await a.call("GET", "/business-admin/me", { token: forged })).status, 403, "handled by the real router: ADMIN without an allowlisted email");
  });

  it("dev tokens with the wrong audience, expired, tampered or unsigned are rejected (401)", async () => {
    const key = createHmac("sha256", JWT_SECRET).update("avatar-adaption-devtest-key-v1").digest("hex");
    const claims = { id: DEV_TEST_USER_ID, role: "ADMIN", devTest: true };
    const wrongAud = jwt.sign(claims, key, { audience: "other", issuer: "avatar-adaption-devtest", expiresIn: "5m" });
    const expired = jwt.sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 60 }, key, { audience: "adaption-devtest", issuer: "avatar-adaption-devtest" });
    const tampered = signDevToken(DEV_ENV).slice(0, -3) + "abc";
    const unsigned = jwt.sign(claims, "", { algorithm: "none" as never, audience: "adaption-devtest", issuer: "avatar-adaption-devtest" });
    for (const token of [wrongAud, expired, tampered, unsigned]) {
      assert.equal((await a.call("GET", "/business-admin/me", { token })).status, 401);
    }
  });

  it("real accounts are unaffected: SUPERADMIN passes, ADMIN without allowlist 403, USER 403, no token 401", async () => {
    assert.equal((await a.call("GET", "/business-admin/me", { token: tokenFor("SUPERADMIN") })).status, 200);
    assert.equal((await a.call("GET", "/business-admin/me", { token: tokenFor("ADMIN") })).status, 403);
    assert.equal((await a.call("GET", "/business-admin/me", { token: tokenFor("USER") })).status, 403);
    assert.equal((await a.call("GET", "/business-admin/me")).status, 401);
  });

  it("real SUPERADMIN data comes from the real store, not the dev sandbox", async () => {
    const overview = JSON.parse((await a.call("GET", "/business-admin/overview", { token: tokenFor("SUPERADMIN") })).text).data;
    assert.equal(overview.whatsapp.contacts, 0);
  });
});

describe("sandbox template sending (mock Meta, nothing leaves the process)", () => {
  let a: Harness;
  let token: string;
  let n = 0;
  before(async () => {
    a = await start(DEV_ENV);
    token = JSON.parse((await login(a)).text).data.accessToken as string;
  });
  after(() => a.close());
  const send = async (waId: string, body: Record<string, unknown>) => {
    const r = await a.call("POST", `/business-admin/whatsapp/conversations/${waId}/templates`, { token, body: { clientRequestId: `tplreq-${++n}-abcdef`, ...body } });
    return { status: r.status, body: JSON.parse(r.text) };
  };
  const OK = { name: "welcome_sandbox", language: "en", params: ["Asha"] };

  it("inside the 24h window an approved template sends through the fake Meta and shows in the conversation", async () => {
    const r = await send("15555550101", OK);
    assert.equal(r.status, 201, r.body.message);
    assert.equal(r.body.data.message.state, "simulated", "a sandbox send is simulated, never sent");
    assert.equal(r.body.data.message.simulated, true);
    assert.equal(r.body.data.message.text, "Hello Asha, thanks for your interest in Avatar.");
    assert.deepEqual(r.body.data.message.template, { name: "welcome_sandbox", language: "en" });
    const msgs = JSON.parse((await a.call("GET", "/business-admin/whatsapp/conversations/15555550101/messages", { token })).text).data.items;
    assert.ok(msgs.some((m: any) => m.direction === "OUTBOUND" && m.kind === "template" && m.text === "Hello Asha, thanks for your interest in Avatar."));
  });

  it("the same request id never sends twice", async () => {
    const body = { clientRequestId: "tplreq-fixed-123456", ...OK };
    const one = JSON.parse((await a.call("POST", "/business-admin/whatsapp/conversations/15555550101/templates", { token, body })).text);
    const two = JSON.parse((await a.call("POST", "/business-admin/whatsapp/conversations/15555550101/templates", { token, body })).text);
    assert.equal(one.data.message.id, two.data.message.id);
    assert.equal(two.data.created, false);
  });

  it("window closed + no recorded opt-in: refused with OPT_IN_REQUIRED, nothing saved (consent is never auto-granted)", async () => {
    const r = await send("15555550104", OK);
    assert.equal(r.status, 409);
    assert.equal(r.body.data.code, "OPT_IN_REQUIRED");
    const msgs = JSON.parse((await a.call("GET", "/business-admin/whatsapp/conversations/15555550104/messages", { token })).text).data.items;
    assert.ok(!msgs.some((m: any) => m.direction === "OUTBOUND"));
  });

  it("after the existing Record opt-in flow (with evidence) the same template sends; opting out blocks it again", async () => {
    const created = JSON.parse((await a.call("POST", "/business-admin/whatsapp/contacts", { token, body: { name: "Test Contact Four", phone: "+15555550104" } })).text).data;
    const optIn = await a.call("PUT", `/business-admin/whatsapp/contacts/${created.id}/opt-in`, { token, body: { status: "GRANTED", evidence: "website_form", note: "sandbox test" } });
    assert.equal(optIn.status, 200, optIn.text);
    assert.equal((await send("15555550104", OK)).status, 201);
    await a.call("PUT", `/business-admin/whatsapp/contacts/${created.id}/opt-in`, { token, body: { status: "WITHDRAWN" } });
    const blocked = await send("15555550104", OK);
    assert.equal(blocked.status, 409);
    assert.equal(blocked.body.data.code, "CONSENT_WITHDRAWN");
  });

  it("missing or empty variables, wrong count, unapproved and unknown templates are all refused clearly", async () => {
    for (const [body, re] of [
      [{ ...OK, params: [] }, /needs 1 value/],
      [{ ...OK, params: ["  "] }, /Fill in every template value/],
      [{ name: "pending_sandbox", language: "en", params: ["Asha"] }, /only approved/],
      [{ name: "old_promo", language: "en", params: [] }, /only approved/],
      [{ name: "nope", language: "en", params: [] }, /does not exist|not approved/],
    ] as const) {
      const r = await send("15555550101", body as never);
      assert.equal(r.status, 400, JSON.stringify(body));
      assert.equal(r.body.data.code, "TEMPLATE_INVALID");
      assert.match(r.body.message, re);
    }
  });
});

describe("sandbox activity automation (simulated customer actions, mock Meta)", () => {
  let a: Harness;
  let token: string;
  before(async () => {
    a = await start(DEV_ENV);
    token = JSON.parse((await login(a)).text).data.accessToken as string;
  });
  after(() => a.close());
  const api = async (method: string, path: string, body?: unknown) => {
    const r = await a.call(method, "/business-admin" + path, { token, body });
    return { status: r.status, body: JSON.parse(r.text) };
  };
  const simulate = (event: string, phone: string, extra: Record<string, unknown> = {}) => api("POST", "/automations/simulate", { event, phone, ...extra });
  const outbound = async (waId: string) => (await api("GET", `/whatsapp/conversations/${waId}/messages`)).body.data.items.filter((m: any) => m.direction === "OUTBOUND");
  const execs = async (q = "") => (await api("GET", `/automations/executions?pageSize=100${q}`)).body.data.items as any[];

  const EXPECTED: Record<string, RegExp> = {
    "demo.requested": /^Hi Asha, thank you for booking a demo/,
    "user.registered": /^Hi Asha, welcome to Avatar!/,
    "demo.scheduled": /^Hi Asha, your demo is confirmed for 25 Nov at 4:00 PM/,
    "demo.rescheduled": /^Hi Asha, your demo has been rescheduled to 25 Nov at 4:00 PM/,
    "demo.cancelled": /^Hi Asha, your demo has been cancelled/,
    "contact.submitted": /^Hi Asha, thank you for contacting Avatar/,
    "webinar.registered": /^Hi Asha, your registration for AI for Beginners is confirmed/,
    "payment.succeeded": /^Hi Asha, we have received your payment of Rs 499 for AI Foundations/,
    "course.enrolled": /^Hi Asha, welcome to AI Foundations!/,
  };

  it("the sandbox ships one active rule per activity, each on its approved mock template", async () => {
    const rules = (await api("GET", "/automations/rules")).body.data.items;
    assert.deepEqual(rules.map((r: any) => r.triggerEvent).sort(), Object.keys(EXPECTED).sort());
    assert.ok(rules.every((r: any) => r.isActive));
    const meta = (await api("GET", "/automations/meta")).body.data;
    assert.equal(meta.sandbox, true);
  });

  it("each of the nine activities sends its own message through the mock sender into the Inbox, with a SENT execution", async () => {
    let i = 0;
    for (const [event, re] of Object.entries(EXPECTED)) {
      const phone = `1555555020${i++}`;
      // a customer with a recorded opt-in (nothing is auto-granted): save the contact, then record consent with evidence
      const c = (await api("POST", "/whatsapp/contacts", { name: `Flow ${event}`, phone: `+${phone}` })).body.data;
      assert.equal((await api("PUT", `/whatsapp/contacts/${c.id}/opt-in`, { status: "GRANTED", evidence: "website_form", note: "sandbox" })).status, 200);
      const r = await simulate(event, phone);
      assert.equal(r.status, 200);
      assert.deepEqual(r.body.data, { matched: 1, queued: 1, skipped: 0, duplicates: 0 }, event);
      const msgs = await outbound(phone);
      assert.equal(msgs.length, 1, event);
      assert.match(msgs[0].text, re, event);
      assert.equal(msgs[0].kind, "template");
      const e = (await execs()).find((x) => x.triggerEvent === event && x.contactWaId === phone);
      assert.equal(e.status, "SENT", event);
      assert.deepEqual(e.history.map((h: any) => h.event), ["queued", "sent"]);
    }
  });

  it("repeating the same event id sends nothing more (duplicate prevention)", async () => {
    const ev = { eventId: "order-777" };
    const first = await simulate("payment.succeeded", "15555550101", ev);
    const again = await simulate("payment.succeeded", "15555550101", ev);
    assert.equal(first.body.data.queued, 1);
    assert.deepEqual(again.body.data, { matched: 1, queued: 0, skipped: 0, duplicates: 1 });
    const sent = (await outbound("15555550101")).filter((m: any) => /payment of Rs/.test(m.text));
    assert.equal(sent.length, 1);
  });

  it("missing consent (window closed, no opt-in): skipped with OPT_IN_REQUIRED, no message", async () => {
    await simulate("user.registered", "15555550104", { eventId: "nc-1" });
    const e = (await execs()).find((x) => x.eventId === "nc-1");
    assert.equal(e.status, "SKIPPED");
    assert.equal(e.skipReason, "OPT_IN_REQUIRED");
    assert.equal((await outbound("15555550104")).length, 0);
  });

  it("opted-out contact: skipped with CONSENT_WITHDRAWN even inside the 24h window", async () => {
    const c = (await api("POST", "/whatsapp/contacts", { name: "Stop", phone: "+15555550102" })).body.data;
    await api("PUT", `/whatsapp/contacts/${c.id}/opt-in`, { status: "WITHDRAWN" });
    await simulate("course.enrolled", "15555550102", { eventId: "stop-1" });
    const e = (await execs()).find((x) => x.eventId === "stop-1");
    assert.equal(e.skipReason, "CONSENT_WITHDRAWN");
    assert.equal((await outbound("15555550102")).filter((m: any) => /welcome to/.test(m.text)).length, 0);
  });

  it("disabled rule: the event is ignored and nothing is sent or recorded", async () => {
    assert.equal((await api("PUT", "/automations/rules/rule_demo_cancelled/active", { active: false })).status, 200);
    const r = await simulate("demo.cancelled", "15555550101", { eventId: "off-1" });
    assert.deepEqual(r.body.data, { matched: 0, queued: 0, skipped: 0, duplicates: 0 });
    assert.ok(!(await execs()).some((x) => x.eventId === "off-1"));
    assert.ok(!(await outbound("15555550101")).some((m: any) => /demo has been cancelled/.test(m.text)));
  });

  it("missing variable (no value and no fallback): skipped with MISSING_VARIABLE, nothing sent", async () => {
    const rule = (await api("GET", "/automations/rules")).body.data.items.find((r: any) => r.id === "rule_contact_submitted");
    const put = await api("PUT", "/automations/rules/rule_contact_submitted", { ...rule, variableMapping: { "1": { source: "field", key: "name" } } });
    assert.equal(put.status, 200);
    await simulate("contact.submitted", "15555550101", { eventId: "mv-1", fields: { name: "" } });
    const e = (await execs()).find((x) => x.eventId === "mv-1");
    assert.equal(e.skipReason, "MISSING_VARIABLE");
  });

  it("an unknown event or a bad phone is refused", async () => {
    assert.equal((await simulate("nope.event", "15555550101")).status, 400);
    assert.equal((await simulate("user.registered", "12")).status, 400);
  });
});

import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { evaluateBusinessAccess } from "../../src/modules/business-admin/business-admin.access.js";
import { PrismaBusinessAdminStore } from "../../src/modules/business-admin/business-admin.store.js";
import { call, startInboxApp, tokenFor, type InboxApp } from "./app.js";
import { FakeInboxDb, PHONE } from "./fakes.js";

const MESSAGE_TEXT = "Private message text 5521";
let app: InboxApp;
before(async () => {
  app = await startInboxApp();
});
after(() => app.close());
beforeEach(() => {
  app.db.messages = [];
  app.db.conversations = [];
  app.db.events = [];
  app.db.failOn = null;
  app.emailLookups.length = 0;
  app.env.BUSINESS_ADMIN_EMAILS = "ops@example.com";
  app.db.inbound(PHONE, "hello", new Date());
});

/** Every Business Admin endpoint, reads and writes. */
const ENDPOINTS: Array<[string, string, unknown?]> = [
  ["GET", "/me"],
  ["GET", "/overview"],
  ["GET", "/whatsapp/team"],
  ["GET", "/whatsapp/conversations"],
  ["GET", `/whatsapp/conversations/${PHONE}`],
  ["GET", `/whatsapp/conversations/${PHONE}/messages`],
  ["GET", `/whatsapp/conversations/${PHONE}/events`],
  ["POST", `/whatsapp/conversations/${PHONE}/messages`, { text: "hi", clientRequestId: "req-12345678" }],
  ["POST", "/whatsapp/messages/cabcdefghij1234567890/retry", {}],
  ["POST", `/whatsapp/conversations/${PHONE}/read`, {}],
  ["POST", `/whatsapp/conversations/${PHONE}/notes`, { body: "note" }],
  ["PUT", `/whatsapp/conversations/${PHONE}/assignment`, { assigneeId: null }],
];

describe("evaluateBusinessAccess (pure rule)", () => {
  it("SUPERADMIN always; ADMIN only when listed (case-insensitive); USER and unknown never", () => {
    const env = { BUSINESS_ADMIN_EMAILS: " Ops@Example.com , other@example.com " };
    assert.equal(evaluateBusinessAccess("SUPERADMIN", null, {}), "superadmin");
    assert.equal(evaluateBusinessAccess("ADMIN", "ops@example.com", env), "allowlist");
    assert.equal(evaluateBusinessAccess("ADMIN", "OTHER@EXAMPLE.COM", env), "allowlist");
    assert.equal(evaluateBusinessAccess("ADMIN", "nobody@example.com", env), null);
    assert.equal(evaluateBusinessAccess("ADMIN", "ops@example.com", {}), null);
    assert.equal(evaluateBusinessAccess("ADMIN", null, env), null);
    assert.equal(evaluateBusinessAccess("USER", "ops@example.com", env), null);
    assert.equal(evaluateBusinessAccess(undefined, "ops@example.com", env), null);
  });
});

describe("authentication and permissions: every endpoint, reads and writes", () => {
  for (const [method, path, body] of ENDPOINTS) {
    const label = `${method} ${path.replace(PHONE, ":waId")}`;

    it(`${label}: 401 without a token, with a malformed token and with a token signed by another secret`, async () => {
      assert.equal((await call(app, method, path, { body })).status, 401);
      assert.equal((await call(app, method, path, { token: "not.a.jwt", body })).status, 401);
      assert.equal((await call(app, method, path, { token: jwt.sign({ id: "x", role: "SUPERADMIN" }, "another_secret"), body })).status, 401);
    });

    it(`${label}: 403 for a USER token`, async () => {
      assert.equal((await call(app, method, path, { token: tokenFor("USER"), body })).status, 403);
    });

    it(`${label}: 403 for a Learning Admin who is not on the business allowlist`, async () => {
      app.env.BUSINESS_ADMIN_EMAILS = "someone-else@example.com";
      const r = await call(app, method, path, { token: tokenFor("ADMIN", "admin-user-1"), body });
      assert.equal(r.status, 403);
      assert.equal(r.json.status, false);
    });

    it(`${label}: allowed for SUPERADMIN and for an allowlisted admin (account checked in the database each time)`, async () => {
      const s = await call(app, method, path, { token: tokenFor("SUPERADMIN"), body });
      assert.notEqual(s.status, 401);
      assert.notEqual(s.status, 403);
      assert.ok(app.emailLookups.length >= 1, "account state is looked up on every request");
      const a = await call(app, method, path, { token: tokenFor("ADMIN", "admin-user-1"), body });
      assert.notEqual(a.status, 401);
      assert.notEqual(a.status, 403);
    });
  }

  it("a forbidden write changes nothing (no message row, no assignment, no note, no sender call)", async () => {
    const before = JSON.stringify([app.db.messages.length, app.db.conversations, app.db.events]);
    app.sender.calls.length = 0;
    for (const [method, path, body] of ENDPOINTS.filter(([m]) => m !== "GET")) {
      await call(app, method, path, { token: tokenFor("USER"), body });
      await call(app, method, path, { body });
    }
    assert.equal(JSON.stringify([app.db.messages.length, app.db.conversations, app.db.events]), before);
    assert.equal(app.sender.calls.length, 0);
  });

  it("a Learning Admin with no allowlist and no permission row is denied", async () => {
    app.env.BUSINESS_ADMIN_EMAILS = undefined;
    const r = await call(app, "GET", "/me", { token: tokenFor("ADMIN", "admin-user-1") });
    assert.equal(r.status, 403);
  });

  it("an allowlisted admin is allowed (case-insensitive) and /me reports how", async () => {
    app.env.BUSINESS_ADMIN_EMAILS = "OPS@Example.com";
    const r = await call(app, "GET", "/me", { token: tokenFor("ADMIN", "admin-user-1") });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data, { role: "ADMIN", access: "allowlist", userId: "admin-user-1", modules: ["dashboard", "inbox", "leads", "customers", "agents", "automations", "integrations", "analytics", "team", "settings"], isSuperAdmin: false });
  });

  it("the 403 body does not reveal the allowlist", async () => {
    app.env.BUSINESS_ADMIN_EMAILS = "secret-ops@example.com";
    const r = await call(app, "GET", "/me", { token: tokenFor("ADMIN", "admin-user-1") });
    assert.ok(!JSON.stringify(r.json).includes("secret-ops@example.com"));
  });

  it("an email lookup failure is a generic 500 that leaks nothing (access is not granted)", async () => {
    app.db.users = [...app.db.users];
    const r = await call(app, "GET", "/me", { token: tokenFor("ADMIN", "unknown-id-for-lookup-failure") });
    assert.equal(r.status, 403, "unknown user has no email so access is denied");
  });

  it("/me for SUPERADMIN", async () => {
    const r = await call(app, "GET", "/me", { token: tokenFor("SUPERADMIN") });
    assert.equal(r.json.data.access, "superadmin");
    assert.equal(r.json.data.isSuperAdmin, true);
    assert.ok(r.json.data.modules.includes("admins") && r.json.data.modules.includes("inbox"));
  });
});

describe("overview and validation", () => {
  it("overview returns WhatsApp counts and booleans-only integration status", async () => {
    app.db.inbound(PHONE, "second", new Date());
    const r = await call(app, "GET", "/overview", { token: tokenFor("SUPERADMIN") });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.whatsapp.totalInbound, 2);
    assert.equal(r.json.data.whatsapp.contacts, 1);
    assert.equal(r.json.data.integrations.whatsapp.outboundSending, "ready");
    assert.equal(r.json.data.integrations.email.configured, false);
  });

  it("conversations: shape, defaults and query validation", async () => {
    const t = tokenFor("SUPERADMIN");
    const ok = await call(app, "GET", "/whatsapp/conversations", { token: t });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data.page, 1);
    assert.equal(ok.json.data.pageSize, 25);
    assert.equal(ok.json.data.items[0].contactWaId, PHONE);
    for (const q of ["?page=0", "?page=abc", "?pageSize=51", "?pageSize=0", "?page=1.5", "?page=-1", "?filter=everything", "?assignee=bad%20id"]) {
      assert.equal((await call(app, "GET", `/whatsapp/conversations${q}`, { token: t })).status, 400, q);
    }
  });

  it("messages: validates the contact id, limit and cursor", async () => {
    const t = tokenFor("SUPERADMIN");
    assert.equal((await call(app, "GET", `/whatsapp/conversations/${PHONE}/messages?limit=5`, { token: t })).status, 200);
    for (const id of ["abc", "12", "1".repeat(21), "91987654321%27", "91987654321x"]) {
      assert.equal((await call(app, "GET", `/whatsapp/conversations/${id}/messages`, { token: t })).status, 400, id);
    }
    for (const q of ["?limit=101", "?limit=0", "?before=garbage", "?before=123_abc"]) {
      assert.equal((await call(app, "GET", `/whatsapp/conversations/${PHONE}/messages${q}`, { token: t })).status, 400, q);
    }
  });

  it("unknown conversations answer 404 (contact, read, notes, assignment)", async () => {
    const t = tokenFor("SUPERADMIN");
    const other = "447700900123";
    assert.equal((await call(app, "GET", `/whatsapp/conversations/${other}`, { token: t })).status, 404);
    assert.equal((await call(app, "POST", `/whatsapp/conversations/${other}/read`, { token: t, body: {} })).status, 404);
    assert.equal((await call(app, "POST", `/whatsapp/conversations/${other}/notes`, { token: t, body: { body: "x" } })).status, 404);
    assert.equal((await call(app, "PUT", `/whatsapp/conversations/${other}/assignment`, { token: t, body: { assigneeId: null } })).status, 404);
  });

  it("database failure: generic 500, no personal data or raw error in the response or logs", async () => {
    app.db.inbound(PHONE, MESSAGE_TEXT, new Date());
    app.db.failOn = { table: "msg", op: "count", error: Object.assign(new Error(`db down for ${PHONE} ${MESSAGE_TEXT}`), { code: "P1001" }) };
    const logs: string[] = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = console.warn = console.error = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
    let r;
    try {
      r = await call(app, "GET", "/overview", { token: tokenFor("SUPERADMIN") });
    } finally {
      Object.assign(console, orig);
    }
    assert.equal(r.status, 500);
    assert.equal(r.json.message, "Something went wrong. Please try again.");
    const all = JSON.stringify(r.json) + logs.join("\n");
    assert.ok(!all.includes(PHONE) && !all.includes(MESSAGE_TEXT) && !all.includes("db down"));
    assert.ok(logs.some((l) => l.includes("P1001")), "error type/code is logged");
  });
});

describe("PrismaBusinessAdminStore.overview", () => {
  it("counts inbound/outbound, windows, contacts and last inbound time", async () => {
    const db = new FakeInboxDb();
    const now = new Date("2026-11-19T12:00:00Z");
    db.inbound(PHONE, "a", new Date("2026-11-19T11:00:00Z"));
    db.inbound(PHONE, "b", new Date("2026-11-15T11:00:00Z"));
    db.inbound("447700900123", "c", new Date("2026-10-01T11:00:00Z"));
    db.inbound(PHONE, "out", new Date("2026-11-19T11:30:00Z"), { direction: "OUTBOUND", status: "SENT" });
    const o = await new PrismaBusinessAdminStore(db as never).overview(now);
    assert.deepEqual(o, { totalInbound: 3, totalOutbound: 1, inboundLast24h: 1, inboundLast7d: 2, lastInboundAt: "2026-11-19T11:00:00.000Z", contacts: 2 });
  });
});

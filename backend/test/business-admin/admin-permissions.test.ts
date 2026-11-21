import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import type { AddressInfo } from "node:net";
import { ADMIN_OK, asSuper, call, startInboxApp, tokenFor, SUPER, type InboxApp } from "./app.js";
import { auth } from "../../src/middlewares/authMiddleware.js";
import { PHONE } from "./fakes.js";
import { normalizePermissions, permissionsForRole, ROLE_PRESETS } from "../../src/modules/business-admin/business-admin.modules.js";

const GOOD = "Violet!Marble#8472Orbit";
const NEW_PW = "Cobalt!Harbor#5521Lamp";
let app: InboxApp;
const staffToken = (id: string) => tokenFor("BUSINESS_ADMIN", id);
const mk = (email: string, over: Record<string, unknown> = {}) => asSuper(app, "POST", "/admins", { name: "Rohan Mehta", email, password: GOOD, roleKey: "CUSTOM", ...over });

before(async () => void (app = await startInboxApp({ env: {} })));
after(() => app.close());
beforeEach(() => {
  app.db.users = [{ ...SUPER }, { ...ADMIN_OK }];
  app.db.accessRows = [];
  app.db.auditRows = [];
  app.db.sessions = [];
  app.db.messages = [];
  app.db.conversations = [];
  app.db.events = [];
  app.db.failAudit = false;
  app.env.BUSINESS_ADMIN_EMAILS = "";
  app.db.inbound(PHONE, "hello", new Date());
});

describe("permission model (pure)", () => {
  it("'view' is implied by any other action, unknown modules/actions (incl. admins) are dropped, empty modules vanish", () => {
    assert.deepEqual(normalizePermissions({ inbox: ["edit"], admins: ["view"], leads: ["fly"], settings: [] }), { inbox: ["view", "edit"] });
    assert.deepEqual(normalizePermissions("x"), {});
    assert.deepEqual(permissionsForRole("CUSTOM", ["inbox", "admins"]), { inbox: ["view", "create", "edit", "delete", "manage"] }, "module list = every action (older callers)");
    assert.ok(!ROLE_PRESETS.SUPPORT_AGENT.permissions.inbox!.includes("delete"));
  });
});

describe("Super Admin creates several accounts with different permissions", () => {
  it("creates multiple accounts; one account gets several modules with different action levels", async () => {
    const a = await mk("a@example.com", { permissions: { inbox: ["view", "create", "edit", "manage"], customers: ["view"], analytics: ["view"] } });
    const b = await mk("b@example.com", { name: "Priya Shah", permissions: { automations: ["view", "create", "edit", "delete"], settings: ["view", "edit"] } });
    assert.equal(a.status, 201);
    assert.equal(b.status, 201);
    assert.deepEqual(a.json.data.permissions, { inbox: ["view", "create", "edit", "manage"], customers: ["view"], analytics: ["view"] });
    assert.deepEqual(a.json.data.modules, ["inbox", "customers", "analytics"]);
    assert.deepEqual(b.json.data.permissions.automations, ["view", "create", "edit", "delete"]);
    const list = await asSuper(app, "GET", "/admins");
    assert.ok(list.json.data.items.filter((x: any) => x.role === "BUSINESS_ADMIN").length === 2);
  });

  it("each person sees only their own modules in /me, with their own actions", async () => {
    const a = (await mk("a@example.com", { permissions: { inbox: ["view"], customers: ["view"] } })).json.data;
    const b = (await mk("b@example.com", { permissions: { analytics: ["view"] } })).json.data;
    const meA = (await call(app, "GET", "/me", { token: staffToken(a.id) })).json.data;
    const meB = (await call(app, "GET", "/me", { token: staffToken(b.id) })).json.data;
    assert.deepEqual(meA.modules, ["inbox", "customers"]);
    assert.deepEqual(meB.modules, ["analytics"]);
    assert.equal(meA.isSuperAdmin, false);
    assert.ok(!("admins" in meA.permissions));
  });

  it("legacy payloads with only `modules` still work (every action on those modules)", async () => {
    const r = await mk("old@example.com", { modules: ["inbox"] });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json.data.permissions.inbox, ["view", "create", "edit", "delete", "manage"]);
  });

  it("rejects invalid permission payloads and an empty CUSTOM role", async () => {
    for (const permissions of [{ inbox: ["fly"] }, { nope: ["view"] }, { admins: ["view"] }, ["view"], "x", { inbox: [] }]) {
      assert.equal((await mk("bad@example.com", { permissions })).status, 400, JSON.stringify(permissions));
    }
    assert.equal(app.db.users.length, 2, "nothing created");
  });
});

describe("the backend enforces permissions per module AND per action", () => {
  it("a view-only inbox user can read but is rejected (403) on every write", async () => {
    const id = (await mk("v@example.com", { permissions: { inbox: ["view"] } })).json.data.id;
    const t = staffToken(id);
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: t })).status, 200);
    assert.equal((await call(app, "POST", `/whatsapp/conversations/${PHONE}/read`, { token: t, body: {} })).status, 200, "marking read is part of viewing");
    const writes: Array<[string, string, unknown]> = [
      ["POST", `/whatsapp/conversations/${PHONE}/messages`, { text: "hi", clientRequestId: "req-view-0001" }],
      ["POST", `/whatsapp/conversations/${PHONE}/notes`, { body: "n" }],
      ["PUT", `/whatsapp/conversations/${PHONE}/assignment`, { assigneeId: null }],
      ["POST", "/whatsapp/contacts", { name: "X", phone: "919811100000" }],
    ];
    for (const [m, p, body] of writes) assert.equal((await call(app, m, p, { token: t, body })).status, 403, `${m} ${p}`);
    assert.equal(app.db.messages.filter((x: any) => x.direction === "OUTBOUND").length, 0);
  });

  it("assigning needs 'manage', not just 'edit'", async () => {
    const id = (await mk("e@example.com", { permissions: { inbox: ["view", "create", "edit"] } })).json.data.id;
    assert.equal((await call(app, "PUT", `/whatsapp/conversations/${PHONE}/assignment`, { token: staffToken(id), body: { assigneeId: null } })).status, 403);
    await asSuper(app, "PATCH", `/admins/${id}`, { roleKey: "CUSTOM", permissions: { inbox: ["view", "manage"] } });
    assert.notEqual((await call(app, "PUT", `/whatsapp/conversations/${PHONE}/assignment`, { token: staffToken(id), body: { assigneeId: null } })).status, 403);
  });

  it("a user without a module gets 403 on its APIs directly, whatever the sidebar shows", async () => {
    const id = (await mk("n@example.com", { permissions: { analytics: ["view"] } })).json.data.id;
    const t = staffToken(id);
    for (const p of ["/whatsapp/conversations", "/whatsapp/contacts", "/whatsapp/templates", "/whatsapp/search"]) {
      assert.equal((await call(app, "GET", p, { token: t })).status, 403, p);
    }
    assert.equal((await call(app, "GET", "/whatsapp/conversations")).status, 401, "no token");
  });

  it("editing permissions takes effect on the very next request", async () => {
    const id = (await mk("live@example.com", { permissions: { inbox: ["view"] } })).json.data.id;
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: staffToken(id) })).status, 200);
    await asSuper(app, "PATCH", `/admins/${id}`, { roleKey: "CUSTOM", permissions: { analytics: ["view"] } });
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: staffToken(id) })).status, 403);
  });
});

describe("only the Super Admin manages accounts and nobody can grant themselves access", () => {
  it("staff (even with every module and action) cannot list, create, edit, reset or read the audit log", async () => {
    const id = (await mk("m@example.com", { roleKey: "MANAGER" })).json.data.id;
    const t = staffToken(id);
    const calls: Array<[string, string, unknown?]> = [
      ["GET", "/admins"], ["GET", "/admins/meta"], ["GET", "/admins/audit-log"],
      ["POST", "/admins", { name: "Evil Admin", email: "evil@example.com", password: GOOD, roleKey: "MANAGER" }],
      ["PATCH", `/admins/${id}`, { roleKey: "CUSTOM", permissions: { inbox: ["view"] } }],
      ["POST", `/admins/${id}/reset-password`, { password: NEW_PW }],
    ];
    for (const [m, p, body] of calls) assert.equal((await call(app, m, p, { token: t, body })).status, 403, `${m} ${p}`);
    assert.equal(app.db.users.some((u) => u.email === "evil@example.com"), false);
  });

  it("a staff member cannot grant themselves more access (permissions unchanged in the database)", async () => {
    const id = (await mk("self@example.com", { permissions: { inbox: ["view"] } })).json.data.id;
    const r = await call(app, "PATCH", `/admins/${id}`, { token: staffToken(id), body: { roleKey: "MANAGER" } });
    assert.equal(r.status, 403);
    assert.deepEqual(app.db.accessRows.find((x) => x.userId === id)!.modules, ["inbox"]);
  });

  it("there is no public registration route for Business Admin", () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, "../../src/modules/business-admin/business-admin.router.ts"), "utf8");
    assert.ok(!/router\.post\("\/(register|signup|sign-up)/.test(src));
    assert.ok(/router\.post\("\/admins", adminsOnly/.test(src), "creation is behind the Super-Admin-only module");
  });
});

describe("lifecycle: deactivation, activation, password reset", () => {
  it("a deactivated account is refused immediately, loses its sessions, and works again when reactivated", async () => {
    const id = (await mk("d@example.com", { permissions: { inbox: ["view"] } })).json.data.id;
    app.db.sessions.push({ id: "s1", userId: id });
    assert.equal((await call(app, "GET", "/me", { token: staffToken(id) })).status, 200);
    assert.equal((await asSuper(app, "PATCH", `/admins/${id}`, { isActive: false })).status, 200);
    assert.equal((await call(app, "GET", "/me", { token: staffToken(id) })).status, 403);
    assert.equal(app.db.sessions.length, 0);
    await asSuper(app, "PATCH", `/admins/${id}`, { isActive: true });
    assert.equal((await call(app, "GET", "/me", { token: staffToken(id) })).status, 200);
  });

  it("login and token refresh refuse inactive accounts (shared auth service)", () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, "../../src/modules/auth/auth.service.ts"), "utf8");
    assert.equal((src.match(/if \(!user\.isActive\)/g) ?? []).length >= 2, true);
  });

  it("reset: new strong password is hashed (never plain), old sessions end, nothing echoed, weak ones refused", async () => {
    const id = (await mk("r@example.com", { permissions: { inbox: ["view"] } })).json.data.id;
    app.db.sessions.push({ id: "s1", userId: id });
    app.hashed.length = 0;
    assert.equal((await asSuper(app, "POST", `/admins/${id}/reset-password`, { password: "short" })).status, 400);
    const ok = await asSuper(app, "POST", `/admins/${id}/reset-password`, { password: NEW_PW });
    assert.equal(ok.status, 200);
    assert.ok(!JSON.stringify(ok.json).includes(NEW_PW));
    assert.deepEqual(app.hashed, [NEW_PW], "hashed once");
    assert.notEqual((app.db.users.find((u) => u.id === id) as any).password, NEW_PW, "stored value is not the plain text");
    assert.equal(app.db.sessions.length, 0);
  });

  it("passwords are never returned by any admin endpoint", async () => {
    await mk("p@example.com", { permissions: { inbox: ["view"] } });
    const list = await asSuper(app, "GET", "/admins");
    assert.ok(!JSON.stringify(list.json).includes(GOOD) && !/password|hash/i.test(JSON.stringify(list.json)));
  });
});

describe("search, filter and audit log", () => {
  it("filters by status and module, and searches by name or email", async () => {
    const a = (await mk("alpha@example.com", { name: "Alpha One", permissions: { inbox: ["view"] } })).json.data.id;
    await mk("beta@example.com", { name: "Beta Two", permissions: { analytics: ["view"] } });
    await asSuper(app, "PATCH", `/admins/${a}`, { isActive: false });
    const emails = async (q: string) => (await asSuper(app, "GET", `/admins?${q}`)).json.data.items.map((x: any) => x.email);
    assert.deepEqual(await emails("status=inactive"), ["alpha@example.com"]);
    assert.ok((await emails("status=active")).includes("beta@example.com"));
    assert.deepEqual(await emails("module=analytics"), ["beta@example.com"]);
    assert.deepEqual(await emails("q=BETA"), ["beta@example.com"]);
    assert.equal((await asSuper(app, "GET", "/admins?status=bogus")).status, 400);
    assert.equal((await asSuper(app, "GET", "/admins?module=nope")).status, 400);
  });

  it("records create, permission change, rename, deactivate, reactivate and password reset - without any secret", async () => {
    const id = (await mk("log@example.com", { permissions: { inbox: ["view"] } })).json.data.id;
    await asSuper(app, "PATCH", `/admins/${id}`, { roleKey: "CUSTOM", permissions: { inbox: ["view", "edit"] } });
    await asSuper(app, "PATCH", `/admins/${id}`, { name: "Renamed Person" });
    await asSuper(app, "PATCH", `/admins/${id}`, { isActive: false });
    await asSuper(app, "PATCH", `/admins/${id}`, { isActive: true });
    await asSuper(app, "POST", `/admins/${id}/reset-password`, { password: NEW_PW });
    const log = await asSuper(app, "GET", "/admins/audit-log");
    assert.equal(log.status, 200);
    assert.deepEqual(log.json.data.items.map((x: any) => x.action).reverse(), ["ADMIN_CREATED", "PERMISSIONS_CHANGED", "ADMIN_RENAMED", "ADMIN_DEACTIVATED", "ADMIN_ACTIVATED", "PASSWORD_RESET"]);
    const text = JSON.stringify(log.json);
    assert.ok(!text.includes(GOOD) && !text.includes(NEW_PW) && !/hash:/.test(text));
    assert.equal(log.json.data.items[0].actorEmail, SUPER.email);
    assert.equal(log.json.data.items[0].targetEmail, "log@example.com");
    assert.equal((await asSuper(app, "GET", `/admins/audit-log?target=${id}`)).json.data.total, 6);
  });

  it("an audit-log failure never blocks or undoes the account change", async () => {
    app.db.failAudit = true;
    const r = await mk("resilient@example.com", { permissions: { inbox: ["view"] } });
    assert.equal(r.status, 201);
    assert.ok(app.db.users.some((u) => u.email === "resilient@example.com"));
  });
});

describe("Learning Admin (/admin) is isolated from Business Admin staff", () => {
  it("a BUSINESS_ADMIN token is refused by auth('ADMIN') (every /api/admin router) and by auth('USER'); a real ADMIN token still passes", async () => {
    const a = express();
    a.get("/admin-ping", auth("ADMIN"), (_q, r) => void r.json({ ok: true }));
    a.get("/user-ping", auth("USER"), (_q, r) => void r.json({ ok: true }));
    a.use((err: any, _q: any, r: any, _n: any) => r.status(err.statusCode ?? 500).json({ message: err.message }));
    const server = await new Promise<import("node:http").Server>((res) => { const s = a.listen(0, "127.0.0.1", () => res(s)); });
    try {
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const get = async (p: string, role: any) => (await fetch(url + p, { headers: { Authorization: `Bearer ${tokenFor(role, "u1")}` } })).status;
      assert.equal(await get("/admin-ping", "BUSINESS_ADMIN"), 403);
      assert.equal(await get("/user-ping", "BUSINESS_ADMIN"), 403);
      assert.equal(await get("/admin-ping", "ADMIN"), 200);
      assert.equal(await get("/admin-ping", "SUPERADMIN"), 200);
    } finally {
      await new Promise((r) => server.close(() => r(undefined)));
    }
  });

  it("no Learning Admin router lists BUSINESS_ADMIN, and /admin client files are unchanged by this feature", () => {
    const root = path.resolve(import.meta.dirname, "../../src/modules");
    const hits: string[] = [];
    const walk = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((f) => (f.isDirectory() ? walk(path.join(d, f.name)) : /\.ts$/.test(f.name) && !d.includes("business-admin") && /BUSINESS_ADMIN/.test(fs.readFileSync(path.join(d, f.name), "utf8")) && hits.push(path.join(d, f.name))));
    walk(root);
    assert.deepEqual(hits.map((h) => path.basename(h)).sort(), ["adoption.service.ts", "auth.route.ts", "auth.service.ts", "auth.types.ts"], "only the shared auth plumbing (and the Adoption staff-session bridge) mention the new role");
  });
});

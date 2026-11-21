import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { ADMIN_OK, asSuper, call, startInboxApp, SUPER, tokenFor, type InboxApp } from "./app.js";
import { AdminsService, ADMIN_BCRYPT_COST, passwordProblem, type AdminsDb } from "../../src/modules/business-admin/admins.service.js";
import { MODULE_KEYS, ROLE_PRESETS, modulesForRole, normalizeModules } from "../../src/modules/business-admin/business-admin.modules.js";
import { PHONE } from "./fakes.js";

const GOOD = "Violet!Marble#8472Orbit";
let app: InboxApp;

const newAdmin = (over: Record<string, unknown> = {}) => ({ name: "Rohan Mehta", email: "Rohan@Example.com", password: GOOD, roleKey: "SUPPORT_AGENT", ...over });
const create = (body: Record<string, unknown> = newAdmin()) => asSuper(app, "POST", "/admins", body);
const adminToken = (id: string) => tokenFor("BUSINESS_ADMIN", id);

before(async () => {
  app = await startInboxApp({ env: {} });
});
after(() => app.close());
beforeEach(() => {
  app.db.users = [{ ...SUPER }, { ...ADMIN_OK }, { id: "learner-1", firstName: "Lee", lastName: "Learner", email: "lee@example.com", roles: ["USER"] }];
  app.db.accessRows = [];
  app.db.sessions = [];
  app.db.messages = [];
  app.db.conversations = [];
  app.db.events = [];
  app.hashed.length = 0;
  app.env.BUSINESS_ADMIN_EMAILS = "";
  app.db.inbound(PHONE, "hello", new Date());
});

describe("role presets and module normalisation", () => {
  it("presets are fixed, CUSTOM uses the ticked modules, unknown keys (incl. admins) are dropped, order is canonical", () => {
    assert.deepEqual(modulesForRole("SUPPORT_AGENT", ["analytics"]), ["dashboard", "inbox", "customers"]);
    assert.deepEqual(modulesForRole("MANAGER", []), [...MODULE_KEYS]);
    assert.deepEqual(modulesForRole("CUSTOM", ["settings", "inbox", "inbox", "admins", "nope", 5]), ["inbox", "settings"]);
    assert.deepEqual(normalizeModules("not-an-array"), []);
    assert.ok(!MODULE_KEYS.includes("admins" as never), "Admin Management can never be delegated");
    for (const p of Object.values(ROLE_PRESETS)) assert.ok(!p.modules.includes("admins" as never));
  });
});

describe("password rules", () => {
  it("accepts a strong password and rejects weak ones with a reason that never echoes the password", () => {
    assert.equal(passwordProblem(GOOD, { email: "x@example.com", name: "Ann Lee" }), null);
    const bads: Array<[unknown, RegExp]> = [
      ["Short1!", /10 characters/],
      ["alllowercaseletters", /three of/],
      ["Password123456!", /too easy/],
      ["Rohan-Mehta-2026!", /name/],
      ["Zz9!" + "x".repeat(130), /at most/],
      [undefined, /Enter a password/],
    ];
    for (const [pw, re] of bads) {
      const msg = passwordProblem(pw, { email: "x@example.com", name: "Rohan Mehta" });
      assert.match(msg ?? "", re);
      if (typeof pw === "string") assert.ok(!(msg ?? "").includes(pw));
    }
    assert.match(passwordProblem("Contains-jsmith-inside9", { email: "jsmith@example.com" }) ?? "", /email/);
  });
});

describe("Admin Management is Super Admin only (server-enforced)", () => {
  const ROUTES: Array<[string, string, unknown?]> = [
    ["GET", "/admins/meta"],
    ["GET", "/admins"],
    ["POST", "/admins", newAdmin({ email: "denied@example.com" })],
    ["PATCH", "/admins/admin-user-1", { isActive: false }],
    ["POST", "/admins/admin-user-1/reset-password", { password: GOOD }],
  ];
  for (const [method, path, body] of ROUTES) {
    it(`${method} ${path}: 401 without a token, 403 for users, allowlisted admins and fully-permissioned Managers, 2xx/4xx-not-403 for a Super Admin`, async () => {
      assert.equal((await call(app, method, path, { body })).status, 401);
      assert.equal((await call(app, method, path, { token: tokenFor("USER"), body })).status, 403);
      app.env.BUSINESS_ADMIN_EMAILS = "ops@example.com";
      assert.equal((await call(app, method, path, { token: adminToken("admin-user-1"), body })).status, 403, "allowlisted admin");
      app.env.BUSINESS_ADMIN_EMAILS = "";
      app.db.accessRows.push({ id: "a1", userId: "admin-user-1", roleKey: "MANAGER", modules: [...MODULE_KEYS] });
      assert.equal((await call(app, method, path, { token: adminToken("admin-user-1"), body })).status, 403, "Manager with every module");
      const s = await call(app, method, path, { token: tokenFor("SUPERADMIN"), body });
      assert.notEqual(s.status, 401);
      assert.notEqual(s.status, 403);
    });
  }

  it("an ordinary admin cannot create admins or Super Admins, and nothing is written", async () => {
    app.db.accessRows.push({ id: "a1", userId: "admin-user-1", roleKey: "MANAGER", modules: [...MODULE_KEYS] });
    const before = app.db.users.length;
    for (const body of [newAdmin({ email: "x1@example.com" }), newAdmin({ email: "x2@example.com", role: "SUPERADMIN", roleKey: "SUPERADMIN" })]) {
      assert.equal((await call(app, "POST", "/admins", { token: adminToken("admin-user-1"), body })).status, 403);
    }
    assert.equal(app.db.users.length, before);
  });

  it("a Super Admin cannot create a Super Admin either: the role is not selectable and extra role fields are ignored", async () => {
    assert.equal((await create(newAdmin({ email: "s1@example.com", roleKey: "SUPERADMIN" }))).status, 400);
    const r = await create(newAdmin({ email: "s2@example.com", role: "SUPERADMIN", roles: ["SUPERADMIN"], isSuperAdmin: true }));
    assert.equal(r.status, 201);
    assert.equal(r.json.data.role, "BUSINESS_ADMIN");
    const row = app.db.users.find((u) => u.email === "s2@example.com")!;
    assert.deepEqual(row.roles, ["BUSINESS_ADMIN"]);
  });

  it("a deactivated Super Admin loses access immediately, whatever their token says", async () => {
    (app.db.users.find((u) => u.id === SUPER.id) as any).isActive = false;
    assert.equal((await asSuper(app, "GET", "/admins")).status, 403);
    assert.equal((await asSuper(app, "GET", "/overview")).status, 403);
  });
});

describe("creating admins", () => {
  it("creates an ADMIN with preset permissions, a lower-cased email, a verified email and a hashed password", async () => {
    const r = await create();
    assert.equal(r.status, 201);
    const d = r.json.data;
    assert.equal(d.email, "rohan@example.com");
    assert.equal(d.name, "Rohan Mehta");
    assert.equal(d.role, "BUSINESS_ADMIN");
    assert.equal(d.roleKey, "SUPPORT_AGENT");
    assert.deepEqual(d.modules, ["dashboard", "inbox", "customers"]);
    assert.equal(d.isActive, true);
    const u = app.db.users.find((x) => x.email === "rohan@example.com") as any;
    assert.equal(u.isEmailVerified, true);
    assert.equal(u.profileCompleted, true);
    assert.equal(u.authProvider, "LOCAL");
    assert.notEqual(u.password, GOOD);
    assert.ok(u.password.startsWith("hash:"), "stored value is the hasher's output");
    assert.deepEqual(app.db.accessRows.find((x) => x.userId === u.id)?.modules, ["dashboard", "inbox", "customers"]);
    assert.equal(app.db.accessRows[0].createdByUserId, SUPER.id);
    const blob = JSON.stringify(r.json);
    assert.ok(!blob.includes(GOOD) && !blob.includes("password") && !blob.includes("hash:"), "response never contains the password or hash");
  });

  it("the new admin can open Business Admin with exactly the granted modules", async () => {
    const id = (await create()).json.data.id;
    const t = adminToken(id);
    const me = await call(app, "GET", "/me", { token: t });
    assert.equal(me.status, 200);
    assert.equal(me.json.data.access, "permissions");
    assert.deepEqual(me.json.data.modules, ["dashboard", "inbox", "customers"]);
    assert.equal(me.json.data.isSuperAdmin, false);
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: t })).status, 200);
    assert.equal((await call(app, "GET", "/overview", { token: t })).status, 200);
    assert.equal((await call(app, "GET", "/admins", { token: t })).status, 403);
  });

  it("passwords are read from the raw body: symbols such as < > & are not HTML-escaped before hashing", async () => {
    const pw = "Tr1cky<&>Pass\"word!";
    assert.equal((await create(newAdmin({ email: "sym@example.com", password: pw }))).status, 201);
    assert.deepEqual(app.hashed, [pw]);
  });

  it("custom roles use the ticked modules; presets ignore them", async () => {
    const c = await create(newAdmin({ email: "c@example.com", roleKey: "CUSTOM", modules: ["analytics", "settings"] }));
    assert.deepEqual(c.json.data.modules, ["analytics", "settings"]);
    const p = await create(newAdmin({ email: "p@example.com", roleKey: "ANALYST", modules: ["inbox"] }));
    assert.deepEqual(p.json.data.modules, ["dashboard", "analytics"]);
  });

  it("validation: name, email, password, role and modules (400 with the offending field)", async () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ name: "" }, "name"],
      [{ name: "x" }, "name"],
      [{ name: "y".repeat(81) }, "name"],
      [{ email: "not-an-email" }, "email"],
      [{ email: "a b@example.com" }, "email"],
      [{ password: "" }, "password"],
      [{ roleKey: undefined }, "roleKey"],
      [{ roleKey: "OWNER" }, "roleKey"],
      [{ roleKey: "CUSTOM", modules: [] }, "modules"],
      [{ roleKey: "CUSTOM" }, "modules"],
      [{ roleKey: "CUSTOM", modules: ["inbox", "admins"] }, "modules"],
      [{ roleKey: "CUSTOM", modules: "inbox" }, "modules"],
    ];
    for (const [over, field] of cases) {
      const r = await create(newAdmin({ email: `v${Math.random().toString(36).slice(2)}@example.com`, ...over }));
      assert.equal(r.status, 400, JSON.stringify(over));
      assert.equal(r.json.data?.field, field, JSON.stringify(over));
    }
    const weak = await create(newAdmin({ email: "weak@example.com", password: "short" }));
    assert.equal(weak.status, 400);
    assert.equal(weak.json.data.code, "WEAK_PASSWORD");
    assert.equal(app.db.users.filter((u) => /^(v|weak)/.test(u.email)).length, 0, "nothing was created");
  });

  it("names and emails cannot carry HTML, quotes or control characters (they bypass the global sanitizer), but real names work", async () => {
    const reject = [
      { name: "<script>alert(1)</script>" },
      { name: "Bob <b>Bold</b>" },
      { name: 'Eve "quoted"' },
      { name: "12345" },
      { name: "A" },
      { email: "a<script>@example.com" },
      { email: "x'y@example.com" },
      { email: "a b@example.com" },
      { email: "a@b" },
      { email: "no-at-sign.example.com" },
      { email: "a\"b@example.com" },
    ];
    for (const over of reject) {
      const r = await create(newAdmin({ email: `h${Math.random().toString(36).slice(2)}@example.com`, ...over }));
      assert.equal(r.status, 400, JSON.stringify(over));
    }
    for (const name of ["Rohan Mehta", "Zoë O'Brien-Smith", "José María", "Priya K. Shah", "अनिता शर्मा"]) {
      const r = await create(newAdmin({ name, email: `ok${Math.random().toString(36).slice(2)}@example.com` }));
      assert.equal(r.status, 201, name);
      assert.equal(r.json.data.name, name);
    }
    const stripped = await create(newAdmin({ name: "Name\u0000Null\u0007Bell", email: "ctrl@example.com" }));
    assert.equal(stripped.status, 201);
    assert.equal(stripped.json.data.name, "NameNullBell", "control characters are removed, never stored");
    assert.equal(app.db.users.filter((u) => /<|>|"|\u0000/.test(`${u.firstName}${u.lastName}${u.email}`)).length, 0);
  });

  it("a concurrent duplicate create that slips past the existence check becomes a clean 409 (unique index)", async () => {
    const real = (app.db as any).user.create;
    (app.db as any).user.create = async () => {
      throw Object.assign(new Error("Unique constraint failed on the fields: (`email`)"), { code: "P2002" });
    };
    try {
      const r = await create(newAdmin({ email: "race@example.com" }));
      assert.equal(r.status, 409);
      assert.equal(r.json.data.code, "EMAIL_EXISTS");
      assert.ok(!JSON.stringify(r.json).includes("Unique constraint"));
    } finally {
      (app.db as any).user.create = real;
    }
    assert.equal(app.db.accessRows.length, 0, "no permission row without a user");
  });

  it("refuses an email that already belongs to ANY account (no takeover or silent promotion), case-insensitively", async () => {
    const r1 = await create(newAdmin({ email: "LEE@example.com" }));
    assert.equal(r1.status, 409);
    assert.equal(r1.json.data.code, "EMAIL_EXISTS");
    assert.deepEqual(app.db.users.find((u) => u.id === "learner-1")!.roles, ["USER"], "existing learner untouched");
    assert.equal((await create()).status, 201);
    assert.equal((await create(newAdmin({ email: "ROHAN@example.com" }))).status, 409);
  });

  it("fails cleanly if the BUSINESS_ADMIN role is missing from the database", async () => {
    const saved = app.db.rolesTable.splice(app.db.rolesTable.findIndex((r) => r.name === "BUSINESS_ADMIN"), 1);
    try {
      const r = await create();
      assert.equal(r.status, 503);
      assert.equal(r.json.data.code, "ROLE_MISSING");
    } finally {
      app.db.rolesTable.splice(1, 0, ...saved);
    }
  });

  it("a database failure is a generic 500 and the password never reaches the logs or the response", async () => {
    app.db.failUser = Object.assign(new Error(`insert failed for rohan@example.com ${GOOD}`), { code: "P2010" });
    const logs: string[] = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    console.log = console.warn = console.error = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
    let r;
    try {
      r = await create();
    } finally {
      Object.assign(console, orig);
      app.db.failUser = null;
    }
    assert.equal(r.status, 500);
    const all = JSON.stringify(r.json) + logs.join("\n");
    assert.ok(!all.includes(GOOD) && !all.includes("rohan@example.com"));
  });

  it("uses real bcrypt at cost 12 by default (verified with the production hasher)", async () => {
    assert.equal(ADMIN_BCRYPT_COST, 12);
    const svc = new AdminsService({ db: app.db as unknown as AdminsDb, env: {} });
    const dto = await svc.create({ name: "Real Hash", email: "realhash@example.com", password: GOOD, roleKey: "ANALYST" }, SUPER.id);
    const stored = (app.db.users.find((u) => u.id === dto.id) as any).password as string;
    assert.match(stored, /^\$2[aby]\$12\$/);
    assert.equal(await bcrypt.compare(GOOD, stored), true);
    assert.equal(await bcrypt.compare(GOOD + "x", stored), false);
  });
});

describe("listing and search", () => {
  beforeEach(async () => {
    app.env.BUSINESS_ADMIN_EMAILS = "ops@example.com";
    await create(newAdmin({ name: "Rohan Mehta", email: "rohan@example.com" }));
    await create(newAdmin({ name: "Priya Shah", email: "priya@work.example.com", roleKey: "ANALYST" }));
  });

  it("lists super admins, granted admins and legacy admins with where their access comes from; learners are excluded", async () => {
    const r = await asSuper(app, "GET", "/admins");
    const byEmail = Object.fromEntries(r.json.data.items.map((a: any) => [a.email, a]));
    assert.equal(r.json.data.total, 4);
    assert.equal(byEmail["sam@example.com"].source, "superadmin");
    assert.equal(byEmail["sam@example.com"].role, "SUPERADMIN");
    assert.equal(byEmail["ops@example.com"].source, "allowlist");
    assert.equal(byEmail["rohan@example.com"].source, "permissions");
    assert.ok(!byEmail["lee@example.com"]);
    assert.ok(!JSON.stringify(r.json).includes("password"));
  });

  it("searches by name or email, case-insensitively, and pages", async () => {
    const names = async (q: string) => (await asSuper(app, "GET", `/admins?q=${encodeURIComponent(q)}`)).json.data.items.map((a: any) => a.name).sort();
    assert.deepEqual(await names("PRIYA"), ["Priya Shah"]);
    assert.deepEqual(await names("work.example"), ["Priya Shah"]);
    assert.deepEqual(await names("mehta"), ["Rohan Mehta"]);
    assert.deepEqual(await names("zzz-nobody"), []);
    const p1 = (await asSuper(app, "GET", "/admins?pageSize=2&page=1")).json.data;
    const p2 = (await asSuper(app, "GET", "/admins?pageSize=2&page=2")).json.data;
    assert.equal(p1.items.length + p2.items.length, 4);
    assert.equal(new Set([...p1.items, ...p2.items].map((a: any) => a.id)).size, 4);
  });

  it("validates paging and exposes the module and role catalogue", async () => {
    for (const q of ["?page=0", "?pageSize=101", "?page=abc", "?pageSize=0"]) assert.equal((await asSuper(app, "GET", `/admins${q}`)).status, 400, q);
    const meta = (await asSuper(app, "GET", "/admins/meta")).json.data;
    assert.deepEqual(meta.modules.map((m: any) => m.key), [...MODULE_KEYS]);
    assert.deepEqual(meta.roles.map((r: any) => r.key), ["MANAGER", "SUPPORT_AGENT", "ANALYST", "CUSTOM"]);
  });
});

describe("editing permissions, activation and passwords", () => {
  let id = "";
  beforeEach(async () => {
    id = (await create()).json.data.id;
  });
  const patch = (body: Record<string, unknown>, target = id) => asSuper(app, "PATCH", `/admins/${target}`, body);

  it("changing the role or modules takes effect on the very next request", async () => {
    const t = adminToken(id);
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: t })).status, 200);
    assert.equal((await call(app, "GET", "/whatsapp/team", { token: t })).status, 200);
    const r = await patch({ roleKey: "CUSTOM", modules: ["analytics"] });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.data.modules, ["analytics"]);
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: t })).status, 403, "inbox removed immediately");
    assert.equal((await call(app, "GET", "/overview", { token: t })).status, 200, "analytics still allowed");
    assert.equal((await patch({ roleKey: "MANAGER" })).json.data.modules.length, MODULE_KEYS.length);
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: t })).status, 200);
  });

  it("each module gates its own endpoints on the server", async () => {
    const t = adminToken(id);
    await patch({ roleKey: "CUSTOM", modules: ["settings"] });
    assert.equal((await call(app, "GET", "/me", { token: t })).status, 200, "any granted admin can read their own profile");
    assert.equal((await call(app, "GET", "/overview", { token: t })).status, 403);
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: t })).status, 403);
    assert.equal((await call(app, "POST", `/whatsapp/conversations/${PHONE}/notes`, { token: t, body: { body: "x" } })).status, 403);
    assert.equal((await call(app, "PUT", `/whatsapp/conversations/${PHONE}/assignment`, { token: t, body: { assigneeId: null } })).status, 403);
    for (const m of ["dashboard", "integrations", "analytics"]) {
      await patch({ roleKey: "CUSTOM", modules: [m] });
      assert.equal((await call(app, "GET", "/overview", { token: t })).status, 200, `${m} may read the overview`);
    }
  });

  it("an admin with an empty permission set has no access at all", async () => {
    app.db.accessRows.find((r) => r.userId === id)!.modules = [];
    assert.equal((await call(app, "GET", "/me", { token: adminToken(id) })).status, 403);
  });

  it("can rename; validation errors and empty patches are 400; nothing changes", async () => {
    assert.equal((await patch({ name: "Rohan K Mehta" })).json.data.name, "Rohan K Mehta");
    for (const body of [{}, { name: "x" }, { isActive: "yes" }, { roleKey: "OWNER" }, { modules: ["inbox"] }, { roleKey: "CUSTOM", modules: ["admins"] }]) {
      assert.equal((await patch(body)).status, 400, JSON.stringify(body));
    }
    assert.equal((await patch({}, "not valid!")).status, 400);
    assert.equal((await patch({ isActive: false }, "cdoesnotexist12345")).status, 404);
  });

  it("deactivation blocks the admin immediately, ends their sessions, and reactivation restores access", async () => {
    app.db.sessions.push({ id: "s1", userId: id }, { id: "s2", userId: id }, { id: "s3", userId: "other-user" });
    const t = adminToken(id);
    assert.equal((await call(app, "GET", "/me", { token: t })).status, 200);
    const off = await patch({ isActive: false });
    assert.equal(off.json.data.isActive, false);
    assert.equal((await call(app, "GET", "/me", { token: t })).status, 403, "the still-valid token no longer works");
    assert.equal((await call(app, "GET", "/whatsapp/conversations", { token: t })).status, 403);
    assert.deepEqual(app.db.sessions.map((s) => s.id), ["s3"], "only that person's refresh sessions were removed");
    const on = await patch({ isActive: true });
    assert.equal(on.json.data.isActive, true);
    assert.equal((await call(app, "GET", "/me", { token: t })).status, 200);
  });

  it("deactivated admins cannot be assigned conversations and drop out of the team list", async () => {
    assert.ok((await asSuper(app, "GET", "/whatsapp/team")).json.data.items.some((m: any) => m.id === id));
    assert.equal((await asSuper(app, "PUT", `/whatsapp/conversations/${PHONE}/assignment`, { assigneeId: id })).status, 200);
    await patch({ isActive: false });
    assert.ok(!(await asSuper(app, "GET", "/whatsapp/team")).json.data.items.some((m: any) => m.id === id));
    await patch({ isActive: true });
    await patch({ roleKey: "ANALYST" });
    assert.ok(!(await asSuper(app, "GET", "/whatsapp/team")).json.data.items.some((m: any) => m.id === id), "no inbox permission = not assignable");
  });

  it("protects Super Admins, learners and yourself", async () => {
    const own = await patch({ isActive: false }, SUPER.id);
    assert.equal(own.status, 403, "Super Admin accounts cannot be changed here");
    assert.equal(own.json.data.code, "PROTECTED");
    assert.equal((await patch({ isActive: false }, "learner-1")).status, 422);
    assert.equal(app.db.users.find((u) => u.id === SUPER.id)!.roles[0], "SUPERADMIN");
    assert.equal((await asSuper(app, "POST", `/admins/${SUPER.id}/reset-password`, { password: GOOD })).status, 403);
  });

  it("an admin cannot be promoted to Super Admin through any field", async () => {
    await patch({ role: "SUPERADMIN", roles: ["SUPERADMIN"], roleKey: "MANAGER" });
    assert.deepEqual(app.db.users.find((u) => u.id === id)!.roles, ["BUSINESS_ADMIN"]);
    assert.equal((await patch({ roleKey: "SUPERADMIN" })).status, 400);
  });

  it("reset password: stores a new hash, signs the person out everywhere, and never echoes the password", async () => {
    app.db.sessions.push({ id: "s1", userId: id });
    const before = (app.db.users.find((u) => u.id === id) as any).password;
    const next = "N3w!Secure#Pass99";
    const r = await asSuper(app, "POST", `/admins/${id}/reset-password`, { password: next });
    assert.equal(r.status, 200);
    const after = (app.db.users.find((u) => u.id === id) as any).password;
    assert.notEqual(after, before);
    assert.notEqual(after, next);
    assert.equal(app.db.sessions.length, 0);
    assert.ok(!JSON.stringify(r.json).includes(next));
  });

  it("reset password validation: weak, missing, own account, unknown admin", async () => {
    const same = (app.db.users.find((u) => u.id === id) as any).password;
    assert.equal((await asSuper(app, "POST", `/admins/${id}/reset-password`, { password: "weak" })).status, 400);
    assert.equal((await asSuper(app, "POST", `/admins/${id}/reset-password`, {})).status, 400);
    assert.equal((await asSuper(app, "POST", `/admins/cdoesnotexist12345/reset-password`, { password: GOOD })).status, 404);
    assert.equal((app.db.users.find((u) => u.id === id) as any).password, same, "failed resets change nothing");
    // A Super Admin resetting their own password here is refused (SUPER is protected anyway).
    assert.equal((await asSuper(app, "POST", `/admins/${SUPER.id}/reset-password`, { password: GOOD })).status, 403);
  });
});

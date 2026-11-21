import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import jwt from "jsonwebtoken";

// SAFETY: DATABASE_URL points at a dead port before prisma is imported, and the prisma delegates the login touches are
// replaced with in-memory fakes. This file can never reach any real database (local or remote).
const saved: Record<string, string | undefined> = {};
for (const k of ["DATABASE_URL", "JWT_SECRET"]) saved[k] = process.env[k];
process.env.DATABASE_URL = "postgresql://nobody:nobody@127.0.0.1:1/none";
process.env.JWT_SECRET = "test_jwt_secret_not_real_0123456789";

const { default: prisma } = await import("../../prisma.js");
const { default: express } = await import("express");
const { default: AuthService } = await import("../../src/modules/auth/auth.service.js");
const { buildSuperAdminData } = await import("../../src/modules/business-admin/superadmin.bootstrap.js");
const { startInboxApp, call, SUPER } = await import("../business-admin/app.js");

const PASSWORD = "Violet!Marble#8472Orbit"; // test-only
const EMAIL = "super.admin@example.com";
const db: any = prisma;
// These tests exercise the Learning login only: no AI Adoption account exists for the email (unified-login lookup).
db.adoptionUser.findUnique = async () => null;
const patched: Array<() => void> = [];
const fake = (p: string, fn: (...a: any[]) => any) => {
  const [model, method] = p.split(".");
  const prev = db[model][method];
  const had = Object.prototype.hasOwnProperty.call(db[model], method);
  db[model][method] = fn;
  patched.push(() => (had ? (db[model][method] = prev) : delete db[model][method]));
};

/** The `users` row exactly as the bootstrap script stores it (built by the same function, cost 4 only to keep the test fast). */
let row: any;
let queries: any[] = [];
let sessions = 0;
before(async () => {
  const data = await buildSuperAdminData({ email: "  Super.Admin@Example.com ", name: "Super Admin", password: PASSWORD, roleId: "role-super" }, 4);
  row = { id: "cmwoydtze0000bkfvbx299wzk", ...data, isDeleted: false, userRoleMappings: [{ role: { name: "SUPERADMIN" } }] };
  fake("user.findFirst", async (args: any) => {
    queries.push(args.where);
    const w = args.where;
    return w.email === row.email && w.isDeleted === false ? row : null;
  });
  fake("session.create", async () => void sessions++);
});
after(() => {
  while (patched.length) patched.pop()!();
  for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
});

describe("a bootstrapped Super Admin signs in through the ordinary /api/auth/login", () => {
  it("the bootstrap row has the shape login needs: users table, lower-cased email, LOCAL, verified, active, hashed password, SUPERADMIN mapping", async () => {
    assert.equal(row.email, EMAIL);
    assert.equal(row.authProvider, "LOCAL");
    assert.deepEqual([row.isEmailVerified, row.isActive, row.profileCompleted], [true, true, true]);
    assert.ok(row.password.startsWith("$2"), "bcrypt hash");
    assert.notEqual(row.password, PASSWORD);
    assert.deepEqual(row.userRoleMappings, [{ role: { name: "SUPERADMIN" } }]);
    assert.deepEqual((await buildSuperAdminData({ email: "x@y.zz", name: "A", password: PASSWORD, roleId: "r" }, 4)).userRoleMappings, { create: { roleId: "r" } });
  });

  it("login finds the user, verifies the password, answers without an OTP step, and issues a SUPERADMIN token", async () => {
    queries = [];
    const r: any = await new AuthService().login({ email: EMAIL, password: PASSWORD } as any);
    assert.ok(!("requiresVerification" in r), "no OTP step for a verified account");
    assert.equal(sessions, 1);
    assert.equal(r.user.email, EMAIL);
    assert.ok(!("password" in r.user), "the hash is never returned");
    const t = jwt.verify(r.accessToken, process.env.JWT_SECRET!) as { id: string; role: string };
    assert.deepEqual([t.id, t.role], [row.id, "SUPERADMIN"]);
    assert.deepEqual(queries[0], { email: EMAIL, isDeleted: false }, "queries the `users` table by exact email (the HTTP validator lower-cases it)");
  });

  it("over HTTP the validator lower-cases and trims the email, so 'Super.Admin@Example.com ' signs in too", async () => {
    const { login } = await import("../../src/modules/auth/auth.controller.js");
    const app = express();
    app.use(express.json());
    app.post("/api/auth/login", login);
    const server: Server = await new Promise((res) => { const s = app.listen(0, "127.0.0.1", () => res(s)); });
    try {
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/auth/login`;
      const post = (body: unknown) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const ok = await post({ email: " Super.Admin@Example.com ", password: PASSWORD });
      assert.equal(ok.status, 200);
      assert.equal(((await ok.json()) as any).data.user.email, EMAIL);
    } finally {
      await new Promise((r) => server.close(() => r(undefined)));
    }
  });

  it("password verification is NOT weakened: a wrong password is 401, an unknown email is 404, a deactivated account is refused", async () => {
    const svc = new AuthService();
    await assert.rejects(svc.login({ email: EMAIL, password: "Wrong!Password#1234" } as any), (e: any) => e.statusCode === 401);
    await assert.rejects(svc.login({ email: "nobody@example.com", password: PASSWORD } as any), (e: any) => e.statusCode === 404);
    row.isActive = false;
    try {
      await assert.rejects(svc.login({ email: EMAIL, password: PASSWORD } as any), (e: any) => e.statusCode === 403);
    } finally {
      row.isActive = true;
    }
  });

  it("the issued SUPERADMIN token opens Admin Management; a staff token does not", async () => {
    const r: any = await new AuthService().login({ email: EMAIL, password: PASSWORD } as any);
    const app = await startInboxApp({ users: [{ ...SUPER, id: row.id, email: EMAIL }], env: {} });
    try {
      const me = await call(app, "GET", "/me", { token: r.accessToken });
      assert.equal(me.status, 200);
      assert.equal(me.json.data.isSuperAdmin, true);
      assert.ok(me.json.data.modules.includes("admins"));
      assert.equal((await call(app, "GET", "/admins", { token: r.accessToken })).status, 200);
      const staff = jwt.sign({ id: "staff-1", role: "BUSINESS_ADMIN" }, process.env.JWT_SECRET!, { expiresIn: "5m" });
      assert.equal((await call(app, "GET", "/admins", { token: staff })).status, 403);
    } finally {
      await app.close();
    }
  });
});

describe("the local database is selected explicitly", () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "../../package.json"), "utf8"));
  it("dev:local and bootstrap:superadmin:local layer .env.local-test over .env; the plain scripts do not", () => {
    assert.match(pkg.scripts["dev:local"], /--env-file=\.env --env-file=\.env\.local-test/);
    assert.match(pkg.scripts["bootstrap:superadmin:local"], /--env-file=\.env --env-file=\.env\.local-test/);
    assert.ok(!/local-test/.test(pkg.scripts.dev));
    assert.ok(!/local-test/.test(pkg.scripts["bootstrap:superadmin"]));
  });
  it("the server logs the database host and name (never the credentials) at startup", () => {
    const src = fs.readFileSync(path.resolve(import.meta.dirname, "../../src/index.ts"), "utf8");
    assert.match(src, /Database: \$\{u\.hostname\}/);
    assert.ok(!/Database:.*(password|username)/i.test(src));
  });
  it(".env.local-test is gitignored", () => {
    assert.match(fs.readFileSync(path.resolve(import.meta.dirname, "../../.gitignore"), "utf8"), /^\.env\.local-test$/m);
  });
});

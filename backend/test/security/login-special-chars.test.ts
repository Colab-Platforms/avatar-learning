import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

// REGRESSION TEST for the login sanitizer bug. Runs the REAL express chain used in production
// (express.json + sanitizeMiddleware + the login controller) against a row whose password was hashed the way the bootstrap script
// and Admin Management store it: the exact characters that were typed.
//
// Cases with < or > guard the sanitizer bug: login now tries the typed password first, then the sanitized one.
// global sanitizer before bcrypt sees it), which node reports as "todo" without failing the suite. When the login fix is approved
// and applied, remove the `todo` options so they become ordinary, enforced tests.
const saved: Record<string, string | undefined> = {};
for (const k of ["DATABASE_URL", "JWT_SECRET"]) saved[k] = process.env[k];
process.env.DATABASE_URL = "postgresql://nobody:nobody@127.0.0.1:1/none";
process.env.JWT_SECRET = "test_jwt_secret_not_real_0123456789";

const { default: prisma } = await import("../../prisma.js");
const { default: express } = await import("express");
const { default: sanitizeMiddleware } = await import("../../src/middlewares/sanitize.js");
const { login } = await import("../../src/modules/auth/auth.controller.js");
const { buildSuperAdminData } = await import("../../src/modules/business-admin/superadmin.bootstrap.js");

const { default: bcrypt } = await import("bcrypt");
const bcryptHash = (p: string) => bcrypt.hash(p, 4);
const db: any = prisma;
// These tests exercise the Learning login only: no AI Adoption account exists for the email (unified-login lookup).
db.adoptionUser.findUnique = async () => null;
const EMAIL = "super.admin@example.com";
let server: Server;
let url = "";
const restore: Array<() => void> = [];

const withPasswordStoredRaw = async (password: string) => {
  const data = await buildSuperAdminData({ email: EMAIL, name: "Super Admin", password, roleId: "role-super" }, 4);
  db.user.findFirst = async () => ({ id: "u1", ...data, isDeleted: false, userRoleMappings: [{ role: { name: "SUPERADMIN" } }] });
};
const signIn = async (password: string) =>
  (await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: EMAIL, password }) })).status;

before(async () => {
  const origFind = db.user.findFirst;
  const origSession = db.session.create;
  db.session.create = async () => ({});
  restore.push(() => ((db.user.findFirst = origFind), (db.session.create = origSession)));
  const app = express();
  app.use(express.json({ verify: (req: any, _res: any, buf: Buffer) => void (req.rawBody = buf.toString("utf8")) }));
  app.use(sanitizeMiddleware);
  app.post("/api/auth/login", login);
  server = await new Promise((r) => {
    const s = app.listen(0, "127.0.0.1", () => r(s));
  });
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/auth/login`;
});
after(async () => {
  while (restore.length) restore.pop()!();
  await new Promise((r) => server.close(() => r(undefined)));
  for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
});

describe("login with special characters in the password (bootstrap / Admin Management store the raw text)", () => {
  // These already pass today: the sanitizer leaves & and quotes alone. They lock that behaviour in.
  for (const [name, pw] of [
    ["ampersand", "Ab&cd#Ef1234!x"],
    ["double quotes", 'Say"hi"#Ab1234xyz'],
    ["single quote", "It's#Fine12345xyz"],
    ["ampersand + both quote types", `A&b"c'd#E123456!`],
    ["an HTML entity typed literally", "x&lt;y#Zz1234567"],
  ] as const) {
    it(`signs in with ${name}`, async () => {
      await withPasswordStoredRaw(pw);
      assert.equal(await signIn(pw), 200);
    });
  }

  // These FAIL today (HTTP 401): this is the bug.
  for (const [name, pw] of [
    ["a less-than sign", "Pa<ss#word1234"],
    ["a greater-than sign", "Pa>ss#word1234"],
    ["both < and > not forming an allowed tag", "a<x#Cc12345>"],
    ["< > & and quotes together", `Q<&>"'#Ab12345x`],
  ] as const) {
    it(`signs in with ${name}`, async () => {
      await withPasswordStoredRaw(pw);
      assert.equal(await signIn(pw), 200);
    });
  }

  it("accounts registered the usual way (hash of the SANITIZED text) still sign in with the same typed password", async () => {
    const sanitizedHash = await bcryptHash("Pa&lt;ss#word1234");
    db.user.findFirst = async () => ({ id: "u2", email: EMAIL, password: sanitizedHash, isActive: true, isDeleted: false, isEmailVerified: true, profileCompleted: true, authProvider: "LOCAL", userRoleMappings: [{ role: { name: "USER" } }] });
    assert.equal(await signIn("Pa<ss#word1234"), 200);
    assert.equal(await signIn("Pa<ss#word1235"), 401);
  });

  it("a wrong password is still refused, whatever characters it has (the fix must not weaken verification)", async () => {
    await withPasswordStoredRaw("Pa<ss#word1234");
    assert.equal(await signIn("Pa<ss#word9999"), 401);
    assert.equal(await signIn("Pa&lt;ss#word1234x"), 401);
    assert.equal(await signIn(""), 400);
  });
});

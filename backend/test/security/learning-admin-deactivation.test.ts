// Characterises how account deactivation interacts with the EXISTING Learning Admin (/api/admin) authentication.
// This pins today's behaviour so it cannot change silently; see the pre-deployment report for the recommended fix.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import jwt from "jsonwebtoken";
import { auth } from "../../src/middlewares/authMiddleware.js";

const SECRET = "learning_admin_test_secret";
process.env.JWT_SECRET = SECRET;

const run = (token: string) =>
  new Promise<{ passed: boolean; err?: any }>((resolve) => {
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    auth("ADMIN")(req, {} as any, (err?: any) => resolve({ passed: !err, err }));
  });

describe("deactivation vs the shared auth() middleware (Learning Admin)", () => {
  it("KNOWN GAP: auth() verifies only the token; it never reads users.is_active, so a deactivated admin's still-valid token passes /api/admin until it expires (TTL 1 day)", async () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), "src/middlewares/authMiddleware.ts"), "utf8");
    assert.ok(!/prisma|isActive|isDeleted/.test(src), "if this fails, auth() now consults the database: update the gap analysis and this test");
    const token = jwt.sign({ id: "deactivated-admin", role: "ADMIN" }, SECRET, { expiresIn: "1d" });
    assert.equal((await run(token)).passed, true);
    const ttl = fs.readFileSync(path.resolve(process.cwd(), "src/modules/auth/auth.service.ts"), "utf8").match(/ACCESS_TOKEN_TTL = "([^"]+)"/)?.[1];
    assert.equal(ttl, "1d");
  });

  it("what IS enforced: Business Admin re-reads the account on every request, and deactivation deletes refresh sessions so no new token can be issued", () => {
    const svc = fs.readFileSync(path.resolve(process.cwd(), "src/modules/business-admin/admins.service.ts"), "utf8");
    assert.match(svc, /patch\.isActive === false\) await tx\.session\.deleteMany/);
    const refresh = fs.readFileSync(path.resolve(process.cwd(), "src/modules/auth/auth.service.ts"), "utf8");
    assert.match(refresh, /!session\.user\.isActive \|\| session\.user\.isDeleted/, "the refresh path rejects inactive users");
    assert.match(refresh, /if \(!user\.isActive\)/, "the login path rejects inactive users");
  });

  it("an expired or wrongly signed token is still rejected (baseline)", async () => {
    assert.equal((await run(jwt.sign({ id: "x", role: "ADMIN" }, SECRET, { expiresIn: -10 }))).passed, false);
    assert.equal((await run(jwt.sign({ id: "x", role: "ADMIN" }, "another-secret"))).passed, false);
    assert.equal((await run(jwt.sign({ id: "x", role: "USER" }, SECRET))).passed, false);
  });
});

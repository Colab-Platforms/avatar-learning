// Run with: npm run test:logic
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { postLoginPath, isBusinessStaff, roleNamesOf } from "./postLogin.js";

const u = (...names: string[]) => ({ userRoleMappings: names.map((name) => ({ role: { name } })) });

describe("postLoginPath", () => {
  it("Super Admin and Business Admin staff land on the Business Admin panel; everyone else on Learning", () => {
    assert.equal(postLoginPath(u("USER", "SUPERADMIN")), "/admin-adaption");
    assert.equal(postLoginPath(u("BUSINESS_ADMIN")), "/admin-adaption");
    assert.equal(postLoginPath(u("USER")), "/direct2hire");
    assert.equal(postLoginPath(u("ADMIN")), "/direct2hire", "Learning Admin keeps the existing landing (the /admin panel stays separate)");
    assert.equal(postLoginPath(null), "/direct2hire");
    assert.equal(postLoginPath({}), "/direct2hire");
  });
  it("an explicit same-site redirect always wins; off-site or protocol-relative ones are ignored", () => {
    assert.equal(postLoginPath(u("SUPERADMIN"), "/courses/x"), "/courses/x");
    assert.equal(postLoginPath(u("USER"), "https://evil.example"), "/direct2hire");
    assert.equal(postLoginPath(u("USER"), "//evil.example"), "/direct2hire");
  });
  it("role helpers tolerate missing data", () => {
    assert.deepEqual(roleNamesOf({ userRoleMappings: [{ role: null }, {}] as never }), []);
    assert.equal(isBusinessStaff(undefined), false);
  });
});

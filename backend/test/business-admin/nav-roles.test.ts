import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_OK, asSuper, call, startInboxApp, tokenFor, SUPER, type InboxApp } from "./app.js";

// The account menu draws links from GET /me; this proves what the SERVER answers for each role, and that the
// protected routes behind those links refuse everyone else even when the URL is typed directly.
const GOOD = "Violet!Marble#8472Orbit";
let app: InboxApp;
before(async () => void (app = await startInboxApp({ env: {} })));
after(() => app.close());
beforeEach(() => {
  app.db.users = [{ ...SUPER }, { ...ADMIN_OK }];
  app.db.accessRows = [];
  app.db.auditRows = [];
  app.db.sessions = [];
  app.env.BUSINESS_ADMIN_EMAILS = "";
});

describe("account menu: what /me and the protected routes say per role", () => {
  it("SUPERADMIN: /me says super admin; /admins is allowed", async () => {
    const me = await call(app, "GET", "/me", { token: tokenFor("SUPERADMIN", SUPER.id) });
    assert.equal(me.status, 200);
    assert.deepEqual([me.json.data.role, me.json.data.isSuperAdmin], ["SUPERADMIN", true]);
    assert.equal((await call(app, "GET", "/admins", { token: tokenFor("SUPERADMIN", SUPER.id) })).status, 200);
  });

  it("BUSINESS_ADMIN: /me lists only their modules; /admins and the other modules are 403 even by direct URL", async () => {
    const made = await asSuper(app, "POST", "/admins", { name: "Rohan Mehta", email: "rohan@example.com", password: GOOD, roleKey: "CUSTOM", permissions: { inbox: ["view"] } });
    const t = tokenFor("BUSINESS_ADMIN", made.json.data.id);
    const me = (await call(app, "GET", "/me", { token: t })).json.data;
    assert.deepEqual([me.role, me.isSuperAdmin, me.modules], ["BUSINESS_ADMIN", false, ["inbox"]]);
    assert.equal((await call(app, "GET", "/admins", { token: t })).status, 403);
    assert.equal((await call(app, "POST", "/admins", { token: t, body: { name: "X Y", email: "x@example.com", password: GOOD, roleKey: "CUSTOM", permissions: { inbox: ["view"] } } })).status, 403);
    assert.equal((await call(app, "GET", "/analytics/status", { token: t })).status, 403);
  });

  it("regular USER: /me is 403 (so no admin links), /admins is 403, no data endpoints open", async () => {
    const t = tokenFor("USER", "plain-user-1");
    assert.equal((await call(app, "GET", "/me", { token: t })).status, 403);
    assert.equal((await call(app, "GET", "/admins", { token: t })).status, 403);
    assert.equal((await call(app, "GET", "/overview", { token: t })).status, 403);
  });

  it("no token: 401 everywhere", async () => {
    for (const p of ["/me", "/admins", "/overview"]) assert.equal((await call(app, "GET", p)).status, 401, p);
  });

  it("a Learning Admin who is not allow-listed gets 403 (Business Admin is separate from /admin)", async () => {
    assert.equal((await call(app, "GET", "/me", { token: tokenFor("ADMIN", ADMIN_OK.id) })).status, 403);
  });
});

// Run with: npm run test:logic
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { businessNav, ADMIN_PANEL_HREF, MANAGE_ADMINS_HREF } from "./businessNav.js";

const me = (over: Record<string, unknown>) => ({ role: "BUSINESS_ADMIN", access: "permissions", modules: ["inbox"], isSuperAdmin: false, ...over }) as never;

describe("businessNav", () => {
  it("regular user (server said no): no Business Admin links, role User", () => {
    for (const none of [null, undefined]) assert.deepEqual(businessNav(none), { roleLabel: "User", showAdminPanel: false, showManageAdmins: false, modules: [] });
  });
  it("Super Admin gets the panel and Manage Administrators", () => {
    const n = businessNav(me({ role: "SUPERADMIN", isSuperAdmin: true, access: "superadmin" }));
    assert.deepEqual([n.roleLabel, n.showAdminPanel, n.showManageAdmins], ["Super Admin", true, true]);
  });
  it("staff / manager (BUSINESS_ADMIN) get the panel but never Manage Administrators", () => {
    const n = businessNav(me({ modules: ["inbox", "leads"] }));
    assert.deepEqual([n.roleLabel, n.showAdminPanel, n.showManageAdmins, n.modules], ["Business Admin", true, false, ["inbox", "leads"]]);
  });
  it("a Learning Admin on the allow-list sees the panel but not Manage Administrators", () => {
    const n = businessNav(me({ role: "ADMIN", access: "allowlist" }));
    assert.deepEqual([n.roleLabel, n.showAdminPanel, n.showManageAdmins], ["Admin", true, false]);
  });
  it("destinations are the Business Admin routes, not Learning Admin", () => {
    assert.equal(ADMIN_PANEL_HREF, "/admin-adaption");
    assert.equal(MANAGE_ADMINS_HREF, "/admin-adaption/admins");
  });
});

import type { BusinessAdminMe } from "./businessAdminApi";

/**
 * What the account dropdown shows for Business Admin (/admin-adaption). Pure, so it is unit-tested.
 * This only decides which LINKS to draw; the server (GET /api/business-admin/me and every endpoint behind it) is the
 * authority, and /admin-adaption/* re-checks access on load. `me` is null for anyone the server did not approve.
 */
export interface BusinessNav {
  /** Role label to show under the name. */
  roleLabel: string;
  showAdminPanel: boolean;
  showManageAdmins: boolean;
  /** Modules the person may open (shown as a hint for staff). */
  modules: string[];
}

export const ADMIN_PANEL_HREF = "/admin-adaption";
export const MANAGE_ADMINS_HREF = "/admin-adaption/admins";

const ROLE_LABEL: Record<BusinessAdminMe["role"], string> = {
  SUPERADMIN: "Super Admin",
  ADMIN: "Admin",
  BUSINESS_ADMIN: "Business Admin",
};

export function businessNav(me: BusinessAdminMe | null | undefined): BusinessNav {
  if (!me) return { roleLabel: "User", showAdminPanel: false, showManageAdmins: false, modules: [] };
  const isSuper = me.isSuperAdmin === true || me.role === "SUPERADMIN";
  return {
    roleLabel: ROLE_LABEL[me.role] ?? "User",
    showAdminPanel: true,
    // Super Admin only; the Admin Management API enforces the same rule.
    showManageAdmins: isSuper,
    modules: Array.isArray(me.modules) ? me.modules : [],
  };
}

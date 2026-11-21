/**
 * Where a signed-in person lands, by ROLE. Pure, so it is unit-tested. This only picks a starting page; the backend still decides
 * what each person may open, and every admin area re-checks access (the shared login grants no module by itself).
 */
export const ADMIN_LANDING = "/admin-adaption";
export const LEARNING_LANDING = "/direct2hire";

export const BUSINESS_STAFF_ROLES = ["SUPERADMIN", "SUPER_ADMIN", "BUSINESS_ADMIN"] as const;

/** The login response includes the role mappings even though the stored AuthUser type does not declare them. */
type RoleBearer = object | null | undefined;
type Mapped = { userRoleMappings?: Array<{ role?: { name?: string } | null }> | null };

export const roleNamesOf = (user: RoleBearer): string[] => ((user as Mapped | null | undefined)?.userRoleMappings ?? []).map((m) => String(m?.role?.name ?? "")).filter(Boolean);

export const isBusinessStaff = (user: RoleBearer): boolean => roleNamesOf(user).some((r) => (BUSINESS_STAFF_ROLES as readonly string[]).includes(r));

/** An explicit, same-site redirect always wins; otherwise Business Admin staff go to their panel and everyone else to Learning. */
export function postLoginPath(user: RoleBearer, redirect?: string | null): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) return redirect;
  return isBusinessStaff(user) ? ADMIN_LANDING : LEARNING_LANDING;
}

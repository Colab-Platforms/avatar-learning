/** Modules a Super Admin can grant to an admin. Order is the canonical display order. */
export const MODULE_KEYS = [
  "dashboard",
  "inbox",
  "leads",
  "customers",
  "agents",
  "automations",
  "integrations",
  "analytics",
  "team",
  "settings",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

/** Admin Management is never delegable: only a SUPERADMIN has it. */
export const ADMINS_MODULE = "admins";

/**
 * What a person may DO inside a module. "view" is the floor: any other action implies it. "manage" covers
 * administrative actions such as assigning conversations, recording consent and submitting templates to Meta.
 */
export const ACTIONS = ["view", "create", "edit", "delete", "manage"] as const;
export type Action = (typeof ACTIONS)[number];
export const ACTION_LABELS: Record<Action, string> = { view: "View", create: "Create", edit: "Edit", delete: "Delete", manage: "Manage / assign" };
export const isAction = (v: unknown): v is Action => typeof v === "string" && (ACTIONS as readonly string[]).includes(v);

/** module -> actions. A module that is absent (or has no actions) is not granted. */
export type PermissionMap = Partial<Record<ModuleKey, Action[]>>;

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  inbox: "WhatsApp Inbox",
  leads: "CRM & Leads",
  customers: "Customers",
  agents: "AI Agents",
  automations: "Automations",
  integrations: "Integrations",
  analytics: "Analytics",
  team: "Team Management",
  settings: "Settings",
};

export type RoleKey = "MANAGER" | "SUPPORT_AGENT" | "ANALYST" | "CUSTOM";

export interface RolePreset {
  label: string;
  description: string;
  modules: ModuleKey[];
  permissions: PermissionMap;
}

const ALL_ACTIONS: Action[] = [...ACTIONS];
const fullAccess = (modules: readonly ModuleKey[]): PermissionMap => Object.fromEntries(modules.map((m) => [m, [...ALL_ACTIONS]])) as PermissionMap;

export const ROLE_PRESETS: Record<RoleKey, RolePreset> = {
  MANAGER: { label: "Manager", description: "Everything except Admin Management.", modules: [...MODULE_KEYS], permissions: fullAccess(MODULE_KEYS) },
  SUPPORT_AGENT: {
    label: "Support agent",
    description: "Works the WhatsApp inbox (reply, assign) and sees customers. Cannot delete.",
    modules: ["dashboard", "inbox", "customers"],
    permissions: { dashboard: ["view"], inbox: ["view", "create", "edit", "manage"], customers: ["view"] },
  },
  ANALYST: { label: "Analyst", description: "Read-only reporting.", modules: ["dashboard", "analytics"], permissions: { dashboard: ["view"], analytics: ["view"] } },
  CUSTOM: { label: "Custom", description: "Pick the modules and actions yourself.", modules: [], permissions: {} },
};

export const ROLE_KEYS = Object.keys(ROLE_PRESETS) as RoleKey[];
export const isRoleKey = (v: unknown): v is RoleKey => typeof v === "string" && (ROLE_KEYS as string[]).includes(v);
export const isModuleKey = (v: unknown): v is ModuleKey => typeof v === "string" && (MODULE_KEYS as readonly string[]).includes(v);

/** Valid, de-duplicated, canonical order. Unknown keys (including "admins") are dropped. */
export const normalizeModules = (list: unknown): ModuleKey[] => {
  const set = new Set(Array.isArray(list) ? list.filter(isModuleKey) : []);
  return MODULE_KEYS.filter((m) => set.has(m));
};

/**
 * Valid, canonical permissions. Unknown modules (including "admins") and unknown actions are dropped, "view" is added to any
 * module that has another action, and a module left with no actions is not granted at all.
 */
export const normalizePermissions = (input: unknown): PermissionMap => {
  const out: PermissionMap = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const m of MODULE_KEYS) {
    const raw = (input as Record<string, unknown>)[m];
    if (!Array.isArray(raw)) continue;
    const set = new Set(raw.filter(isAction));
    if (set.size === 0) continue;
    set.add("view");
    out[m] = ACTIONS.filter((a) => set.has(a));
  }
  return out;
};

/** Modules that have at least one action, in canonical order. */
export const modulesOfPermissions = (p: PermissionMap): ModuleKey[] => MODULE_KEYS.filter((m) => (p[m]?.length ?? 0) > 0);

/** Older rows have only a module list: that meant every action on those modules. */
export const permissionsFromModules = (modules: unknown): PermissionMap => fullAccess(normalizeModules(modules));

/**
 * The permissions for a role choice: presets are fixed; CUSTOM uses what was ticked, either a permission map (new) or a plain
 * module list (older callers: every action on those modules).
 */
export const permissionsForRole = (roleKey: RoleKey, custom: unknown): PermissionMap => {
  if (roleKey !== "CUSTOM") return normalizePermissions(ROLE_PRESETS[roleKey].permissions);
  return Array.isArray(custom) ? permissionsFromModules(custom) : normalizePermissions(custom);
};

/** The effective module list for a role choice: presets are fixed, CUSTOM uses what was ticked. */
export const modulesForRole = (roleKey: RoleKey, custom: unknown): ModuleKey[] => modulesOfPermissions(permissionsForRole(roleKey, custom));

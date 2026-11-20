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
}

export const ROLE_PRESETS: Record<RoleKey, RolePreset> = {
  MANAGER: { label: "Manager", description: "Everything except Admin Management.", modules: [...MODULE_KEYS] },
  SUPPORT_AGENT: { label: "Support agent", description: "Works the WhatsApp inbox and sees customers.", modules: ["dashboard", "inbox", "customers"] },
  ANALYST: { label: "Analyst", description: "Read-only reporting.", modules: ["dashboard", "analytics"] },
  CUSTOM: { label: "Custom", description: "Pick the modules yourself.", modules: [] },
};

export const ROLE_KEYS = Object.keys(ROLE_PRESETS) as RoleKey[];
export const isRoleKey = (v: unknown): v is RoleKey => typeof v === "string" && (ROLE_KEYS as string[]).includes(v);
export const isModuleKey = (v: unknown): v is ModuleKey => typeof v === "string" && (MODULE_KEYS as readonly string[]).includes(v);

/** Valid, de-duplicated, canonical order. Unknown keys (including "admins") are dropped. */
export const normalizeModules = (list: unknown): ModuleKey[] => {
  const set = new Set(Array.isArray(list) ? list.filter(isModuleKey) : []);
  return MODULE_KEYS.filter((m) => set.has(m));
};

/** The effective module list for a role choice: presets are fixed, CUSTOM uses what was ticked. */
export const modulesForRole = (roleKey: RoleKey, custom: unknown): ModuleKey[] =>
  roleKey === "CUSTOM" ? normalizeModules(custom) : [...ROLE_PRESETS[roleKey].modules];

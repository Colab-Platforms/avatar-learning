import type { AdoptionProduct, AdoptionAccessStatus } from "@prisma/client";

/**
 * The AI Adoption tools. Each tool's app address comes from an environment
 * variable (e.g. ADOPTION_TOOL_URL_CRM=https://crm.avatarindia.com). Until it
 * is set, the tool shows as "not configured" instead of a broken link.
 *
 * Opening a tool only hands the browser that address after the backend has
 * checked access. It does NOT sign the user in to the tool's own app — that
 * app must still authenticate the user (or a proper SSO handoff must be added).
 */
export const ADOPTION_PRODUCTS: { key: AdoptionProduct; name: string; description: string }[] = [
  { key: "CRM", name: "CRM", description: "Track leads, deals and follow-ups in one sales pipeline." },
  { key: "OMS", name: "OMS", description: "Manage orders from placement to delivery." },
  { key: "SCRIPT_AUTOMATION", name: "Script Automation", description: "Automate repetitive business tasks and follow-ups." },
  { key: "LMS", name: "LMS", description: "Train your team with courses and track progress." },
  { key: "RECRUITMENT_CRM", name: "Recruitment CRM", description: "Organise hiring and candidate pipelines." },
  { key: "HRMS", name: "HRMS", description: "Attendance, leave and HR records for your workforce." },
  { key: "IMS", name: "IMS", description: "Real-time inventory visibility and stock control." },
  { key: "CUSTOM", name: "Custom Tools", description: "Software built for your specific workflow." },
];

export const PRODUCT_KEYS = ADOPTION_PRODUCTS.map((p) => p.key);

export const toolUrl = (key: AdoptionProduct): string | null => {
  const url = process.env[`ADOPTION_TOOL_URL_${key}`]?.trim();
  return url && /^https:\/\//.test(url) ? url : null;
};

/** What customers and admins see. "EXPIRED" and "NO_ACCESS" are derived, never stored. */
export type EffectiveStatus = AdoptionAccessStatus | "EXPIRED" | "NO_ACCESS";

export function effectiveStatus(e: { status: AdoptionAccessStatus; expiresAt: Date | null } | null | undefined, now = new Date()): EffectiveStatus {
  if (!e) return "NO_ACCESS";
  if (e.status === "ACTIVE" && e.expiresAt && e.expiresAt <= now) return "EXPIRED";
  return e.status;
}

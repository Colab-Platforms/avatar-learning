/**
 * Insights registry — the only place to touch when adding an article.
 *
 * To add an article:
 *  1. Drop a markdown file in this folder named `<slug>.md` using the same
 *     three sections as the existing ones: `## Title`, `## Overview`,
 *     `## Full Info` (the first `# H1` inside Full Info is the duplicate title
 *     and is not rendered again).
 *  2. Add one entry below. Title, excerpt, reading time and body all come from
 *     the markdown file, so nothing is written twice.
 *
 * `category` drives the "Blogs" / "Case studies" filter. `featured` picks the
 * large card on the left (falls back to the first article in the filter).
 */
export type InsightCategory = "blog" | "case";

export interface InsightRegistryEntry {
  slug: string;
  category: InsightCategory;
  /** CSS background for the thumbnail artwork (same gradients the design already used). */
  art: string;
  featured?: boolean;
}

export const INSIGHT_REGISTRY: InsightRegistryEntry[] = [
  {
    slug: "business-needs-smarter-operations-not-more-software",
    category: "blog",
    featured: true,
    art: "radial-gradient(circle at 72% 28%,rgba(111,227,239,.55),transparent 45%),radial-gradient(circle at 22% 82%,rgba(107,124,255,.65),transparent 50%),#0c0e13",
  },
  {
    slug: "lead-to-delivery-connected-business-crm-ims-oms",
    category: "blog",
    art: "radial-gradient(circle at 30% 30%,rgba(181,189,255,.55),transparent 50%),linear-gradient(160deg,#1c1f5e,#0b0d12)",
  },
  {
    slug: "avatar-crm-turn-customer-relationships-into-business-opportunities",
    category: "blog",
    art: "radial-gradient(circle at 50% 115%,rgba(111,227,239,.65),transparent 60%),#0b0d12",
  },
  {
    slug: "avatar-hrms-make-workforce-management-more-efficient",
    category: "blog",
    art: "radial-gradient(circle at 80% 20%,rgba(107,124,255,.55),transparent 50%),radial-gradient(circle at 20% 90%,rgba(111,227,239,.4),transparent 50%),#10131a",
  },
  {
    slug: "avatar-ims-improve-inventory-visibility-and-control",
    category: "blog",
    art: "conic-gradient(from 210deg at 60% 60%,#0c0e13,rgba(111,227,239,.45),#2b2f8f,#0c0e13)",
  },
  {
    slug: "avatar-oms-bring-structure-to-the-entire-order-journey",
    category: "blog",
    art: "radial-gradient(circle at 25% 25%,rgba(111,227,239,.45),transparent 45%),linear-gradient(200deg,#2c3196,#0b0d12 70%)",
  },
  {
    slug: "avatar-recruitment-crm-organize-hiring-and-candidate-management",
    category: "blog",
    art: "radial-gradient(circle at 70% 75%,rgba(181,189,255,.5),transparent 50%),linear-gradient(20deg,#0b0d12,#1c1f5e)",
  },
  {
    slug: "avatar-script-automation-reduce-repetitive-business-tasks",
    category: "blog",
    art: "radial-gradient(circle at 20% 20%,rgba(107,124,255,.6),transparent 48%),radial-gradient(circle at 85% 85%,rgba(111,227,239,.35),transparent 50%),#0c0e13",
  },
  {
    slug: "where-ai-fits-into-business-automation",
    category: "blog",
    art: "conic-gradient(from 40deg at 40% 55%,#0b0d12,rgba(107,124,255,.5),rgba(111,227,239,.4),#0b0d12)",
  },
  {
    slug: "business-automation-and-ai-adoption-faqs",
    category: "blog",
    art: "radial-gradient(circle at 50% -10%,rgba(181,189,255,.55),transparent 55%),#0c0e13",
  },
  {
    slug: "building-a-business-ready-for-tomorrow",
    category: "blog",
    art: "radial-gradient(circle at 30% 80%,rgba(111,227,239,.55),transparent 50%),linear-gradient(160deg,#2b2f8f,#0b0d12 75%)",
  },
];

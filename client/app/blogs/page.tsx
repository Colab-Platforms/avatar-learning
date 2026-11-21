import type { Metadata } from "next";
import { InsightsShell } from "@/components/ai-ecosystem/InsightsShell";
import { InsightsSection } from "@/components/ai-ecosystem/InsightsSection";

export const metadata: Metadata = {
  title: "Blogs | Avatar India",
  description:
    "Guides from businesses putting AI to work. Read Avatar India's blogs on AI adoption, business automation and operational efficiency.",
  alternates: { canonical: "https://www.avatarindia.com/blogs" },
};

/** AI Adoption Blogs listing (the old /insights URL redirects here, see next.config.ts). */
export default function BlogsPage() {
  return (
    <InsightsShell>
      {/* Top spacing comes from the section itself (--ad-page-top when showAll). */}
      <InsightsSection showAll />
    </InsightsShell>
  );
}

import type { Metadata } from "next";
import { InsightsShell } from "@/components/ai-ecosystem/InsightsShell";
import { InsightsSection } from "@/components/ai-ecosystem/InsightsSection";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "AI Adoption Blogs | Avatar AI",
  description:
    "Guides from businesses putting AI to work. Read Avatar India's blogs on AI adoption, business automation and operational efficiency.",
  path: "/blogs",
  adoption: true,
});

/** AI Adoption Blogs listing (the old /insights URL redirects here, see next.config.ts). */
export default function BlogsPage() {
  return (
    <InsightsShell>
      {/* Top spacing comes from the section itself (--ad-page-top when showAll). */}
      <InsightsSection showAll />
    </InsightsShell>
  );
}

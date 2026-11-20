import type { Metadata } from "next";
import { InsightsShell } from "@/components/ai-ecosystem/InsightsShell";
import { InsightsSection } from "@/components/ai-ecosystem/InsightsSection";

export const metadata: Metadata = {
  title: "Blogs and Case Studies | Avatar India",
  description:
    "Guides and stories from businesses putting AI to work. Read Avatar India's blogs and case studies on AI adoption, business automation and operational efficiency.",
  alternates: { canonical: "https://www.avatarindia.com/insights" },
};

export default function InsightsPage() {
  return (
    <InsightsShell>
      {/* Top spacing comes from the section itself (--ad-page-top when showAll). */}
      <InsightsSection showAll />
    </InsightsShell>
  );
}

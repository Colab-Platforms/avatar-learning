import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).
// Shared page: AI Adoption (dark) or Avatar Learning (light) view, same URL. board-of-directors overrides this.
export const metadata: Metadata = pageMetadata({
  title: "Investor Corner | Avatar India",
  description:
    "Statutory filings, quarterly financial statements, shareholding patterns and official announcements of Avatar Industries Limited (Avatar India).",
  path: "/investors",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

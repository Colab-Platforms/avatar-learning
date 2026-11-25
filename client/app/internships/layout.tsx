import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).

export const metadata: Metadata = pageMetadata({
  title: "AI Programs & Internships | Avatar Learning",
  description:
    "Explore Avatar Learning's AI programs and internships. Filter by level and duration to find hands-on training for the next era of technology.",
  path: "/internships",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

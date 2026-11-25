import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).
// Child pages override the canonical (assessment-counselling) or are noindex (success, see next.config.ts).
export const metadata: Metadata = pageMetadata({
  title: "Direct2Hire: Learn AI, Get Certified, Get Hired | Avatar Learning",
  description:
    "Direct2Hire by Avatar Learning is a structured AI career program with live training, industry certification and hiring support from partner companies.",
  path: "/direct2hire",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

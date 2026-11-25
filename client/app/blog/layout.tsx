import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).
// Articles set their own canonical in blog/[slug]/page.tsx.
export const metadata: Metadata = pageMetadata({
  title: "Blog | Avatar Learning",
  description:
    "Insights and perspectives from Avatar Learning on AI skills, careers, tools and the future of work.",
  path: "/blog",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

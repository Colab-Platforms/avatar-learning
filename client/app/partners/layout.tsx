import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).
// /partners/onboarding is noindex (next.config.ts).
export const metadata: Metadata = pageMetadata({
  title: "Partner With Us | Avatar Learning",
  description:
    "Partner with Avatar Learning to give your students or workforce industry-ready AI skills while earning attractive rewards through our partner program.",
  path: "/partners",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

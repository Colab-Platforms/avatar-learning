import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).

export const metadata: Metadata = pageMetadata({
  title: "Board of Directors & Committees | Avatar India",
  description:
    "Composition of the Board of Directors of Avatar Industries Limited, its committees and grievance redressal contact details.",
  path: "/investors/board-of-directors",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).

export const metadata: Metadata = pageMetadata({
  title: "Contact Us | Avatar India",
  description:
    "Questions, feedback or need help? Contact the Avatar India team about Avatar Learning courses, Direct2Hire and partnerships. We typically reply within 24-48 hours.",
  path: "/contact",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

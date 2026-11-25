import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).

export const metadata: Metadata = pageMetadata({
  title: "AI Tools Webinar | Avatar Learning",
  description:
    "Join Avatar Learning's live webinar to learn how AI tools can help you unlock better jobs, higher pay and job security.",
  path: "/webinar",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

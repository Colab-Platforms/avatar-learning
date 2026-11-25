import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).

export const metadata: Metadata = pageMetadata({
  title: "Direct2Hire Assessment & Career Counselling | Avatar Learning",
  description:
    "Take the Direct2Hire assessment and book career counselling with Avatar Learning to find the right AI career path for you.",
  path: "/direct2hire/assessment-counselling",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

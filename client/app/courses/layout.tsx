import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// SEO metadata only (the page is a client component, so it can't export metadata itself).
// Course detail pages set their own canonical in courses/[id]/layout.tsx.
export const metadata: Metadata = pageMetadata({
  title: "AI Courses | Avatar Learning",
  description:
    "Practical, self-paced AI courses from Avatar Learning. Pick a course, choose the plan that fits you and build job-ready AI skills with hands-on projects.",
  path: "/courses",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

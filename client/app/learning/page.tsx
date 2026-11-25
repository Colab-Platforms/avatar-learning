import { Navbar, Footer } from "@/components/layout";
import {
  Hero,
  QuizBanner,
  TimelineSection,
  Direct2HireBanner,
} from "@/components/sections";
import { D2HCoursesSection } from "@/app/direct2hire/D2HCoursesSection";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// Avatar Learning home (the brand homepage / is the AI Adoption Ecosystem).
export const metadata: Metadata = pageMetadata({
  title: "Avatar Learning | Live AI Courses & Career Programs",
  description:
    "Avatar Learning by Avatar India: learn AI skills in live weekend sessions, build portfolio-ready projects with industry experts and earn certificates with Direct2Hire placement support.",
  path: "/learning",
});

export default function Page() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <Direct2HireBanner />
      <QuizBanner />
      <TimelineSection />
      <D2HCoursesSection />
      <Footer />
    </main>
  );
}

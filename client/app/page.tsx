import { Navbar, Footer } from "@/components/layout";
import {
  Hero,
  QuizBanner,
  TimelineSection,
  Direct2HireBanner,
} from "@/components/sections";
import { D2HCoursesSection } from "@/app/direct2hire/D2HCoursesSection";

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

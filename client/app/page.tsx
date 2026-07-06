import { Navbar, Footer } from "@/components/layout";
import {
  Hero,
  QuizBanner,
  TimelineSection,
  CoursesSection,
  WhyChooseUs,
  AdvisorCTA,
  Direct2HireBanner,
} from "@/components/sections";

export default function Page() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <Direct2HireBanner />
      <QuizBanner />
      <TimelineSection />
      <CoursesSection />
      {/* <WhyChooseUs /> */}
      {/* <AdvisorCTA /> */}
      <Footer />
    </main>
  );
}

import { Navbar, Footer } from "@/components/layout";
import {
  Hero,
  QuizBanner,
  TimelineSection,
  WhyChooseUs,
  AdvisorCTA,
  Direct2HireBanner,
} from "@/components/sections";
import { Testimonials } from "@/components/home/Testimonials";
import { D2HCoursesSection } from "@/app/direct2hire/D2HCoursesSection";

export default function Page() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <Direct2HireBanner />
      {/* <Testimonials /> */}
      <QuizBanner />
      <TimelineSection />
      <D2HCoursesSection />
      {/* <WhyChooseUs /> */}
      {/* <AdvisorCTA /> */}
      <Footer />
    </main>
  );
}

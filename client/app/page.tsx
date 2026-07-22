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
import { Testimonials } from "@/components/home/Testimonials";

export default function Page() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <Direct2HireBanner />
      <Testimonials />
      <QuizBanner />
      <TimelineSection />
      <CoursesSection />
      {/* <WhyChooseUs /> */}
      {/* <AdvisorCTA /> */}
      <Footer />
    </main>
  );
}

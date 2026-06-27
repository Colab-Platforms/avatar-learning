import { Navbar, Footer } from "@/components/layout";
import {
  Hero,
  CoursesSection,
  WebinarsSection,
  QuizBanner,
  HackathonBanner,
  InternshipBanner,
  TimelineSection,
  WhyChooseUs,
  AdvisorCTA,
} from "@/components/sections";

export default function Page() {
  return (
    <main className="bg-ink-950">
      <Navbar />
      <Hero />
      <QuizBanner />
      {/* <InternshipBanner /> */}
      <TimelineSection />
      <CoursesSection />
      <WebinarsSection />
      <HackathonBanner />
      <WhyChooseUs />
      <AdvisorCTA />
      <Footer />
    </main>
  );
}

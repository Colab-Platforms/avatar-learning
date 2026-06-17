import { Navbar, Footer } from "@/components/layout";
import {
  Hero,
  CoursesSection,
  QuizBanner,
  HackathonBanner,
  WhyChooseUs,
  AdvisorCTA,
} from "@/components/sections";

export default function Page() {
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <CoursesSection />
      <QuizBanner />
      <HackathonBanner />
      <WhyChooseUs />
      <AdvisorCTA />
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemHero } from "@/components/ai-ecosystem/EcosystemHero";
import { WhyAvatarSection } from "@/components/ai-ecosystem/WhyAvatarSection";
import { ServicesSection } from "@/components/ai-ecosystem/ServicesSection";
import { WhoWeServeSection } from "@/components/ai-ecosystem/WhoWeServeSection";
import { PricingSection } from "@/components/ai-ecosystem/PricingSection";
import { AboutUsSection } from "@/components/ai-ecosystem/AboutUsSection";
import { CustomSolutionsSection } from "@/components/ai-ecosystem/CustomSolutionsSection";
import { BookDemoSection } from "@/components/ai-ecosystem/BookDemoSection";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";

export const metadata: Metadata = {
  title: "AI Adaption Ecosystem — Prototype | Avatar India",
  description:
    "Internal prototype: AI-powered solutions to manage, automate and scale modern business.",
  robots: { index: false, follow: false },
};

export default function AiAdaptionEcosystemPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05050a] text-white selection:bg-violet-500/30 selection:text-white">
      <EcosystemHeader />
      <main>
        <EcosystemHero />
        <WhyAvatarSection />
        <ServicesSection />
        <WhoWeServeSection />
        <PricingSection />
        <AboutUsSection />
        <CustomSolutionsSection />
        <BookDemoSection />
      </main>
      <EcosystemFooter />
    </div>
  );
}

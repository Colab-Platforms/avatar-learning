import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemHero } from "@/components/ai-ecosystem/EcosystemHero";
import { EcosystemOverviewSection } from "@/components/ai-ecosystem/EcosystemOverviewSection";
import { AIToolsMarketplaceSection } from "@/components/ai-ecosystem/AIToolsMarketplaceSection";
import { PathToAdoptionSection } from "@/components/ai-ecosystem/PathToAdoptionSection";
import { SkilledTalentSection } from "@/components/ai-ecosystem/SkilledTalentSection";
import { AboutSection } from "@/components/ai-ecosystem/AboutSection";
// import { InsightsSection } from "@/components/ai-ecosystem/InsightsSection";
import { FaqSection } from "@/components/ai-ecosystem/FaqSection";
import { BookDemoSection } from "@/components/ai-ecosystem/BookDemoSection";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { StickyCta } from "@/components/ai-ecosystem/StickyCta";
import { CursorGlow } from "@/components/ai-ecosystem/CursorGlow";

export const metadata: Metadata = {
  title: "AI Adoption Ecosystem | Avatar India",
  description:
    "We bring together AI solutions, technology and talent to help businesses identify opportunities, implement the right solutions and scale measurable outcomes.",
};

export default function Page() {
  return (
    <div
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        position: "relative",
        zIndex: 0,
        minHeight: "100vh",
        background: "#07080b",
        color: "#f4f6f8",
        overflowX: "clip",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <CursorGlow />
      <EcosystemHeader />
      <main>
        <EcosystemHero />
        <EcosystemOverviewSection />
        <AIToolsMarketplaceSection />
        <PathToAdoptionSection />
        <SkilledTalentSection />
        <AboutSection />
        {/* <InsightsSection /> */}
        <FaqSection />
        <BookDemoSection />
      </main>
      <EcosystemFooter />
      <StickyCta />
    </div>
  );
}

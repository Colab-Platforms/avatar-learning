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
import { InsightsSection } from "@/components/ai-ecosystem/InsightsSection";
import { FaqSection } from "@/components/ai-ecosystem/FaqSection";
import { BookDemoSection } from "@/components/ai-ecosystem/BookDemoSection";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { StickyCta } from "@/components/ai-ecosystem/StickyCta";

export const metadata: Metadata = {
  title: "AI Adoption Ecosystem | Avatar India",
  description:
    "Ready-to-use AI tools, hands-on training and support at every step. CRM, order tracking, AI content and team training for growing Indian businesses.",
};

export default function AiAdaptionEcosystemPage() {
  return (
    <div
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#07080b",
        color: "#f4f6f8",
        overflowX: "clip",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <EcosystemHeader />
      <main>
        <EcosystemHero />
        <EcosystemOverviewSection />
        <AIToolsMarketplaceSection />
        <PathToAdoptionSection />
        <SkilledTalentSection />
        <AboutSection />
        <InsightsSection />
        <FaqSection />
        <BookDemoSection />
      </main>
      <EcosystemFooter />
      <StickyCta />
    </div>
  );
}

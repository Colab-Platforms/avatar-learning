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
import { CursorGlow } from "@/components/ai-ecosystem/CursorGlow";
import { homeJsonLd, jsonLdScript, pageMetadata } from "@/lib/seo";

// Primary brand landing page: "Avatar AI" / "Avatar India" searches should land here.
export const metadata: Metadata = pageMetadata({
  title: "Avatar India | AI Learning, Business Automation & AI Solutions",
  description:
    "Explore Avatar India's AI learning programs, business automation tools, AI adoption ecosystem and recruitment solutions.",
  path: "/",
  keywords: [
    "Avatar India",
    "Avatar AI",
    "AI Learning",
    "Avatar AI Adoption Ecosystem",
    "AI Adoption",
    "AI Business Automation",
    "AI Solutions for Businesses",
    "Avatar CRM",
    "Avatar HRMS",
    "Avatar OMS",
  ],
  adoption: true,
});

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
      {/* Organization + WebSite structured data (brand identity for search engines). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(homeJsonLd())} />
      <CursorGlow />
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

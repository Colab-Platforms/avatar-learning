import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { AboutPageContent } from "@/components/ai-ecosystem/AboutPageContent";

export const metadata: Metadata = {
  title: "About Us | Avatar AI Adoption",
  description:
    "Avatar AI is the AI ecosystem of Avatar Industries Limited, helping Indian businesses adopt AI and automation with ready-to-use tools, hands-on team training and support at every step.",
  alternates: { canonical: "https://www.avatarindia.com/adoption/about" },
};

/** Dedicated AI Adoption About page: site navbar + About content + site footer (no homepage sections). */
export default function AdoptionAboutPage() {
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
      <EcosystemHeader />
      <main>
        <AboutPageContent />
      </main>
      <EcosystemFooter />
    </div>
  );
}

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { FaqSection } from "@/components/ai-ecosystem/FaqSection";

export const metadata: Metadata = {
  title: "FAQ | Avatar AI Adoption",
  description:
    "Answers to common questions about Avatar AI Adoption: getting started, pricing, setup, team training, data security and connecting AI tools to your business.",
  alternates: { canonical: "https://www.avatarindia.com/faq" },
};

/** Dedicated AI Adoption FAQ page (the navbar's FAQ link): site navbar + the same FAQ section as the homepage + site footer.
 * Old /#faq links are sent here by EcosystemHeader. */
export default function FaqRoute() {
  return (
    <div
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ position: "relative", zIndex: 0, minHeight: "100vh", background: "#07080b", color: "#f4f6f8", overflowX: "clip", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      <EcosystemHeader />
      <main>
        <FaqSection />
      </main>
      <EcosystemFooter />
    </div>
  );
}

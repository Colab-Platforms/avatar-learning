import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { AboutPageContent } from "@/components/ai-ecosystem/AboutPageContent";
import { pageMetadata } from "@/lib/seo";

// /about is the AI Adoption About page (was /adoption/about, which now 301-redirects here).
// Avatar Learning's About page moved to /learning/about.
export const metadata: Metadata = pageMetadata({
  title: "About Avatar AI | AI Adoption Ecosystem by Avatar India",
  description:
    "Avatar AI is the AI Adoption Ecosystem of Avatar Industries Limited, helping Indian businesses adopt AI and automation with ready-to-use tools, hands-on team training and support at every step.",
  path: "/about",
  adoption: true,
});

/** AI Adoption About page: site navbar + About content + site footer (no homepage sections). */
export default function AboutPage() {
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

import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EcosystemHeader } from "@/components/ai-ecosystem/EcosystemHeader";
import { EcosystemFooter } from "@/components/ai-ecosystem/EcosystemFooter";
import { ToolsPage } from "@/components/ai-ecosystem/ToolsPage";
import { ToolsLoaderGate } from "@/components/ai-ecosystem/ToolsPageLoader";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "AI Business Tools: CRM, HRMS, OMS & More | Avatar AI",
  description: "One ecosystem, endless powerful solutions: CRM, OMS, Script Automation, LMS, Recruitment CRM, HRMS, IMS and Custom Tools for growing businesses.",
  path: "/tools",
  adoption: true,
});

/** Dedicated AI Adoption Tools page: site navbar + tools showcase + site footer (no homepage sections).
 * The "AVATAR AI" intro loader (ToolsLoaderGate) exists only on this route. */
export default function ToolsRoute() {
  return (
    <ToolsLoaderGate>
      <div
        data-tools-content=""
        className={`${GeistSans.variable} ${GeistMono.variable}`}
        style={{ position: "relative", zIndex: 0, minHeight: "100vh", background: "#07080b", color: "#f4f6f8", overflowX: "clip", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        <EcosystemHeader />
        <main>
          <ToolsPage />
        </main>
        <EcosystemFooter />
      </div>
    </ToolsLoaderGate>
  );
}

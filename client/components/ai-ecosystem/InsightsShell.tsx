import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EcosystemHeader } from "./EcosystemHeader";
import { EcosystemFooter } from "./EcosystemFooter";
import { CursorGlow } from "./CursorGlow";

/** Same dark page frame as the AI Adoption Ecosystem home page, shared by the Insights routes. */
export function InsightsShell({ children }: { children: React.ReactNode }) {
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
      <main>{children}</main>
      <EcosystemFooter />
    </div>
  );
}

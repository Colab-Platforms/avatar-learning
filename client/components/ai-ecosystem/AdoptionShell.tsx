import Image from "next/image";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";

/** Dark page shell (logo header + centred main) shared by the AI Adoption account pages and /thank-you. */
export function AdoptionShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={GeistSans.variable}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#07080b", color: "#f4f6f8", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      <header style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" aria-label="Avatar home" style={{ display: "flex", alignItems: "center" }}>
            <Image src="/landingpage-images/Avatar_logo_Light.svg" alt="Avatar" width={110} height={26} style={{ height: 26, width: "auto", display: "block" }} priority />
          </Link>
          <Link href="/" className="text-[#a3abb5] transition-colors hover:text-white focus-visible:text-white" style={{ fontSize: 14, textDecoration: "none" }}>
            ← Back to home
          </Link>
        </div>
      </header>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(32px,6vw,72px) 16px" }}>{children}</main>
    </div>
  );
}

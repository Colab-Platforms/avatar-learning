import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const metadata: Metadata = {
  title: "Login | Avatar AI Adoption",
  description: "Sign in or create an account to get started.",
  robots: { index: false },
};

/** Dark shell for the AI Adoption sign-in pages (separate from the learning platform's /login). */
export default function AdoptionAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(32px,6vw,72px) 16px" }}>
          <div style={{ width: "100%", maxWidth: 440, borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}>
            <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(24px,5vw,40px)" }}>{children}</div>
          </div>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
}

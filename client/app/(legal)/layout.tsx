import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — Avatar India",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 relative">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,60,120,0.25) 0%, transparent 65%), " +
            "radial-gradient(ellipse 50% 40% at 80% 90%, rgba(0,80,160,0.12) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 dot-grid-dark opacity-40" aria-hidden />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center gap-4">
          <Link href="/" aria-label="Avatar India home" className="hover:opacity-80 transition-opacity duration-200 shrink-0">
            <Image
              src="/landingpage-images/Avatar_logo_Light.svg"
              alt="Avatar India"
              width={100}
              height={28}
              className="h-6 w-auto"
              priority
            />
          </Link>
          <span className="text-white/20 text-lg font-light">/</span>
          <span className="text-white/40 text-sm">Legal</span>
        </div>
      </header>

      {/* Content */}
      <main className="relative mx-auto max-w-4xl px-6 py-12 pb-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">© 2026 AVATAR India. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy-policy" className="text-white/35 hover:text-brand-400 transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="text-white/35 hover:text-brand-400 transition-colors duration-200">Terms &amp; Conditions</Link>
            <Link href="/" className="text-white/35 hover:text-brand-400 transition-colors duration-200">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — Avatar India",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 relative text-slate-900">
      {/* Background Ambient Glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 65%), " +
            "radial-gradient(ellipse 50% 40% at 80% 90%, rgba(99,102,241,0.04) 0%, transparent 55%)",
        }}
        aria-hidden
      />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center gap-4">
          <Link href="/" aria-label="Avatar India home" className="hover:opacity-80 transition-opacity duration-200 shrink-0">
            <Image
              src="/landingpage-images/Avatar_dark_logo.png"
              alt="Avatar India"
              width={140}
              height={38}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <span className="text-slate-300 text-lg font-light">/</span>
          <span className="text-slate-600 text-sm font-semibold">Legal</span>
        </div>
      </header>

      {/* Content */}
      <main className="relative mx-auto max-w-4xl px-6 py-12 pb-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8">
        <div className="mx-auto max-w-4xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">© 2026 AVATAR India. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link href="/privacy-policy" className="text-slate-600 hover:text-brand-600 transition-colors duration-200">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="text-slate-600 hover:text-brand-600 transition-colors duration-200">Terms &amp; Conditions</Link>
            <Link href="/" className="text-slate-600 hover:text-brand-600 transition-colors duration-200">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

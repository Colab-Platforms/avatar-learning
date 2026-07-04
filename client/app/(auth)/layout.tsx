import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth — Avatar India",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">

      {/* Subtle ambient layers */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 65%), " +
            "radial-gradient(ellipse 55% 45% at 15% 85%, rgba(99,102,241,0.05) 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 40% at 85% 90%, rgba(59,130,246,0.04) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-[0.08]" aria-hidden />

      {/* ── Top bar ── */}
      <header className="container-x h-16 flex items-center shrink-0 relative z-10">
        <Link href="/" aria-label="Avatar India home" className="hover:opacity-75 transition-opacity duration-250">
          <Image
            src="/landingpage-images/Avatar_logo_Light.svg"
            alt="Avatar India"
            width={119}
            height={32}
            className="h-7 w-auto invert"
            priority
          />
        </Link>
      </header>

      {/* ── Card area ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="relative w-full max-w-md">

          {/* Soft glow ring behind card */}
          <div
            className="absolute -inset-3 rounded-[24px] opacity-60"
            style={{
              background: "radial-gradient(ellipse at center, rgba(59,130,246,0.10) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
            aria-hidden
          />

          {/* Card */}
          <div
            className="relative rounded-2xl px-8 py-10 border border-slate-200"
            style={{
              background: "#FFFFFF",
              boxShadow:
                "0 4px 6px rgba(0,0,0,0.04), " +
                "0 12px 40px rgba(0,0,0,0.07), " +
                "0 0 0 1px rgba(59,130,246,0.06)",
            }}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

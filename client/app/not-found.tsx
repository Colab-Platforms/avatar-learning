"use client";

import Link from "next/link";
import { ArrowLeft, Home, Search, Compass } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const QUICK_LINKS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Courses", href: "/courses", icon: Compass },
  { label: "About", href: "/about", icon: Search },
  { label: "Contact", href: "/contact", icon: ArrowLeft },
];

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main
        className="relative min-h-screen text-white overflow-hidden flex flex-col"
        style={{
          background:
            "linear-gradient(160deg,#060D1A 0%,#091220 25%,#060D1A 55%,#091525 80%,#060D1A 100%)",
        }}
      >
        {/* ── Ambient background ── */}
        <div
          className="pointer-events-none fixed inset-0 dot-grid-dark opacity-20"
          aria-hidden
        />

        {/* Red / warm top glow for error feel */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-[0.09]"
          style={{
            background:
              "radial-gradient(ellipse at top,rgba(255,80,80,0.6) 0%,rgba(0,200,255,0.3) 60%,transparent 75%)",
            filter: "blur(70px)",
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none fixed bottom-0 right-0 w-[600px] h-[400px] opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse at bottom right,rgba(0,128,255,0.6) 0%,transparent 65%)",
            filter: "blur(80px)",
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none fixed inset-0 line-grid opacity-12"
          aria-hidden
        />

        {/* ── Main content ── */}
        <div className="relative flex-1 flex items-center justify-center px-4 py-24">
          <div className="w-full max-w-2xl mx-auto text-center">
            {/* Giant 404 */}
            <div className="relative mb-6 select-none">
              <span
                className="block text-[120px] sm:text-[160px] lg:text-[200px] font-black leading-none tracking-tight"
                style={{
                  background:
                    "linear-gradient(180deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.02) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: "drop-shadow(0 0 40px rgba(0,200,255,0.08))",
                }}
                aria-hidden
              >
                404
              </span>

              {/* Overlay text with gradient */}
              <span
                className="absolute inset-0 flex items-center justify-center text-[120px] sm:text-[160px] lg:text-[200px] font-black leading-none tracking-tight text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg,rgba(0,200,255,0.30) 0%,rgba(0,128,255,0.18) 40%,rgba(255,80,80,0.15) 100%)",
                  animation: "flicker 6s ease-in-out infinite",
                }}
              >
                404
              </span>
            </div>

            {/* Label */}
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/8 px-4 py-1.5 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-red-300/80">
                Page Not Found
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Oops — this page doesn&apos;t exist
            </h1>

            <p className="text-white/38 text-[15px] sm:text-[16px] leading-relaxed max-w-md mx-auto mb-10">
              The URL might be misspelled, the page may have moved, or it never
              existed. Let&apos;s get you back on track.
            </p>

            {/* Quick links grid */}

            {/* Primary CTA */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5
                         text-[14px] font-semibold text-ink-950
                         hover:bg-brand-400 hover:scale-[1.04]
                         shadow-[0_2px_16px_rgba(0,200,255,0.40)]
                         hover:shadow-[0_4px_32px_rgba(0,200,255,0.65)]
                         transition-all duration-250"
            >
              <Home className="h-4 w-4" />
              Go Back Home
            </Link>

            <p className="mt-7 text-[12px] text-white/18">
              Error 404 · Avatar Platform
            </p>
          </div>
        </div>

        <style>{`
          @keyframes flicker {
            0%, 100% { opacity: 1; }
            48%       { opacity: 1; }
            50%       { opacity: 0.7; }
            52%       { opacity: 1; }
            88%       { opacity: 1; }
            90%       { opacity: 0.75; }
            92%       { opacity: 1; }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}

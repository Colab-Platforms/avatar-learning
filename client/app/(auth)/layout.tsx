import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth — Avatar India",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col relative overflow-hidden">

      {/* ── Deep space background layers ── */}
      {/* Base radial nebula */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,80,140,0.35) 0%, transparent 65%), " +
            "radial-gradient(ellipse 60% 50% at 20% 80%, rgba(0,40,100,0.25) 0%, transparent 60%), " +
            "radial-gradient(ellipse 50% 40% at 80% 90%, rgba(0,100,180,0.18) 0%, transparent 55%)",
        }}
        aria-hidden
      />
      {/* Animated mesh drift */}
      <div className="pointer-events-none fixed inset-0 mesh-gradient" aria-hidden />
      {/* Dot grid overlay */}
      <div className="pointer-events-none fixed inset-0 dot-grid-dark opacity-60" aria-hidden />
      {/* Cyan top glow */}
      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px]"
        style={{
          background: "radial-gradient(ellipse at top, rgba(0,200,255,0.13) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
        aria-hidden
      />
      {/* Bottom corner accent glows */}
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[300px]"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(0,128,255,0.10) 0%, transparent 65%)",
          filter: "blur(50px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-[400px] h-[300px]"
        style={{
          background: "radial-gradient(ellipse at bottom right, rgba(0,200,255,0.08) 0%, transparent 65%)",
          filter: "blur(50px)",
        }}
        aria-hidden
      />

      {/* ── Top bar ── */}
      <header className="container-x h-16 flex items-center shrink-0 relative z-10">
        <Link href="/" aria-label="Avatar India home" className="hover:opacity-80 transition-opacity duration-250">
          <Image
            src="/landingpage-images/Avatar_logo_Light.svg"
            alt="Avatar India"
            width={119}
            height={32}
            className="h-7 w-auto"
            priority
          />
        </Link>
      </header>

      {/* ── Card area ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="relative w-full max-w-md">

          {/* Storm lightning border — spinning conic gradient wrapper */}
          <div
            className="absolute -inset-[2px] rounded-[18px]"
            style={{
              background:
                "conic-gradient(from var(--angle) at 50% 50%, " +
                "transparent 0deg, " +
                "rgba(0,200,255,0.9) 30deg, " +
                "rgba(255,255,255,1) 50deg, " +
                "rgba(56,217,255,0.8) 70deg, " +
                "rgba(0,128,255,0.7) 110deg, " +
                "transparent 160deg, " +
                "rgba(0,200,255,0.5) 200deg, " +
                "rgba(255,255,255,0.7) 215deg, " +
                "rgba(0,200,255,0.4) 230deg, " +
                "transparent 280deg, " +
                "rgba(56,217,255,0.6) 320deg, " +
                "rgba(255,255,255,0.5) 335deg, " +
                "transparent 360deg" +
                ")",
              animation: "border-spin 2.8s linear infinite",
            }}
            aria-hidden
          />
          {/* Second slower bolt — offset phase for depth */}
          <div
            className="absolute -inset-[2px] rounded-[18px] opacity-50"
            style={{
              background:
                "conic-gradient(from calc(var(--angle) + 180deg) at 50% 50%, " +
                "transparent 0deg, " +
                "rgba(0,128,255,0.8) 25deg, " +
                "rgba(255,255,255,0.9) 40deg, " +
                "rgba(0,200,255,0.6) 60deg, " +
                "transparent 120deg, " +
                "rgba(0,200,255,0.5) 200deg, " +
                "rgba(255,255,255,0.6) 215deg, " +
                "transparent 270deg, " +
                "transparent 360deg" +
                ")",
              animation: "border-spin 4.2s linear infinite",
            }}
            aria-hidden
          />
          {/* Soft glow bloom behind the border */}
          <div
            className="absolute -inset-4 rounded-[28px] opacity-30"
            style={{
              background:
                "conic-gradient(from var(--angle) at 50% 50%, " +
                "transparent 0deg, rgba(0,200,255,0.4) 50deg, transparent 160deg, " +
                "rgba(0,200,255,0.3) 210deg, transparent 360deg)",
              filter: "blur(18px)",
              animation: "border-spin 2.8s linear infinite",
            }}
            aria-hidden
          />

          {/* Glass card */}
          <div
            className="relative rounded-2xl px-8 py-10 backdrop-blur-md"
            style={{
              background:
                "linear-gradient(145deg, rgba(13,23,39,0.92) 0%, rgba(8,15,28,0.96) 50%, rgba(5,11,20,0.98) 100%)",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.7), " +
                "inset 0 1px 0 rgba(0,200,255,0.08), " +
                "inset 0 -1px 0 rgba(0,128,255,0.05)",
            }}
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

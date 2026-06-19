import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth — Avatar India",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      {/* Top bar */}
      <header className="container-x h-16 flex items-center shrink-0">
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

      {/* Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {/* Ambient glow */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] opacity-[0.07]"
          style={{
            background: "radial-gradient(ellipse at top, #00C8FF 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
          aria-hidden
        />

        <div className="relative w-full max-w-md">
          {/* Glass card */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm px-8 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

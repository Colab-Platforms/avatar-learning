import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Clock, Sparkles, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const { feature = "This Feature" } = use(searchParams);

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
        {/* ── Ambient layers ── */}
        <div className="pointer-events-none fixed inset-0 dot-grid-dark opacity-20" aria-hidden />
        <div className="pointer-events-none fixed inset-0 line-grid opacity-[0.12]" aria-hidden />

        {/* Top center glow */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[560px] opacity-[0.14]"
          style={{
            background: "radial-gradient(ellipse at top,rgba(0,200,255,0.55) 0%,transparent 65%)",
            filter: "blur(72px)",
          }}
          aria-hidden
        />
        {/* Bottom-left glow */}
        <div
          className="pointer-events-none fixed bottom-0 left-0 w-[500px] h-[400px] opacity-[0.07]"
          style={{
            background: "radial-gradient(ellipse at bottom left,rgba(0,128,255,0.6) 0%,transparent 65%)",
            filter: "blur(80px)",
          }}
          aria-hidden
        />

        {/* ── Hero ── */}
        <div className="relative flex-1 flex items-center justify-center px-4 py-32">
          <div className="w-full max-w-3xl mx-auto">

            {/* ── Icon + rings ── */}
            <div className="flex justify-center mb-12">
              <div className="relative flex items-center justify-center">
                {/* Outer rings */}
                <span className="absolute h-36 w-36 rounded-full border border-brand-500/8 animate-ping opacity-25" />
                <span className="absolute h-28 w-28 rounded-full border border-brand-500/14 animate-ping opacity-35" style={{ animationDelay: "0.5s", animationDuration: "2s" }} />
                <span className="absolute h-20 w-20 rounded-full border border-brand-500/20" />

                {/* Icon box */}
                <div
                  className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10"
                  style={{ boxShadow: "0 0 48px rgba(0,200,255,0.14), inset 0 1px 0 rgba(255,255,255,0.07)" }}
                >
                  <Clock className="h-7 w-7 text-brand-400" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 border border-orange-400/35">
                    <Sparkles className="h-2.5 w-2.5 text-orange-300" />
                  </span>
                </div>
              </div>
            </div>

            {/* ── Text ── */}
            <div className="text-center mb-12">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/22 bg-brand-500/8 px-4 py-1.5 mb-7">
                <span className="flex h-1.5 w-1.5 rounded-full bg-brand-400">
                  <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-brand-400 opacity-75" />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.20em] uppercase text-brand-300/80">
                  Coming Soon
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.08] text-white mb-5">
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(90deg,#00C8FF 0%,#60DFFF 50%,#00C8FF 100%)", backgroundSize: "200% auto", animation: "gradient-pan 5s linear infinite" }}>
                  {feature}
                </span>{" "}
                is on its way
              </h1>

              <p className="text-white/38 text-[16px] sm:text-[17px] leading-relaxed max-w-xl mx-auto">
                We&apos;re crafting something exceptional. This section is currently
                under active development and will be available soon.
              </p>
            </div>

            {/* ── Progress card ── */}
            <div
              className="mx-auto max-w-xl rounded-3xl border border-white/6 p-7 sm:p-9 mb-10"
              style={{
                background: "linear-gradient(145deg,rgba(13,23,39,0.85) 0%,rgba(9,18,32,0.95) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 24px 56px -12px rgba(0,0,0,0.5)",
              }}
            >
              {/* Stage row */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-[13px] font-semibold text-white/70">Build Progress</p>
                <span className="text-[13px] font-semibold text-brand-400">68%</span>
              </div>

              {/* Bar */}
              <div className="h-1.5 w-full rounded-full bg-white/6 overflow-hidden mb-7">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "68%",
                    background: "linear-gradient(90deg,#0080FF 0%,#00C8FF 100%)",
                    boxShadow: "0 0 12px rgba(0,200,255,0.5)",
                    animation: "progress-pulse 2.5s ease-in-out infinite alternate",
                  }}
                />
              </div>

              {/* Stage pills */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Design", done: true },
                  { label: "Development", done: true },
                  { label: "Launch", done: false },
                ].map(({ label, done }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-medium
                      ${done
                        ? "border-brand-500/25 bg-brand-500/8 text-brand-300"
                        : "border-white/6 bg-white/[0.025] text-white/30"
                      }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${done ? "bg-brand-400" : "bg-white/20"}`} />
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                <p className="text-[12px] text-white/25">Expected — Q3 2026</p>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-orange-400/70 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400" />
                  </span>
                  <p className="text-[12px] text-orange-300/60 font-medium">Active development</p>
                </div>
              </div>
            </div>

            {/* ── CTAs ── */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3
                           text-[14px] font-semibold text-ink-950
                           hover:bg-brand-400 hover:scale-[1.04]
                           shadow-[0_2px_16px_rgba(0,200,255,0.40)]
                           hover:shadow-[0_4px_32px_rgba(0,200,255,0.65)]
                           transition-all duration-250"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/12
                           px-6 py-3 text-[14px] font-medium text-white/55
                           hover:border-brand-500/40 hover:text-brand-300
                           hover:bg-brand-500/6 transition-all duration-250"
              >
                <Bell className="h-4 w-4" />
                Get Notified
                <ArrowRight className="h-3.5 w-3.5 opacity-60" />
              </Link>
            </div>

          </div>
        </div>

        <style>{`
          @keyframes gradient-pan {
            0%   { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
          @keyframes progress-pulse {
            from { box-shadow: 0 0 8px rgba(0,200,255,0.35); }
            to   { box-shadow: 0 0 20px rgba(0,200,255,0.75); }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}

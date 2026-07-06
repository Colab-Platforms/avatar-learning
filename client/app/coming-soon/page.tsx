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
        className="relative min-h-screen text-slate-800 overflow-hidden flex flex-col"
        style={{
          background:
            "#FFFFFF",
        }}
      >
        {/* Ambient dot grid */}
        <div className="pointer-events-none fixed inset-0 dot-grid opacity-[0.10]" aria-hidden />

        {/* Top center glow */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-40"
          style={{
            background: "radial-gradient(ellipse at top, rgba(99,102,241,0.10) 0%, transparent 65%)",
            filter: "blur(72px)",
          }}
          aria-hidden
        />
        {/* Bottom-right glow */}
        <div
          className="pointer-events-none fixed bottom-0 right-0 w-[500px] h-[400px] opacity-30"
          style={{
            background: "radial-gradient(ellipse at bottom right, rgba(59,130,246,0.12) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
          aria-hidden
        />

        {/* ── Hero ── */}
        <div className="relative flex-1 flex items-center justify-center px-4 py-32">
          <div className="w-full max-w-3xl mx-auto">

            {/* Icon + rings */}
            <div className="flex justify-center mb-12">
              <div className="relative flex items-center justify-center">
                <span className="absolute h-36 w-36 rounded-full border border-blue-400/15 animate-ping opacity-25" />
                <span className="absolute h-28 w-28 rounded-full border border-indigo-400/20 animate-ping opacity-30" style={{ animationDelay: "0.5s", animationDuration: "2s" }} />
                <span className="absolute h-20 w-20 rounded-full border border-blue-300/25" />

                <div
                  className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50"
                  style={{ boxShadow: "0 0 32px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.8)" }}
                >
                  <Clock className="h-7 w-7 text-blue-600" strokeWidth={1.5} />
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 border border-amber-300/50">
                    <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                  </span>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 mb-7">
                <span className="relative flex h-1.5 w-1.5 rounded-full bg-blue-500">
                  <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-blue-400 opacity-75" />
                </span>
                <span className="text-[11px] font-semibold tracking-[0.20em] uppercase text-blue-600">
                  Coming Soon
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.08] text-slate-900 mb-5">
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #4F46E5 0%, #2563EB 50%, #6366F1 100%)",
                    backgroundSize: "200% auto",
                    animation: "gradient-pan 5s linear infinite",
                  }}
                >
                  {feature}
                </span>{" "}
                is on its way
              </h1>

              <p className="text-slate-500 text-[16px] sm:text-[17px] leading-relaxed max-w-xl mx-auto">
                We&apos;re crafting something exceptional. This section is currently
                under active development and will be available soon.
              </p>
            </div>

            {/* Progress card */}
            <div
              className="mx-auto max-w-xl rounded-3xl border border-slate-200 p-7 sm:p-9 mb-10"
              style={{
                background: "#FFFFFF",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-[13px] font-semibold text-slate-600">Build Progress</p>
                <span className="text-[13px] font-semibold text-blue-600">68%</span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden mb-7">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "68%",
                    background: "linear-gradient(90deg, #4F46E5 0%, #2563EB 100%)",
                    boxShadow: "0 0 10px rgba(99,102,241,0.4)",
                    animation: "progress-pulse 2.5s ease-in-out infinite alternate",
                  }}
                />
              </div>

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
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${done ? "bg-blue-500" : "bg-slate-300"}`} />
                    {label}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[12px] text-slate-400">Expected — Q3 2026</p>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                  </span>
                  <p className="text-[12px] text-amber-600 font-medium">Active development</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3
                           text-[14px] font-semibold text-white
                           hover:brightness-110 hover:scale-[1.04]
                           shadow-md transition-all duration-250"
                style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200
                           px-6 py-3 text-[14px] font-medium text-slate-600
                           hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50
                           transition-all duration-250"
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
            from { box-shadow: 0 0 6px rgba(99,102,241,0.3); }
            to   { box-shadow: 0 0 18px rgba(99,102,241,0.6); }
          }
        `}</style>
      </main>

      <Footer />
    </>
  );
}

import { Trophy, Calendar, ArrowUpRight, Flame, Zap, Lock } from "lucide-react";
import Image from "next/image";
import { Button, ScrollReveal } from "@/components/ui";
import { HACKATHON } from "@/data/hackathon";

export function HackathonBanner() {
  return (
    <section className="relative bg-ink-900 text-white py-16 overflow-hidden">
      {/* ── Background ── */}
      <div
        className="orb w-200 h-200 -top-80 -right-80 opacity-[0.08]"
        style={{
          background: "radial-gradient(circle, #00C8FF 0%, transparent 60%)",
          filter: "blur(110px)",
        }}
      />
      <div
        className="orb w-150 h-150 bottom-0 -left-32 opacity-[0.10]"
        style={{
          background: "radial-gradient(circle, #0080FF 0%, transparent 60%)",
          filter: "blur(90px)",
          animationDelay: "3s",
        }}
      />
      <div className="absolute inset-0 line-grid" />
      <div className="absolute inset-0 noise-overlay opacity-25 pointer-events-none" />

      {/* Top / bottom dividers */}
      <div className="absolute top-0 inset-x-0 divider-glow" />
      <div className="absolute bottom-0 inset-x-0 divider-glow" />

      <div className="relative container-x">
        <div className="grid lg:grid-cols-[1fr_420px] gap-12 xl:gap-20 items-center">
          {/* ── Left ── */}
          <div>
            <ScrollReveal animation="fade-up">
              <div className="pill-tag border-orange-400/30 bg-orange-400/10 text-orange-300">
                <Flame className="h-3.5 w-3.5 text-orange-400" />
                {HACKATHON.eyebrow}
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={90}>
              <h3 className="h-display mt-7 max-w-2xl">
                {HACKATHON.title.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {i === arr.length - 1 ? (
                      <span className="text-gradient-white">{line}</span>
                    ) : (
                      <span>{line}</span>
                    )}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h3>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={170}>
              <p className="mt-6 max-w-lg text-white/40 text-[15px] leading-[1.85]">
                {HACKATHON.description}
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={310}>
              {/* Coming Soon button — disabled, styled distinctively */}
              <div className="mt-9 inline-flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  disabled
                  className="relative group inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white/40 text-sm font-semibold tracking-wide cursor-not-allowed select-none overflow-hidden transition-all duration-300"
                  aria-label="Coming soon — not available yet"
                >
                  {/* shimmer stripe */}
                  <span
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent
                               animate-[shimmer_2.8s_ease-in-out_infinite]"
                  />
                  {/* lock badge */}
                  <span className="relative flex items-center justify-center h-7 w-7 rounded-lg bg-white/8 border border-white/10">
                    <Lock className="h-3.5 w-3.5 text-white/35" />
                  </span>
                  <span className="relative">{HACKATHON.ctaLabel}</span>
                  {/* pulsing dot */}
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400/50 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400/60" />
                  </span>
                </button>

                <p className="text-[12px] text-white/25 font-medium">
                  Registrations open soon
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* ── Right: Web Room image card ── */}
          <ScrollReveal animation="fade-left" delay={200} duration={750}>
            <div className="relative group">
              {/* Glow halo behind image */}
              <div
                className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, rgba(0,200,255,0.18) 0%, transparent 70%)",
                  filter: "blur(12px)",
                }}
              />

              <div
                className="relative rounded-3xl border border-white/8 overflow-hidden
                            bg-ink-800/80 backdrop-blur-sm
                            hover:border-brand-500/25 transition-all duration-500"
                style={{
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 60px -15px rgba(0,0,0,0.55)",
                }}
              >
                {/* Top label strip */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-md bg-brand-500/15 border border-brand-500/20">
                      <Zap className="h-3 w-3 text-brand-400" />
                    </span>
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/35">
                      Web Room
                    </p>
                  </div>
                  {/* traffic light dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/50" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/50" />
                  </div>
                </div>

                {/* Image */}
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/10]">
                  <Image
                    src="/neon.jpg"
                    alt="Web Room — Hackathon workspace"
                    fill
                    className="object-cover transition-transform duration-700 "
                    sizes="(max-width: 768px) 100vw, 420px"
                    priority
                  />
                  {/* overlay gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent 50%, rgba(10,14,23,0.75) 100%)",
                    }}
                  />
                </div>

                {/* Bottom strip */}
                <div className="px-5 py-3.5 flex items-center justify-between border-t border-white/5 bg-white/[0.015]">
                  <p className="text-[11px] text-white/28 font-medium">
                    Limited spots available
                  </p>
                  <div className="flex items-center gap-1.5">
                    {/* <span className="flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-orange-400/60 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-400/70" />
                    </span> */}
                    {/* <p className="text-[11px] text-orange-300/60 font-medium tracking-wide">
                      Coming {HACKATHON.date}
                    </p> */}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}60%,100%{transform:translateX(200%)}}`}</style>
    </section>
  );
}

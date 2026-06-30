import { Trophy, Calendar, ArrowUpRight, Flame, Zap } from "lucide-react";
import { Button, ScrollReveal } from "@/components/ui";
import { HACKATHON } from "@/data/hackathon";

export function HackathonBanner() {
  return (
    <section className="relative bg-ink-900 text-white py-16 overflow-hidden">
      {/* ── Background ── */}
      {/* Primary orb — steel blue */}
      <div
        className="orb w-200 h-200 -top-80 -right-80 opacity-[0.08]"
        style={{
          background: "radial-gradient(circle, #00C8FF 0%, transparent 60%)",
          filter: "blur(110px)",
        }}
      />
      {/* Secondary orb — electric blue */}
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
        <div className="grid lg:grid-cols-[1fr_340px] gap-20 items-start">
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

            {/* <ScrollReveal animation="fade-up" delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <div
                  className="inline-flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white/55
                                hover:border-white/14 hover:bg-white/6 hover:text-white transition-all duration-300 cursor-default"
                >
                  <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-brand-500/15 border border-brand-500/20">
                    <Calendar className="h-3 w-3 text-brand-400" />
                  </span>
                  {HACKATHON.date}
                </div>
                <div
                  className="inline-flex items-center gap-2.5 rounded-xl border border-brand-500/20 bg-brand-500/8 px-4 py-2.5 text-sm text-brand-300
                                hover:border-brand-500/35 hover:bg-brand-500/12 transition-all duration-300 cursor-default"
                >
                  <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-brand-500/20 border border-brand-500/28">
                    <Trophy className="h-3 w-3 text-brand-400" />
                  </span>
                  {HACKATHON.prizeText}
                </div>
              </div>
            </ScrollReveal> */}

            <ScrollReveal animation="fade-up" delay={310}>
              <Button
                variant="primary"
                size="md"
                className="mt-9 btn-glow group/btn"
              >
                {HACKATHON.ctaLabel}
                <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-250" />
              </Button>
            </ScrollReveal>
          </div>

          {/* ── Right: countdown card ── */}
          <ScrollReveal animation="fade-left" delay={200} duration={750}>
            <div
              className="rounded-3xl border border-white/6 bg-ink-800/80 p-7 backdrop-blur-sm
                          hover:border-brand-500/20 transition-all duration-500"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.04), 0 30px 60px -15px rgba(0,0,0,0.5)",
              }}
            >
              {/* Card header */}
              <div className="flex items-center gap-2 mb-6">
                <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-brand-500/15 border border-brand-500/20">
                  <Zap className="h-3.5 w-3.5 text-brand-400" />
                </span>
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/30">
                  Starts In
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {HACKATHON.countdown.map((item, i) => (
                  <div
                    key={item.label}
                    className="group/cnt relative rounded-2xl border border-white/6 bg-ink-900/80 p-4 text-center overflow-hidden
                                hover:border-brand-500/25 hover:bg-brand-500/6 transition-all duration-350"
                    style={{ transitionDelay: `${i * 40}ms` }}
                  >
                    {/* Inner hover glow */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover/cnt:opacity-100 transition-opacity duration-400 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 50% 0%, rgba(0,200,255,0.10) 0%, transparent 70%)",
                      }}
                    />
                    <div className="relative">
                      <div className="text-[32px] font-semibold tracking-tight text-shimmer tabular-nums leading-none">
                        {item.value}
                      </div>
                      <div className="mt-2 text-[10px] uppercase tracking-[0.16em] text-white/28">
                        {item.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="my-5 divider-glow" />

              <p className="text-center text-[12px] text-white/28 font-medium">
                Limited spots available
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

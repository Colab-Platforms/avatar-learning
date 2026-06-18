import Image from "next/image";
import { Button, ScrollReveal } from "@/components/ui";
import { QUIZ_BANNER } from "@/data/quiz";
import { Brain, ArrowRight, Sparkles } from "lucide-react";

export function QuizBanner() {
  return (
    <section className="relative bg-ink-950 pb-28 overflow-hidden">

      {/* Top divider */}
      <div className="absolute top-0 inset-x-0 divider-glow" />

      <div className="container-x">
        <ScrollReveal animation="zoom-in" duration={800} threshold={0.08}>
          <div
            className="group/quiz relative overflow-hidden rounded-3xl bg-ink-800 text-white cursor-default
                        border border-white/6 transition-all duration-600
                        hover:shadow-[0_50px_120px_-20px_rgba(0,200,255,0.18)] hover:border-brand-500/20"
            style={{ boxShadow: "0 40px 100px -20px rgba(0,0,0,0.5)" }}
          >
            {/* ── Background layers ── */}
            <div
              className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(0,200,255,0.28) 0%, transparent 65%)", filter: "blur(65px)" }}
            />
            <div
              className="absolute -bottom-20 right-28 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(0,128,255,0.20) 0%, transparent 65%)", filter: "blur(55px)" }}
            />
            {/* Hover center orb */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/quiz:opacity-100 transition-opacity duration-700">
              <div
                className="w-125 h-125 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 60%)", filter: "blur(40px)" }}
              />
            </div>

            {/* Top shimmer line */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-400/60 to-transparent" />
            {/* Bottom line */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/4 to-transparent" />

            {/* Dot pattern */}
            <div className="absolute inset-0 dot-grid-dark" />
            <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />

            <div className="relative grid md:grid-cols-2 items-stretch">

              {/* ── Text side ── */}
              <div className="p-10 sm:p-14 flex flex-col justify-center z-10">
                <ScrollReveal animation="fade-right" delay={100} duration={650}>
                  <p className="eyebrow eyebrow-dark mb-5">
                    <Brain className="h-3.5 w-3.5" />
                    {QUIZ_BANNER.eyebrow}
                  </p>
                  <h3 className="text-[32px] sm:text-[40px] font-semibold tracking-tight leading-[1.1]">
                    {QUIZ_BANNER.heading.split("\n").map((line, i, arr) => (
                      <span key={i}>
                        {i === 0
                          ? <span className="text-shimmer">{line}</span>
                          : <span className="text-white/85">{line}</span>
                        }
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </h3>
                  <p className="mt-5 text-[14px] text-white/42 max-w-sm leading-[1.85]">
                    {QUIZ_BANNER.description}
                  </p>

                  {/* Feature chips */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["10 Questions", "2 min", "Instant results"].map((chip) => (
                      <span key={chip} className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/8 px-3 py-1 text-[11px] font-medium text-brand-300">
                        <Sparkles className="h-2.5 w-2.5 text-brand-400" />
                        {chip}
                      </span>
                    ))}
                  </div>

                  <Button
                    variant="primary" size="md"
                    className="mt-8 self-start group/btn w-fit btn-glow"
                  >
                    {QUIZ_BANNER.ctaLabel}
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-250" />
                  </Button>
                </ScrollReveal>
              </div>

              {/* ── Image side ── */}
              <div className="relative h-72 md:h-auto min-h-80 overflow-hidden">
                <Image
                  src={QUIZ_BANNER.image}
                  alt="Network visualization"
                  fill sizes="(min-width:768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover/quiz:scale-[1.04]"
                />
                {/* Left gradient blend */}
                <div className="absolute inset-0 bg-linear-to-r from-ink-800/80 via-ink-800/25 to-transparent md:from-ink-800/60 md:via-ink-800/10" />
                {/* Bottom on mobile */}
                <div className="absolute inset-0 bg-linear-to-t from-ink-800/90 to-transparent md:hidden" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

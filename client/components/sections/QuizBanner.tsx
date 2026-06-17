import Image from "next/image";
import { Button, ScrollReveal } from "@/components/ui";
import { QUIZ_BANNER } from "@/data/quiz";
import { Brain, ArrowRight, Sparkles } from "lucide-react";

export function QuizBanner() {
  return (
    <section className="relative bg-white pb-28 overflow-hidden">

      {/* Top divider */}
      <div className="absolute top-0 inset-x-0 divider-glow" />

      <div className="container-x">
        <ScrollReveal animation="zoom-in" duration={800} threshold={0.08}>
          <div
            className="group/quiz relative overflow-hidden rounded-3xl bg-ink-950 text-white cursor-default
                        transition-all duration-600 hover:shadow-[0_50px_120px_-20px_rgba(47,123,255,0.2)]"
            style={{ boxShadow: "0 40px 100px -20px rgba(0,0,0,0.45)" }}
          >
            {/* ── Background layers ── */}
            {/* Static orbs */}
            <div
              className="absolute -top-28 -left-28 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(47,123,255,0.3) 0%, transparent 65%)", filter: "blur(65px)" }}
            />
            <div
              className="absolute -bottom-20 right-28 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(124,95,255,0.22) 0%, transparent 65%)", filter: "blur(55px)" }}
            />
            {/* Hover center orb */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/quiz:opacity-100 transition-opacity duration-700"
            >
              <div
                className="w-[500px] h-[500px] rounded-full"
                style={{ background: "radial-gradient(circle, rgba(47,123,255,0.07) 0%, transparent 60%)", filter: "blur(40px)" }}
              />
            </div>

            {/* Top shimmer line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent" />
            {/* Bottom line */}
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Dot pattern */}
            <div className="absolute inset-0 dot-grid-dark" />

            {/* Noise */}
            <div className="absolute inset-0 noise-overlay opacity-40 pointer-events-none" />

            <div className="relative grid md:grid-cols-2 items-stretch">

              {/* ── Text side ── */}
              <div className="p-10 sm:p-14 flex flex-col justify-center z-10">
                <ScrollReveal animation="fade-right" delay={100} duration={650}>
                  <p className="eyebrow eyebrow-dark mb-5">
                    <Brain className="h-3.5 w-3.5" />
                    {QUIZ_BANNER.eyebrow}
                  </p>
                  <h3 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.025em] leading-[1.1]">
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
                  <p className="mt-5 text-[14px] text-white/45 max-w-sm leading-[1.85]">
                    {QUIZ_BANNER.description}
                  </p>

                  {/* Feature chips */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["10 Questions", "2 min", "Instant results"].map((chip) => (
                      <span key={chip} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-medium text-white/55">
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
              <div className="relative h-72 md:h-auto min-h-[320px] overflow-hidden">
                <Image
                  src={QUIZ_BANNER.image}
                  alt="Network visualization"
                  fill sizes="(min-width:768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover/quiz:scale-[1.04]"
                />
                {/* Left gradient blend */}
                <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/25 to-transparent md:from-ink-950/60 md:via-ink-950/10" />
                {/* Bottom on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-transparent md:hidden" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

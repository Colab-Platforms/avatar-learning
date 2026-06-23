import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Briefcase, Building2, Sparkles, Target } from "lucide-react";
import { Button, ScrollReveal } from "@/components/ui";
import { INTERNSHIP_BANNER, INTERNSHIP_HIGHLIGHTS } from "@/data/internship";

export function InternshipBanner() {
  return (
    <section className="relative bg-ink-950 pb-28 overflow-hidden">
      <div className="absolute top-0 inset-x-0 divider-glow" />

      <div className="container-x mt-6">
        <ScrollReveal animation="zoom-in" duration={800} threshold={0.08}>
          <div
            className="group/internship relative overflow-hidden rounded-3xl bg-ink-900 text-white cursor-default
                        border border-white/6 transition-all duration-600
                        hover:shadow-[0_50px_120px_-20px_rgba(0,128,255,0.22)] hover:border-brand-500/20"
            style={{ boxShadow: "0 40px 100px -20px rgba(0,0,0,0.55)" }}
          >
            <div
              className="absolute -top-32 -right-24 w-110 h-110 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(0,128,255,0.24) 0%, transparent 65%)", filter: "blur(70px)" }}
            />
            <div
              className="absolute -bottom-24 -left-20 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(0,200,255,0.16) 0%, transparent 65%)", filter: "blur(60px)" }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/internship:opacity-100 transition-opacity duration-700">
              <div
                className="w-125 h-125 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(0,128,255,0.08) 0%, transparent 60%)", filter: "blur(40px)" }}
              />
            </div>

            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-400/50 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/4 to-transparent" />

            <div className="relative grid md:grid-cols-2 items-stretch">
              <div className="relative p-10 sm:p-14 flex flex-col justify-center z-10 overflow-hidden">
                <div className="absolute inset-0 dot-grid-dark pointer-events-none" />
                <div className="absolute inset-0 noise-overlay opacity-25 pointer-events-none" />
                <div className="relative">
                <ScrollReveal animation="fade-right" delay={100} duration={650}>
                  <p className="eyebrow eyebrow-dark mb-5">
                    <Briefcase className="h-3.5 w-3.5" />
                    {INTERNSHIP_BANNER.eyebrow}
                  </p>

                  <h3 className="text-[32px] sm:text-[42px] font-semibold tracking-tight leading-[1.08] max-w-md">
                    {INTERNSHIP_BANNER.heading.split("\n").map((line, i, arr) => (
                      <span key={i}>
                        {i === 0 ? (
                          <span className="text-white">{line}</span>
                        ) : (
                          <span className="text-shimmer">{line}</span>
                        )}
                        {i < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </h3>

                  <p className="mt-5 text-[14px] sm:text-[15px] text-white/42 max-w-md leading-[1.85]">
                    {INTERNSHIP_BANNER.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {INTERNSHIP_HIGHLIGHTS.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-500/8 px-3 py-1 text-[11px] font-medium text-brand-300"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-brand-400" />
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white/55">
                      <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-brand-500/15 border border-brand-500/20">
                        <Target className="h-3 w-3 text-brand-400" />
                      </span>
                      75%+ attendance + final project
                    </div>
                    <div className="inline-flex items-center gap-2.5 rounded-xl border border-brand-500/20 bg-brand-500/8 px-4 py-2.5 text-sm text-brand-300">
                      <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-brand-500/20 border border-brand-500/28">
                        <Building2 className="h-3 w-3 text-brand-400" />
                      </span>
                      Partner company placements
                    </div>
                  </div>

                  <Link href="/courses">
                    <Button variant="primary" size="md" className="mt-9 self-start group/btn w-fit btn-glow">
                      {INTERNSHIP_BANNER.ctaLabel}
                      <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-250" />
                    </Button>
                  </Link>
                </ScrollReveal>
                </div>
              </div>

              <div className="relative h-80 md:h-auto md:min-h-[420px] overflow-hidden bg-[#071018]">
                <div className="absolute inset-3 sm:inset-5 md:inset-6">
                  <Image
                    src={INTERNSHIP_BANNER.image}
                    alt="Internship pathway from learning to real-world projects"
                    fill
                    sizes="(min-width:768px) 50vw, 100vw"
                    className="object-contain mt-10 object-center md:object-right transition-transform duration-700 group-hover/internship:scale-[1.02]"
                    priority={false}
                  />
                </div>
                {/* Narrow left-edge blend into text column */}
                <div className="absolute inset-y-0 left-0 w-24 md:w-32 bg-linear-to-r from-ink-900 to-transparent pointer-events-none" />
                {/* Mobile: soft fade under stacked text */}
                <div className="absolute inset-x-0 top-0 h-20 bg-linear-to-b from-ink-900/90 to-transparent md:hidden pointer-events-none" />

                <div className="absolute bottom-6 right-6 hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-ink-950/70 px-4 py-2 text-[11px] font-medium tracking-[0.14em] uppercase text-white/45 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                  AI Learning Division
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

import Image from "next/image";
import { Button, ScrollReveal } from "@/components/ui";
import { ADVISOR_CTA } from "@/data/advisor";
import { ArrowUpRight, Users, CheckCircle2, Star } from "lucide-react";

const TRUST_ITEMS = [
  "No commitment required",
  "Free 30-min session",
  "1-on-1 with an expert",
];

export function AdvisorCTA() {
  return (
    <section className="relative bg-ink-950 text-white overflow-hidden">

      {/* ── Background ── */}
      <div
        className="orb w-[700px] h-[700px] top-1/2 -translate-y-1/2 -left-56 opacity-[0.16]"
        style={{ background: "radial-gradient(circle, #2F7BFF 0%, transparent 60%)", filter: "blur(100px)" }}
      />
      <div
        className="orb w-[500px] h-[500px] -bottom-32 right-1/4 opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #7c5fff 0%, transparent 60%)", filter: "blur(80px)", animationDelay: "3s" }}
      />
      <div className="absolute inset-0 dot-grid-dark" />
      <div className="absolute inset-0 noise-overlay opacity-25 pointer-events-none" />

      {/* Top separator */}
      <div className="absolute top-0 inset-x-0 divider-glow" />

      <div className="relative container-x py-32">
        <div className="grid md:grid-cols-2 gap-20 items-center">

          {/* ── Left: copy ── */}
          <div>
            <ScrollReveal animation="fade-up">
              <div className="pill-tag border-brand-500/25 bg-brand-500/10 text-brand-300 mb-7">
                <Users className="h-3.5 w-3.5 text-brand-400" />
                {ADVISOR_CTA.eyebrow}
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={90}>
              <h3 className="h-display leading-[1.05]">
                {ADVISOR_CTA.heading.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {i === arr.length - 1
                      ? <span className="text-gradient-white">{line}</span>
                      : <span>{line}</span>
                    }
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h3>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={170}>
              <p className="mt-6 max-w-md text-white/42 text-[15px] leading-[1.85]">
                {ADVISOR_CTA.description}
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={240}>
              <ul className="mt-8 space-y-3">
                {TRUST_ITEMS.map((item, i) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[14px] text-white/55 group/item cursor-default"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 shrink-0
                                     group-hover/item:bg-emerald-500/25 transition-colors duration-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    </span>
                    <span className="group-hover/item:text-white/75 transition-colors duration-300">{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            {/* Rating row */}
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="mt-6 flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[13px] text-white/45">4.9 · 500+ sessions completed</span>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={360}>
              <Button
                variant="primary" size="lg"
                className="mt-8 btn-glow group/btn"
              >
                {ADVISOR_CTA.ctaLabel}
                <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-250" />
              </Button>
            </ScrollReveal>
          </div>

          {/* ── Right: image ── */}
          <ScrollReveal animation="fade-left" delay={180} duration={800}>
            <div className="group/img relative">

              {/* Animated glow ring */}
              <div
                className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover/img:opacity-100 transition-opacity duration-600 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(47,123,255,0.35) 0%, rgba(124,95,255,0.25) 50%, rgba(47,123,255,0.1) 100%)",
                  filter: "blur(10px)",
                }}
              />

              <div className="relative rounded-2xl overflow-hidden" style={{ height: "clamp(340px, 45vw, 500px)" }}>
                <Image
                  src={ADVISOR_CTA.image}
                  alt="Global AI network"
                  fill sizes="(min-width:768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover/img:scale-[1.04]"
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/65 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-950/25 to-transparent" />

                {/* Floating badge */}
                <div
                  className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/75 backdrop-blur-lg px-4 py-3
                              transition-all duration-350 hover:border-brand-500/30 hover:bg-ink-950/85"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
                >
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30">
                    <Users className="h-4 w-4 text-brand-400" />
                    {/* Pulse ring */}
                    <span
                      className="absolute inset-0 rounded-full border border-brand-400/40"
                      style={{ animation: "pulse-ring 2.5s ease-out infinite" }}
                    />
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">500+ sessions booked</div>
                    <div className="text-[11px] text-white/42 mt-0.5">This month alone</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}

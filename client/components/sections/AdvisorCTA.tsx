import Image from "next/image";
import { Button, ScrollReveal } from "@/components/ui";
import { ADVISOR_CTA } from "@/data/advisor";
import { ArrowUpRight, Users, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";

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
        className="orb w-175 h-175 top-1/2 -translate-y-1/2 -left-56 opacity-[0.14]"
        style={{
          background: "radial-gradient(circle, #00C8FF 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="orb w-125 h-125 -bottom-32 right-1/4 opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, #0080FF 0%, transparent 60%)",
          filter: "blur(80px)",
          animationDelay: "3s",
        }}
      />
      <div className="absolute inset-0 dot-grid-dark" />
      <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none" />

      {/* Top separator */}
      <div className="absolute top-0 inset-x-0 divider-glow" />

      <div className="relative container-x py-16">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          {/* ── Left: copy ── */}
          <div>
            <ScrollReveal animation="fade-up">
              <div className="pill-tag border-brand-500/25 bg-brand-500/8 text-brand-300 mb-7">
                <Users className="h-3.5 w-3.5 text-brand-400" />
                {ADVISOR_CTA.eyebrow}
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={90}>
              <h3 className="h-display leading-[1.05]">
                {ADVISOR_CTA.heading.split("\n").map((line, i, arr) => (
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
              <p className="mt-6 max-w-md text-white/40 text-[15px] leading-[1.85]">
                {ADVISOR_CTA.description}
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={240}>
              <ul className="mt-8 space-y-3">
                {TRUST_ITEMS.map((item, i) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[14px] text-white/50 group/item cursor-default"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <span
                      className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500/12 border border-emerald-500/22 shrink-0
                                     group-hover/item:bg-emerald-500/22 transition-colors duration-300"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    </span>
                    <span className="group-hover/item:text-white/72 transition-colors duration-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            {/* Rating row */}
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="mt-6 flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <span className="text-[13px] text-white/38">
                  4.9 · 500+ sessions completed
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={360}>
              <Link href={"/contact"}>
                <Button
                  variant="primary"
                  size="lg"
                  className="mt-8 btn-glow group/btn cursor-pointer"
                >
                  {ADVISOR_CTA.ctaLabel}
                  <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-250" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>

          {/* ── Right: image ── */}
          <ScrollReveal animation="fade-left" delay={180} duration={800}>
            <div className="group/img relative">
              {/* Animated glow ring */}
              <div
                className="absolute -inset-0.5 rounded-3xl opacity-0 group-hover/img:opacity-100 transition-opacity duration-600 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,200,255,0.30) 0%, rgba(0,128,255,0.22) 50%, rgba(0,200,255,0.08) 100%)",
                  filter: "blur(10px)",
                }}
              />

              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ height: "clamp(340px, 45vw, 500px)" }}
              >
                <Image
                  src={ADVISOR_CTA.image}
                  alt="Global AI network"
                  fill
                  sizes="(min-width:768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover/img:scale-[1.04]"
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-linear-to-t from-ink-950/65 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-ink-950/20 to-transparent" />

                {/* Floating badge */}
                <div
                  className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-white/8 bg-ink-950/80 backdrop-blur-lg px-4 py-3
                              transition-all duration-350 hover:border-brand-500/25 hover:bg-ink-950/90"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                >
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/18 border border-brand-500/28">
                    <Users className="h-4 w-4 text-brand-400" />
                    <span
                      className="absolute inset-0 rounded-full border border-brand-400/35"
                      style={{ animation: "pulse-ring 2.5s ease-out infinite" }}
                    />
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">
                      500+ sessions booked
                    </div>
                    <div className="text-[11px] text-white/38 mt-0.5">
                      This month alone
                    </div>
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

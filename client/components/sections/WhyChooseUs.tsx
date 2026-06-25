import { WHY_FEATURES } from "@/data/features";
import { ScrollReveal } from "@/components/ui";
import { Briefcase, Layers, Clock, Award } from "lucide-react";

const CARDS = [
  {
    icon: Briefcase,
    tag: "Career",
    orbColor: "rgba(0,200,255,0.55)",
    hoverBg: "rgba(0,200,255,0.06)",
    iconCls: "text-brand-400 bg-brand-500/10 border-brand-500/25",
    accentLine: "via-brand-500/50",
  },
  {
    icon: Layers,
    tag: "Projects",
    orbColor: "rgba(16,185,129,0.5)",
    hoverBg: "rgba(16,185,129,0.05)",
    iconCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    accentLine: "via-emerald-500/50",
  },
  {
    icon: Clock,
    tag: "Flexible",
    orbColor: "rgba(0,128,255,0.55)",
    hoverBg: "rgba(0,128,255,0.06)",
    iconCls: "text-blue-300 bg-blue-500/10 border-blue-500/25",
    accentLine: "via-blue-400/50",
  },
  {
    icon: Award,
    tag: "Certified",
    orbColor: "rgba(56,217,255,0.5)",
    hoverBg: "rgba(56,217,255,0.06)",
    iconCls: "text-brand-300 bg-brand-400/10 border-brand-400/25",
    accentLine: "via-brand-400/50",
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="relative bg-ink-950 py-16 sm:py-18 overflow-hidden">
      {/* Dividers */}
      <div className="absolute top-0 inset-x-0 divider-glow" />
      <div className="absolute bottom-0 inset-x-0 divider-glow" />

      {/* Ambient neon orb */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-250 h-125 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center bottom, rgba(0,200,255,0.07) 0%, transparent 65%)",
        }}
      />

      <div className="container-x">
        {/* ── Header ── */}
        <ScrollReveal animation="fade-up">
          <p className="eyebrow">Why Choose Us</p>
          <h2 className="h-display mt-4 max-w-2xl text-white">
            Learn Today.{" "}
            <span className="text-gradient-brand">Lead Tomorrow.</span>
          </h2>
          <p className="mt-6 max-w-xl text-white/40 text-[15px] leading-[1.85]">
            Every program is designed with one goal — turning beginners into
            capable AI professionals through live sessions, hands-on projects,
            and real career outcomes.
          </p>
        </ScrollReveal>

        {/* ── Cards grid ── */}
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {WHY_FEATURES.map((feature, i) => {
            const {
              icon: Icon,
              tag,
              orbColor,
              hoverBg,
              iconCls,
              accentLine,
            } = CARDS[i];
            return (
              <ScrollReveal
                key={feature.title}
                animation="fade-up"
                delay={i * 90}
                duration={720}
              >
                <div
                  className="group/feat relative overflow-hidden rounded-2xl bg-ink-800 text-white p-8 sm:p-9
                              min-h-70 flex flex-col justify-between border border-white/6
                              card-lift-dark cursor-default"
                >
                  {/* Neon hover orb */}
                  <div
                    className="absolute -top-12 -right-12 w-60 h-60 rounded-full pointer-events-none
                                opacity-0 group-hover/feat:opacity-100 transition-opacity duration-600"
                    style={{
                      background: `radial-gradient(circle, ${orbColor} 0%, transparent 65%)`,
                      filter: "blur(55px)",
                    }}
                  />

                  {/* Hover surface tint */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover/feat:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{
                      background: `radial-gradient(ellipse at 85% 20%, ${hoverBg} 0%, transparent 65%)`,
                    }}
                  />

                  {/* Top neon accent line */}
                  <div
                    className={`absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent ${accentLine} to-transparent
                                  scale-x-0 group-hover/feat:scale-x-100 transition-transform duration-500 origin-left`}
                  />

                  {/* ── Top row ── */}
                  <div className="relative flex items-start justify-between">
                    <span
                      className={`inline-flex items-center justify-center h-11 w-11 rounded-xl border ${iconCls}
                                  transition-all duration-350 group-hover/feat:scale-110 group-hover/feat:rotate-6`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/18 border border-white/8 rounded-full px-3 py-1">
                      {tag}
                    </span>
                  </div>

                  {/* ── Bottom text ── */}
                  <div className="relative">
                    <h4 className="text-[17px] font-semibold leading-snug text-white">
                      {feature.title}
                    </h4>
                    <p className="mt-3 text-[14px] text-white/38 leading-[1.85] group-hover/feat:text-white/60 transition-colors duration-400">
                      {feature.body}
                    </p>
                  </div>

                  {/* Bottom neon line */}
                  <div
                    className={`absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent ${accentLine} to-transparent
                                  scale-x-0 group-hover/feat:scale-x-100 transition-transform duration-700 delay-100 origin-right`}
                  />
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

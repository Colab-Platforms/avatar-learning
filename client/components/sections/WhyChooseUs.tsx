import { WHY_FEATURES } from "@/data/features";
import { ScrollReveal } from "@/components/ui";
import { Briefcase, Layers, Clock, Award } from "lucide-react";

const CARDS = [
  {
    icon: Briefcase,
    tag: "Career",
    orbColor: "rgba(47,123,255,0.5)",
    hoverBg: "rgba(47,123,255,0.05)",
    iconCls: "text-brand-400 bg-brand-500/10 border-brand-500/20",
    accentLine: "via-brand-500/40",
  },
  {
    icon: Layers,
    tag: "Projects",
    orbColor: "rgba(16,185,129,0.5)",
    hoverBg: "rgba(16,185,129,0.05)",
    iconCls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    accentLine: "via-emerald-500/40",
  },
  {
    icon: Clock,
    tag: "Flexible",
    orbColor: "rgba(249,115,22,0.5)",
    hoverBg: "rgba(249,115,22,0.05)",
    iconCls: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    accentLine: "via-orange-500/40",
  },
  {
    icon: Award,
    tag: "Certified",
    orbColor: "rgba(168,85,247,0.5)",
    hoverBg: "rgba(168,85,247,0.05)",
    iconCls: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    accentLine: "via-purple-500/40",
  },
] as const;

export function WhyChooseUs() {
  return (
    <section className="relative bg-white py-28 sm:py-36 overflow-hidden">

      {/* Section dividers */}
      <div className="absolute top-0 inset-x-0 divider-glow" />
      <div className="absolute bottom-0 inset-x-0 divider-glow" />

      {/* Subtle radial */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center bottom, rgba(47,123,255,0.03) 0%, transparent 65%)" }}
      />

      <div className="container-x">

        {/* ── Header ── */}
        <ScrollReveal animation="fade-up">
          <p className="eyebrow">Why Choose Us</p>
          <h2 className="h-display mt-4 max-w-2xl">
            Learn Today.{" "}
            <span className="text-gradient-brand">Lead Tomorrow.</span>
          </h2>
          <p className="mt-6 max-w-xl text-ink-900/48 text-[15px] leading-[1.85]">
            Every program is designed with one goal — turning beginners into capable
            AI professionals through live sessions, hands-on projects, and real career outcomes.
          </p>
        </ScrollReveal>

        {/* ── Cards grid ── */}
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {WHY_FEATURES.map((feature, i) => {
            const { icon: Icon, tag, orbColor, hoverBg, iconCls, accentLine } = CARDS[i];
            return (
              <ScrollReveal
                key={feature.title}
                animation="fade-up"
                delay={i * 90}
                duration={720}
              >
                <div
                  className="group/feat relative overflow-hidden rounded-2xl bg-ink-950 text-white p-8 sm:p-9
                              min-h-[280px] flex flex-col justify-between border border-white/[0.055]
                              card-lift-dark cursor-default"
                >
                  {/* Hover background orb */}
                  <div
                    className="absolute -top-12 -right-12 w-60 h-60 rounded-full pointer-events-none
                                opacity-0 group-hover/feat:opacity-100 transition-opacity duration-600"
                    style={{ background: `radial-gradient(circle, ${orbColor} 0%, transparent 65%)`, filter: "blur(55px)" }}
                  />

                  {/* Hover surface tint */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover/feat:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{ background: `radial-gradient(ellipse at 85% 20%, ${hoverBg} 0%, transparent 65%)` }}
                  />

                  {/* Top accent line — grows on hover */}
                  <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${accentLine} to-transparent
                                  scale-x-0 group-hover/feat:scale-x-100 transition-transform duration-500 origin-left`} />

                  {/* ── Top row ── */}
                  <div className="relative flex items-start justify-between">
                    <span
                      className={`inline-flex items-center justify-center h-11 w-11 rounded-xl border ${iconCls}
                                  transition-all duration-350 group-hover/feat:scale-110 group-hover/feat:rotate-6`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-white/18 border border-white/[0.08] rounded-full px-3 py-1">
                      {tag}
                    </span>
                  </div>

                  {/* ── Bottom text ── */}
                  <div className="relative">
                    <h4 className="text-[17px] font-semibold leading-snug">{feature.title}</h4>
                    <p className="mt-3 text-[14px] text-white/42 leading-[1.85] group-hover/feat:text-white/60 transition-colors duration-400">
                      {feature.body}
                    </p>
                  </div>

                  {/* Bottom shine line on hover */}
                  <div className={`absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent ${accentLine} to-transparent
                                  scale-x-0 group-hover/feat:scale-x-100 transition-transform duration-700 delay-100 origin-right`} />
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

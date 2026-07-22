import { WHY_FEATURES } from "@/data/features";
import { ScrollReveal, ShinyText } from "@/components/ui";
import { Briefcase, Layers, Clock, Award, Sparkles } from "lucide-react";

const CARDS = [
  { icon: Briefcase, tag: "Career", accentClass: "text-brand-600 bg-brand-50 border-brand-200" },
  { icon: Layers, tag: "Projects", accentClass: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { icon: Clock, tag: "Flexible", accentClass: "text-blue-600 bg-blue-50 border-blue-200" },
  { icon: Award, tag: "Certified", accentClass: "text-brand-600 bg-brand-50 border-brand-200" },
] as const;

export function WhyChooseUs() {
  return (
    <section className="relative bg-white py-16 sm:py-18">
      <div className="container-x">
        {/* ── Header ── */}
        <ScrollReveal animation="fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
            <ShinyText
              text="Why Choose Us"
              color="#1d4ed8"
              shineColor="#93c5fd"
              speed={2.5}
            />
          </div>
          <h2 className="h-display mt-4 max-w-2xl text-text">
            Learn Today.{" "}
            <span className="text-gradient-brand">Lead Tomorrow.</span>
          </h2>
          <p className="mt-6 max-w-xl text-text-muted text-[15px] leading-[1.85]">
            Every program is designed with one goal — turning beginners into
            capable AI professionals through live sessions, hands-on projects,
            and real career outcomes.
          </p>
        </ScrollReveal>

        {/* ── Cards grid ── */}
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {WHY_FEATURES.map((feature, i) => {
            const { icon: Icon, tag, accentClass } = CARDS[i];
            return (
              <ScrollReveal key={feature.title} animation="fade-up" delay={i * 90}>
                <div className="rounded-2xl bg-surface-alt border border-border p-8 sm:p-9 min-h-70 flex flex-col justify-between card-lift">
                  <div className="flex items-start justify-between">
                    <span
                      className={`inline-flex items-center justify-center h-11 w-11 rounded-xl border ${accentClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-text-subtle border border-border rounded-full px-3 py-1">
                      {tag}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-[17px] font-semibold leading-snug text-text">
                      {feature.title}
                    </h4>
                    <p className="mt-3 text-[14px] text-text-muted leading-[1.85]">
                      {feature.body}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

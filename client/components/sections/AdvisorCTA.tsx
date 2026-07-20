import { Button, ScrollReveal } from "@/components/ui";
import { AdvisorIllustration } from "@/components/illustrations/AdvisorIllustration";
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
    <section className="relative bg-surface-alt text-text">
      <div className="container-x pt-0 pb-16">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          {/* ── Left: copy ── */}
          <div>
            <ScrollReveal animation="fade-up">
              <div className="pill-tag border-brand-200 bg-brand-50 text-brand-700 mb-7">
                <Users className="h-3.5 w-3.5 text-brand-600" />
                {ADVISOR_CTA.eyebrow}
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={90}>
              <h3 className="h-display leading-[1.05] text-text">
                {ADVISOR_CTA.heading.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h3>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={170}>
              <p className="mt-6 max-w-md text-text-muted text-[15px] leading-[1.85]">
                {ADVISOR_CTA.description}
              </p>
            </ScrollReveal>

            {/* <ScrollReveal animation="fade-up" delay={240}>
              <ul className="mt-8 space-y-3">
                {TRUST_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-[14px] text-text-muted"
                  >
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-50 border border-emerald-200 shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal> */}

            {/* Rating row */}
            {/* <ScrollReveal animation="fade-up" delay={300}>
              <div className="mt-6 flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 text-amber-500 fill-amber-500"
                    />
                  ))}
                </div>
                <span className="text-[13px] text-text-subtle">
                  4.9 · 500+ sessions completed
                </span>
              </div>
            </ScrollReveal> */}

            <ScrollReveal animation="fade-up" delay={360}>
              <div className="flex flex-col sm:flex-row gap-4 ">
                <Link href={"/direct2hire"}>
                  <Button variant="primary" size="lg" className="mt-8">
                    {ADVISOR_CTA.ctaLabel}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={"/courses"}>
                  <Button variant="primary" size="lg" className="mt-8">
                    {ADVISOR_CTA.ctaLabel2}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* ── Right: illustration ── */}
          <ScrollReveal animation="fade-up" delay={180}>
            <div className="relative">
              <div className="relative rounded-2xl border border-border bg-white p-8 flex items-center justify-center shadow-sm">
                <AdvisorIllustration className="w-full h-auto" />
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-md">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 border border-brand-200">
                  <Users className="h-4 w-4 text-brand-600" />
                </span>
                <div>
                  <div className="text-[13px] font-semibold leading-tight text-text">
                    500+ sessions booked
                  </div>
                  <div className="text-[11px] text-text-subtle mt-0.5">
                    This month alone
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

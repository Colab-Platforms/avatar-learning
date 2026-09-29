"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "./SectionEyebrow";
import { PRICING_TIERS } from "./data";

// Presentation-only labels for the progression strip — the tiers' own
// name/tagline/price/features in data.ts are unchanged.
const STAGES = ["Start", "Adopt", "Scale"];

export function PricingSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="pricing" className="relative py-12 sm:py-16 scroll-mt-24">
      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-6 max-w-2xl text-center sm:mb-8"
        >
          <SectionEyebrow number="04" label="Plans" className="text-blue-300" />
          <h2 className="mt-4 text-3xl font-extralight tracking-tight text-white sm:text-5xl">
            Pricing that fits{" "}
            <span
              className="bg-clip-text font-light text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 100%)",
              }}
            >
              how you grow.
            </span>
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/90">
            Every business adopts AI differently — plans are shaped around
            your workflows, not a fixed template. Talk to us for a quote.
          </p>
        </motion.div>

        {/* progression strip — a restrained connective line, not a game-y level meter */}
        <div className="relative mx-auto mb-8 hidden max-w-3xl items-center px-6 sm:flex">
          <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="absolute left-0 right-0 h-1 w-full px-6">
            <motion.line
              x1="8"
              y1="2"
              x2="92"
              y2="2"
              stroke="url(#aiePricingLine)"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="aiePricingLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="relative flex w-full justify-between">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border transition-all duration-300",
                    hovered === i
                      ? "scale-125 border-violet-300 bg-violet-300 shadow-[0_0_12px_rgba(196,181,253,0.8)]"
                      : "border-white/25 bg-[#05050a]",
                  )}
                />
                <span
                  className={cn(
                    "text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-300",
                    hovered === i ? "text-violet-200" : "text-white/45",
                  )}
                >
                  {stage}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{ y: -6 }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "relative flex flex-col rounded-3xl border p-7 backdrop-blur-xl transition-all duration-300",
                tier.featured
                  ? "border-violet-400/30 bg-white/[0.06] hover:border-violet-400/50"
                  : "border-white/10 bg-white/[0.03] hover:border-violet-300/30 hover:bg-white/[0.05]",
              )}
              style={{
                boxShadow: tier.featured
                  ? "0 20px 60px -20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
                  : "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)" }}
                >
                  Most Popular
                </span>
              )}

              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-white/90">{tier.tagline}</p>

              <p className="mt-5 text-2xl font-light text-white">
                Custom <span className="text-[14px] font-normal text-white/95">pricing</span>
              </p>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {tier.inclusions.map((inc) => (
                  <li key={inc} className="flex items-start gap-2.5 text-[14px] text-white/92">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />
                    {inc}
                  </li>
                ))}
              </ul>

              <a
                href="#book-demo"
                className={cn(
                  "mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-semibold transition-all duration-250",
                  tier.featured
                    ? "text-white"
                    : "border border-white/15 text-white/92 hover:border-white/30 hover:text-white",
                )}
                style={
                  tier.featured
                    ? { background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)" }
                    : undefined
                }
              >
                Talk to Sales <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { ScrollReveal } from "@/components/ui";
import { cn } from "@/lib/utils";

type PlanId = "BASIC" | "STANDARD" | "PRO";

interface PlanCard {
  id: PlanId;
  eyebrow: string;
  badge?: string;
  price: string;
  tagline: string;
  features: string[];
  ctaLabel: string;
  variant: "light" | "brand" | "dark";
}

const PLANS: PlanCard[] = [
  {
    id: "BASIC",
    eyebrow: "Basic",
    price: "₹99",
    tagline: "Explore AI with our starter courses.",
    features: [
      "Access to all basic courses",
      "Pre-recorded counselling",
      "Self-paced, lifetime access",
      "Learner community",
    ],
    ctaLabel: "Get started",
    variant: "light",
  },
  {
    id: "STANDARD",
    eyebrow: "Standard",
    badge: "MOST POPULAR",
    price: "₹299",
    tagline: "Add a private mentor to guide your path.",
    features: [
      "Everything in Basic",
      "1-on-1 private counselling call",
      "Personalised learning path",
      "Priority WhatsApp support",
    ],
    ctaLabel: "Choose Standard",
    variant: "brand",
  },
  {
    id: "PRO",
    eyebrow: "Pro",
    badge: "GET HIRED",
    price: "₹2,999",
    tagline: "The full path to a job in 120 days.",
    features: [
      "Everything in Standard",
      "Advanced AI courses",
      "Guaranteed internship",
      "Placement support till you're hired",
    ],
    ctaLabel: "Claim my seat",
    variant: "dark",
  },
];

export function PlanPricingCards({ enrolled }: { enrolled: boolean }) {
  return (
    <section id="choose-plan" className="py-13 sm:py-16 border-t border-border">
      <div className="container-x">
        <ScrollReveal animation="fade-up" delay={0}>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-subtle mb-2">
              Choose your plan
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
              Three ways to get started.
            </h2>
            <p className="mt-3 text-text-muted text-[14px] sm:text-[15px] leading-relaxed">
              Start small at ₹99, or go all-in for a guaranteed job in 120
              days. Every plan builds on the one before it.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:gap-6 md:grid-cols-3 items-stretch max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <ScrollReveal key={plan.id} animation="fade-up" delay={100 * i}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-6 sm:p-7",
                  plan.variant === "brand" &&
                    "border-brand-200 bg-white shadow-lg shadow-brand-100/50 ring-1 ring-brand-100",
                  plan.variant === "light" && "border-border bg-white",
                  plan.variant === "dark" &&
                    "border-transparent bg-text text-white",
                )}
              >
                {plan.badge && (
                  <span
                    className={cn(
                      "absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                      plan.variant === "brand"
                        ? "bg-brand-600 text-white"
                        : "bg-emerald-500 text-white",
                    )}
                  >
                    {plan.badge}
                  </span>
                )}

                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wider mb-2",
                    plan.variant === "dark" ? "text-white/60" : "text-brand-600",
                  )}
                >
                  {plan.eyebrow}
                </p>
                <p className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight">
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-[12px]",
                      plan.variant === "dark" ? "text-white/50" : "text-text-subtle",
                    )}
                  >
                    one-time
                  </span>
                </p>
                <p
                  className={cn(
                    "text-[13px] leading-relaxed mb-5",
                    plan.variant === "dark" ? "text-white/70" : "text-text-muted",
                  )}
                >
                  {plan.tagline}
                </p>

                <ul className="flex flex-col gap-2.5 mb-7 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[13.5px]"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 mt-0.5",
                          plan.variant === "dark"
                            ? "text-emerald-400"
                            : "text-emerald-600",
                        )}
                      />
                      <span
                        className={idx === 0 ? "font-semibold" : undefined}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={enrolled ? "/dashboard" : `/direct2hire/enroll?plan=${plan.id}`}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-[13.5px] font-bold transition-colors",
                    plan.variant === "brand" &&
                      "bg-brand-600 text-white hover:bg-brand-700",
                    plan.variant === "light" &&
                      "bg-brand-50 text-brand-600 hover:bg-brand-100",
                    plan.variant === "dark" && "bg-white text-text hover:bg-white/90",
                  )}
                >
                  {enrolled ? "Go to dashboard" : plan.ctaLabel}
                  <span aria-hidden>&rarr;</span>
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Star,
  Briefcase,
  BrainCircuit,
  Target,
  Sigma,
  Check,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button, ScrollReveal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { StickyBuyBar } from "./StickyBuyBar";
import { StickyMemoSticker } from "./StickyMemoSticker";
import { UrgencyBanner } from "./UrgencyBanner";
import { useOfferCountdown } from "./OfferTimerBar";
import { useDirect2HireCheckout } from "@/hooks/useDirect2HireCheckout";
import { Testimonials } from "@/components/home/Testimonials/Testimonials";
import { RECENT_ENROLLMENTS } from "@/data/socialProof";

/* ─── data ─────────────────────────────────────────────────────────── */

const SEATS_TOTAL = 50;
const SEATS_FILLED = 38;
const SEATS_PERCENT = Math.round((SEATS_FILLED / SEATS_TOTAL) * 100);

const HOW_STEPS = [
  {
    num: "01",
    icon: BrainCircuit,
    title: "Learn",
    desc: "Job-ready AI skills through a mentor-led course made for beginners.",
    dark: false,
  },
  {
    num: "02",
    icon: Briefcase,
    title: "Experience",
    desc: "A real internship on live projects at one of our partner companies.",
    dark: false,
  },
  {
    num: "★",
    icon: Star,
    title: "Get placed",
    desc: "We connect you to 50+ hiring partners and stay until you're hired.",
    dark: true,
  },
];

const WALK_AWAY = [
  {
    image: "/counselling-images/certificate.png",
    title: "A recognised certificate",
    desc: "Something recruiters trust.",
    dark: false,
  },
  {
    image: "/counselling-images/work-exp.png",
    title: "Real work experience",
    desc: "A live internship on your resume.",
    dark: false,
  },
  {
    image: "/counselling-images/job-offer.png",
    title: "A job offer",
    desc: "The whole point — a placement.",
    dark: true,
  },
];

const HERO_VARIANTS = [
  {
    tab: "OUTCOME",
    title: "Your first job, secured in just ",
    highlight: "120 days.",
    image: "/Direct2hire/Outcome-Real-Job.png",
  },
  {
    tab: "BATCH",
    title: "Limited batches ",
    highlight: "AI career program",
    image: "/Direct2hire/Batch-Limited.png",
  },
  {
    tab: "VALUE",
    title: "One program. Every step. ",
    highlight: "Fraction of price.",
    image: "/Direct2hire/Value-999.png",
  },
  {
    tab: "TRUST",
    title: "NSE-listed AI firm opens ",
    highlight: "flagship program.",
    image: "/Direct2hire/Trusted-10k-Hire.png",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    zIndex: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    zIndex: 0,
  }),
};

const STAT_TILES = [
  {
    icon: Star,
    iconClass: "text-amber-500 fill-amber-500",
    badgeBg: "bg-amber-100",
    cardBg: "bg-amber-50",
    value: "4.9/5",
    valueClass: "text-text",
    label: "3,200+ reviews",
  },
  {
    icon: Target,
    iconClass: "text-blue-600",
    badgeBg: "bg-blue-100",
    cardBg: "bg-blue-50",
    value: "96.3%",
    valueClass: "text-blue-600",
    label: "placement rate",
  },
  {
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    badgeBg: "bg-emerald-100",
    cardBg: "bg-emerald-50",
    value: "10K+",
    valueClass: "text-emerald-700",
    label: "students placed",
  },
];

const HERO_PILLS = [
  { tab: "OUTCOME", label: "Real job" },
  { tab: "BATCH", label: "Limited" },
  { tab: "VALUE", label: "Affordable" },
  { tab: "TRUST", label: "10K+ hired" },
];

const VALUE_ITEMS = [
  {
    num: "01",
    title: "AI career assessment",
    desc: "Maps your strengths to the right path.",
    price: "₹2,000",
  },
  {
    num: "02",
    title: "1-on-1 counselling call",
    desc: "30 min on Google Meet with a mentor.",
    price: "₹2,000",
  },
  {
    num: "03",
    title: "AI learning course",
    desc: "Job-ready skills, mentor-led, for beginners.",
    price: "₹10,000",
  },
  {
    num: "04",
    title: "Guaranteed internship",
    desc: "Live projects at a partner company.",
    price: "₹5,500",
  },
  {
    num: "05",
    title: "Job placement support",
    desc: "We stay with you until you're hired.",
    price: "₹5,499",
  },
];

const COMPARISON_ROWS = [
  "Mentor-led learning",
  "Real internship",
  "Placement support",
  "Job in 120 days",
  "One all-in price",
];

const TESTIMONIALS = [
  {
    quote:
      "I had a degree and no idea what came next. 120 days later, I had an offer letter.",
    name: "Ananya R.",
    role: "B.Tech Final Year · Hyderabad",
  },
  {
    quote: "The internship is what got me hired. No other course gave me that.",
    name: "Rahul V.",
    role: "AI Associate · Bengaluru",
  },
];

/* ─── page ──────────────────────────────────────────────────────────── */

export default function Direct2HirePage() {
  const [walkAwaySlide, setWalkAwaySlide] = useState(0);
  const [heroState, setHeroState] = useState({ index: 0, direction: 1 });
  const heroIndex = heroState.index;
  const heroDirection = heroState.direction;
  const [enrollmentIndex, setEnrollmentIndex] = useState(0);

  const changeHeroIndex = (
    nextIndexOrFn: number | ((prev: number) => number),
  ) => {
    setHeroState((prev) => {
      const nextIndex =
        typeof nextIndexOrFn === "function"
          ? nextIndexOrFn(prev.index)
          : nextIndexOrFn;
      let dir = 1; // default forward
      if (nextIndex !== prev.index) {
        if (nextIndex === 0 && prev.index === HERO_VARIANTS.length - 1) {
          // Wrap-around forward
          dir = 1;
        } else if (nextIndex === HERO_VARIANTS.length - 1 && prev.index === 0) {
          // Wrap-around backward
          dir = -1;
        } else {
          dir = nextIndex > prev.index ? 1 : -1;
        }
      }
      return { index: nextIndex, direction: dir };
    });
  };
  const setHeroIndex = changeHeroIndex;

  useEffect(() => {
    const timer = setInterval(() => {
      setWalkAwaySlide((i) => (i + 1) % WALK_AWAY.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_VARIANTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEnrollmentIndex((i) => (i + 1) % RECENT_ENROLLMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const {
    enroll: _enroll,
    processing,
    message,
    enrolled,
  } = useDirect2HireCheckout();
  const offerLabel = useOfferCountdown();
  const [offerHrs, offerMin, offerSec] = offerLabel.split(":");

  const ctaHref = enrolled ? "/dashboard" : "/direct2hire/enroll";
  const ctaLabel = processing
    ? "Processing Payment…"
    : enrolled
      ? "Go to Dashboard"
      : "Claim my seat now";

  return (
    <>
      <Navbar hideOfferBar={enrolled} />

      <main className="min-h-screen bg-white text-text overflow-x-hidden">
        {/* ══════════════════════════════
            HERO
        ══════════════════════════════ */}
        <section
          id="d2h-hero"
          className="relative pt-20 pb-6 sm:pt-25 sm:pb-14 overflow-hidden"
        >
          <div
            className="pointer-events-none absolute top-0 right-0 w-[700px] h-[500px] bg-brand-200/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"
            aria-hidden
          />

          <div className="relative container-x">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start">
              {/* left */}
              <div className="lg:col-span-5 xl:col-span-5">
                <ScrollReveal animation="fade-up" delay={0}>
                  {!enrolled && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold text-text-muted mb-4 sm:mb-5">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                      Seats filling fast
                    </span>
                  )}
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={40}>
                  <h1 className="h-display font-bold text-text mb-3 sm:mb-6 min-h-[3.6em] sm:min-h-[3.3em]">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={heroIndex}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="block"
                      >
                        {HERO_VARIANTS[heroIndex].title}
                        <span className="text-gradient-brand">
                          {HERO_VARIANTS[heroIndex].highlight}
                        </span>
                      </motion.span>
                    </AnimatePresence>
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={80}>
                  <p className="text-text-muted text-[15px] sm:text-[16px] leading-relaxed mb-4 sm:mb-6">
                    Assessment to offer letter in five guided steps — one
                    program, one price.
                  </p>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={100}>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 sm:px-3.5 py-2.5 mb-4 sm:mb-5 w-full md:w-fit">
                    <span className="relative flex sm:h-11 sm:w-11 w-9 h-9 shrink-0 items-center justify-center">
                      <Image
                        src="/nse-logo.png"
                        alt="NSE"
                        fill
                        sizes="38px"
                        className="object-contain p-0.5"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-subtle leading-tight">
                        Powered by
                      </p>
                      <p className="text-[11.5px] sm:text-[12.5px] font-bold text-text leading-tight">
                        Avatar India, NSE Listed Company
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={110}>
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                    {HERO_PILLS.map((pill) => {
                      const active = pill.tab === HERO_VARIANTS[heroIndex].tab;
                      return (
                        <button
                          key={pill.tab}
                          type="button"
                          onClick={() =>
                            setHeroIndex(
                              HERO_VARIANTS.findIndex(
                                (v) => v.tab === pill.tab,
                              ),
                            )
                          }
                          className={cn(
                            "rounded-xl border px-2 py-2 sm:px-2.5 sm:py-2.5 text-center transition-colors duration-300 cursor-pointer hover:border-brand-300",
                            active
                              ? "border-brand-200 bg-brand-50"
                              : "border-border bg-white",
                          )}
                        >
                          <p
                            className={cn(
                              "text-[9px] sm:text-[10px] font-bold tracking-wider mb-0.5",
                              active ? "text-brand-600" : "text-text-subtle",
                            )}
                          >
                            {pill.tab}
                          </p>
                          <p className="text-[11px] sm:text-[12.5px] font-bold text-text leading-tight">
                            {pill.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={150}>
                  {!enrolled && (
                    <div className="flex items-stretch rounded-2xl border border-border bg-white overflow-hidden w-full sm:w-fit shadow-sm mb-3">
                      <div className="min-w-0 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3.5">
                        <p className="text-[10px] sm:text-[11px] text-text-subtle mb-0.5 whitespace-nowrap">
                          Enroll today for
                        </p>
                        <p className="flex items-baseline gap-1.5 sm:gap-2 whitespace-nowrap">
                          <span className="text-brand-600 font-bold text-xl sm:text-[28px]">
                            ₹999
                          </span>
                          <span className="text-text-subtle line-through text-[12px] sm:text-[15px]">
                            ₹24,999
                          </span>
                        </p>
                      </div>
                      <div className="bg-text text-white flex flex-col items-center justify-center px-5 sm:px-7 min-w-26 sm:min-w-32 shrink-0">
                        <span className="text-lg sm:text-xl font-black leading-none whitespace-nowrap">
                          96%
                        </span>
                        <span className="text-[9px] sm:text-[10px] tracking-wider">
                          OFF
                        </span>
                      </div>
                    </div>
                  )}

                  {!enrolled && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4 sm:mb-5 w-full sm:max-w-md">
                      {[
                        { value: offerHrs, label: "HRS" },
                        { value: offerMin, label: "MIN" },
                        { value: offerSec, label: "SEC" },
                      ].map((box, i) => (
                        <div
                          key={box.label}
                          className="flex flex-col items-center justify-center rounded-xl bg-text px-4 sm:px-5 py-2 sm:py-2.5"
                        >
                          <span
                            className={cn(
                              "text-lg sm:text-xl font-black leading-none font-mono tabular-nums",
                              i === 2 ? "text-brand-400" : "text-white",
                            )}
                          >
                            {box.value}
                          </span>
                          <span className="text-[9px] sm:text-[10px] tracking-wider text-white/60 mt-0.5">
                            {box.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center sm:items-center gap-2 sm:gap-4">
                    <Link href={ctaHref} className="w-full sm:w-auto">
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full sm:w-auto group inline-flex items-center justify-center gap-2"
                      >
                        {processing ? (
                          "Processing Payment…"
                        ) : enrolled ? (
                          <>
                            Go to Dashboard
                            <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                          </>
                        ) : (
                          <>
                            Claim my seat now
                            <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </>
                        )}
                      </Button>
                    </Link>
                    {!enrolled && (
                      <p className="text-[12px] text-text-subtle leading-tight">
                        Instant confirmation
                        <br className="hidden sm:block" /> on WhatsApp
                      </p>
                    )}
                  </div>

                  {!enrolled && (
                    <div className="flex items-center gap-2 mt-4 mb-4">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <p className="text-[12px] sm:text-[12.5px] text-text-subtle">
                        <strong className="text-text font-semibold">
                          {RECENT_ENROLLMENTS[enrollmentIndex].name}
                        </strong>{" "}
                        just booked a seat ·{" "}
                        {RECENT_ENROLLMENTS[enrollmentIndex].time}
                      </p>
                    </div>
                  )}

                  {message && (
                    <div
                      className={cn(
                        "mt-3 rounded-xl border px-4 py-2.5 text-[13px] flex items-center gap-2 max-w-md",
                        message.type === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-red-200 bg-red-50 text-red-800",
                      )}
                    >
                      {message.type === "success" && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                      {message.text}
                    </div>
                  )}
                </ScrollReveal>
              </div>

              {/* right — image */}
              <div className="lg:col-span-7 xl:col-span-7 relative">
                <ScrollReveal animation="fade-left" delay={200} duration={900}>
                  <div id="d2h-slideshow" className="relative w-full">
                    <div className="relative w-full h-95 sm:h-115 lg:h-155 xl:h-170 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                      <AnimatePresence initial={false} custom={heroDirection}>
                        <motion.div
                          key={heroIndex}
                          custom={heroDirection}
                          variants={slideVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{
                            x: { type: "spring", stiffness: 300, damping: 32 },
                            opacity: { duration: 0.25 },
                          }}
                          className="absolute inset-0 w-full h-full"
                        >
                          <Image
                            src={HERO_VARIANTS[heroIndex].image}
                            alt={HERO_VARIANTS[heroIndex].tab}
                            fill
                            priority
                            sizes="(max-width:640px) 100vw, (max-width:1024px) 100vw, 70vw"
                            className="object-cover object-center"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* badges anchored to this bleed wrapper so they sit at
                        the image's real corners on desktop, not the narrower
                        grid column */}
                    <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-10 flex flex-col items-start bg-[#0b1329]/95 backdrop-blur-xs px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-[14px] sm:rounded-[18px] shadow-lg select-none border border-white/10">
                      <span className="text-[10px] sm:text-[11.5px] text-slate-400 font-medium tracking-wide  mb-0.5 sm:mb-1">
                        Guaranteed
                      </span>
                      <span className="text-[14px] sm:text-[17px] font-bold text-white leading-none">
                        Internship
                      </span>
                    </div>

                    <span className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-10 inline-flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white/95 backdrop-blur-xs px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg border border-slate-100">
                      <span className="shrink-0 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                      </span>
                      <span className="flex flex-col leading-tight text-left">
                        <span className="text-base sm:text-xl font-bold text-text">
                          96.3%
                        </span>
                        <span className="text-[11px] sm:text-[12.5px] text-text-subtle">
                          placement rate
                        </span>
                      </span>
                    </span>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* social proof + batch progress — full width */}
            {!enrolled && (
              <ScrollReveal
                animation="fade-up"
                delay={180}
                className="mt-8 sm:mt-10"
              >
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[12.5px] font-semibold text-emerald-800">
                      312 people enrolled in the last 24 hours
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <span className="text-[13.5px] font-bold text-text whitespace-nowrap">
                    Batch #14 · {SEATS_PERCENT}% full
                  </span>
                  <span className="text-[13px] font-bold text-blue-600 whitespace-nowrap shrink-0">
                    47 seats left
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-surface-alt overflow-hidden mb-6">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-blue-400 to-blue-600"
                    style={{ width: `${SEATS_PERCENT}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {STAT_TILES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <div
                        key={t.label}
                        className={cn("rounded-2xl p-4 text-center", t.cardBg)}
                      >
                        <span
                          className={cn(
                            "mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg",
                            t.badgeBg,
                          )}
                        >
                          <Icon className={cn("h-4.5 w-4.5", t.iconClass)} />
                        </span>
                        <p
                          className={cn("text-[17px] font-bold", t.valueClass)}
                        >
                          {t.value}
                        </p>
                        <p className="text-[12px] text-text-subtle leading-tight">
                          {t.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>

        {/* ══════════════════════════════
            WHAT YOU GET — VALUE BREAKDOWN
        ══════════════════════════════ */}
        <section
          id="what-you-get"
          className="py-13 sm:py-16 bg-surface-alt border-t border-border"
        >
          <div className="container-x">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-subtle mb-2">
                  What you get · Worth ₹24,999
                </p>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
                  Everything you need to get hired —{" "}
                  <span className="text-brand-600">for ₹999.</span>
                </h2>
                <p className="mt-3 text-text-muted text-[14px] sm:text-[15px] leading-relaxed">
                  Five guided steps, one program, one price. No hidden fees.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid lg:grid-cols-5 gap-4 sm:gap-6 items-stretch">
              {/* left — itemised value list */}
              <div className="lg:col-span-3">
                <div className="h-full rounded-2xl border border-border bg-white overflow-hidden">
                  {VALUE_ITEMS.map((item) => (
                    <div
                      key={item.num}
                      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border last:border-b-0"
                    >
                      <span className="shrink-0 inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 text-[11px] sm:text-[12px] font-bold border border-brand-100">
                        {item.num}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] sm:text-[14.5px] font-bold text-text leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[12px] sm:text-[12.5px] text-text-subtle leading-tight mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <span className="shrink-0 text-[13px] sm:text-[14px] text-text-subtle line-through">
                        {item.price}
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4">
                    <span className="shrink-0 inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-text text-white">
                      <Sigma className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <p className="flex-1 text-[13.5px] sm:text-[14.5px] font-bold text-text">
                      Total value
                    </p>
                    <span className="shrink-0 text-[14px] sm:text-[15px] font-bold text-text">
                      ₹24,999
                    </span>
                  </div>
                </div>
              </div>

              {/* right — you pay only */}
              <div className="lg:col-span-2">
                <div className="h-full flex flex-col items-center justify-center text-center rounded-2xl bg-text px-6 py-8 sm:py-10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-2">
                    You pay only
                  </p>
                  <p className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
                    ₹999
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 px-3 py-1 text-[12px] font-semibold text-brand-300 mb-5">
                    Save ₹24,000 · 96% off
                  </span>

                  <Link href={ctaHref} className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto group inline-flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        "Processing Payment…"
                      ) : enrolled ? (
                        <>
                          Go to Dashboard
                          <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </>
                      ) : (
                        <>
                          Book your seat
                          <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </Link>
                  {!enrolled && (
                    <p className="mt-3 text-[12px] text-white/50">
                      Instant confirmation on WhatsApp
                    </p>
                  )}
                </div>
              </div>
            </div>

            <ScrollReveal animation="fade-up" delay={100}>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-white px-5 sm:px-6 py-4 sm:py-5">
                <div className="text-center sm:text-left">
                  <p className="text-[14px] sm:text-[15px] font-bold text-text">
                    Just want the Assessment + Counselling?
                  </p>
                  <p className="text-[12.5px] text-text-subtle mt-0.5">
                    Try the first two steps on their own for ₹99 — credited
                    toward the full programme if you upgrade later.
                  </p>
                </div>
                <Link
                  href="/direct2hire/assessment-counselling"
                  className="shrink-0"
                >
                  <Button
                    variant="outline"
                    size="md"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Try for ₹99
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            DIRECT2HIRE VS OTHERS
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-white border-t border-border">
          <div className="container-x">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="text-center mb-6 sm:mb-10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-subtle mb-2">
                  Direct2Hire vs others
                </p>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
                  Same outcome. Without the{" "}
                  <span className="text-brand-600">₹1,00,000 bill.</span>
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={80}>
              <div className="max-w-2xl lg:max-w-3xl mx-auto rounded-2xl border border-border overflow-hidden bg-white">
                {/* header */}
                <div className="grid grid-cols-[1fr_84px_104px] sm:grid-cols-[1fr_160px_190px] lg:grid-cols-[1fr_220px_260px] items-stretch bg-surface-alt">
                  <div className="flex items-center px-4 sm:px-6 lg:px-8 py-3 lg:py-4 text-[10px] sm:text-[11px] lg:text-[12px] font-bold uppercase tracking-wider text-text-subtle">
                    What you get
                  </div>
                  <div className="flex items-center justify-center px-2 py-3 lg:py-4 text-[10px] sm:text-[11px] lg:text-[12px] font-bold uppercase tracking-wider text-text-subtle text-center">
                    Others
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-brand-600 px-2 py-3 lg:py-4 text-[10.5px] sm:text-[12px] lg:text-[13px] font-bold text-white">
                    <Star className="h-3 w-3 lg:h-3.5 lg:w-3.5 fill-current shrink-0" />
                    Direct2Hire
                  </div>
                </div>

                {/* rows */}
                {COMPARISON_ROWS.map((label) => (
                  <div
                    key={label}
                    className="grid grid-cols-[1fr_84px_104px] sm:grid-cols-[1fr_160px_190px] lg:grid-cols-[1fr_220px_260px] items-stretch border-t border-border"
                  >
                    <div className="flex items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-[12px] sm:text-[14px] lg:text-[15px] font-semibold text-text">
                      {label}
                    </div>
                    <div className="flex items-center justify-center py-3 sm:py-4 lg:py-5 bg-red-50/70">
                      <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-red-100 text-red-500">
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                      </span>
                    </div>
                    <div className="flex items-center justify-center py-3 sm:py-4 lg:py-5">
                      <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
                      </span>
                    </div>
                  </div>
                ))}

                {/* total cost */}
                <div className="grid grid-cols-[1fr_84px_104px] sm:grid-cols-[1fr_160px_190px] lg:grid-cols-[1fr_220px_260px] items-center border-t border-border bg-surface-alt">
                  <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 text-[12px] sm:text-[14px] lg:text-[15px] font-bold text-text">
                    Total cost
                  </div>
                  <div className="px-1 py-3 sm:py-4 lg:py-5 text-center text-[10.5px] sm:text-[13px] lg:text-[14px] font-semibold text-text-subtle">
                    ₹40,000–1L+
                  </div>
                  <div className="py-3 sm:py-4 lg:py-5 text-center text-[15px] sm:text-[18px] lg:text-[20px] font-black text-brand-600">
                    ₹999
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            HOW YOU GET THERE
        ══════════════════════════════ */}
        <section
          id="journey"
          className="py-13 sm:py-16 bg-surface-alt border-t border-border scroll-mt-20"
        >
          <div className="container-x">
            <div className="mb-6 sm:mb-10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-subtle mb-2">
                How you get there
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                Learn. Intern.{" "}
                <span className="text-gradient-brand">Get hired.</span>
              </h2>
            </div>

            <div className="grid gap-3 sm:gap-6 sm:grid-cols-3">
              {HOW_STEPS.map((step) => (
                <div
                  key={step.title}
                  className={cn(
                    "h-full flex items-center gap-4 sm:block rounded-2xl p-4 sm:p-7 border card-lift",
                    step.dark
                      ? "bg-text border-text text-white"
                      : "bg-white border-border text-text",
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center justify-center h-14 w-14 sm:h-8 sm:w-8 rounded-2xl sm:rounded-lg text-lg sm:text-[12px] font-bold mb-0 sm:mb-4",
                      step.dark
                        ? "bg-brand-600 sm:bg-white/15 text-white"
                        : "bg-brand-50 text-brand-600 border border-brand-200",
                    )}
                  >
                    {step.dark ? (
                      <Star className="h-5 w-5 sm:h-3.5 sm:w-3.5 fill-current" />
                    ) : (
                      step.num
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[17px] mb-0.5 sm:mb-2">
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        "text-[13.5px] leading-relaxed",
                        step.dark ? "text-white/70" : "text-text-muted",
                      )}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            YOU'LL WALK AWAY WITH
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-white border-t border-border">
          <div className="container-x">
            <div className="mb-6 sm:mb-10 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-subtle mb-2">
                You&apos;ll walk away with
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                Proof, not just{" "}
                <span className="text-gradient-brand">a certificate.</span>
              </h2>
            </div>

            {/* mobile — single-card slideshow */}
            <div className="mx-auto max-w-sm sm:hidden">
              <div className="relative rounded-2xl border border-border overflow-hidden card-lift">
                <div className="relative w-full aspect-4/3 overflow-hidden">
                  {WALK_AWAY.map((item, i) => (
                    <div
                      key={item.title}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-500 ease-out",
                        i === walkAwaySlide
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none",
                      )}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="90vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="relative p-5 min-h-24">
                  {WALK_AWAY.map((item, i) => (
                    <div
                      key={item.title}
                      className={cn(
                        "transition-opacity duration-500 ease-out",
                        i === walkAwaySlide
                          ? "opacity-100 relative"
                          : "opacity-0 absolute inset-0 p-5 pointer-events-none",
                      )}
                    >
                      <h3 className="font-semibold text-[16px] text-text mb-1">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-text-muted leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* dots */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {WALK_AWAY.map((item, i) => (
                  <button
                    key={item.title}
                    onClick={() => setWalkAwaySlide(i)}
                    aria-label={`Show ${item.title}`}
                    aria-current={i === walkAwaySlide}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === walkAwaySlide
                        ? "w-5 bg-brand-600"
                        : "w-1.5 bg-border-strong hover:bg-brand-300",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* desktop — all cards side by side */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4 sm:gap-6">
              {WALK_AWAY.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "group relative h-full min-h-70",
                    item.dark && "isolate",
                  )}
                >
                  {item.dark && (
                    <div
                      className="pointer-events-none absolute -top-10 -right-10 -z-10 h-40 w-40 rounded-full bg-brand-200/40 blur-[70px] translate-x-1/4 -translate-y-1/4"
                      aria-hidden
                    />
                  )}
                  <div className="relative h-full rounded-2xl border border-border overflow-hidden card-lift">
                    {item.dark ? (
                      <>
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          quality={100}
                          sizes="(max-width:640px) 90vw, 400px"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <h3 className="font-semibold text-[16px] text-white mb-1">
                            {item.title}
                          </h3>
                          <p className="text-[13px] text-white/75 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative w-full aspect-4/3">
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            sizes="(max-width:640px) 90vw, 400px"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                        <div className="bg-white p-5">
                          <h3 className="font-semibold text-[16px] text-text mb-1">
                            {item.title}
                          </h3>
                          <p className="text-[13px] text-text-muted leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            TESTIMONIALS
        ══════════════════════════════ */}
        {/* <section className="py-13 sm:py-16 bg-surface-alt border-t border-border">
          <div className="container-x">
            <div className="mb-6 sm:mb-10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-subtle mb-2">
                Real, verified students
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                Students just like you,{" "}
                <span className="text-gradient-brand">now hired.</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="h-full rounded-2xl border border-border bg-white p-6 sm:p-7 card-lift"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  </div>
                  <p className="text-[14.5px] text-text leading-relaxed mb-5">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-[12.5px] font-bold">
                      {t.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-[13.5px] font-semibold text-text leading-tight">
                        {t.name}
                      </p>
                      <p className="text-[11.5px] text-text-subtle leading-tight mt-0.5">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> */}
        <Testimonials className="py-13 sm:py-16" />

        {/* ══════════════════════════════
            PRICE CTA BANNER
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-white border-t border-border">
          <div className="container-x">
            <div className="relative overflow-hidden rounded-3xl border border-[#ebf0fc] bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgb(235,240,252,0.4)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Radial Blur Glow in top right */}
              <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl animate-pulse duration-[8000ms]" />

              <div className="relative z-10">
                {enrolled ? (
                  <>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                      You are enrolled in Direct2Hire!
                    </h3>
                    <p className="text-[14.5px] text-slate-500 max-w-[480px] leading-relaxed">
                      Access your AI career roadmap, internship program details,
                      and schedule your mentor calls directly from your
                      dashboard.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ebf0ff] px-3.5 py-1 text-[11px] font-bold text-[#2563eb] mb-5 tracking-wide">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                      OFFER ENDS IN{" "}
                      <span className="font-mono tabular-nums">
                        {offerLabel}
                      </span>
                    </span>
                    <p className="flex items-baseline gap-2.5 mb-4">
                      <span className="text-[38px] sm:text-[46px] font-extrabold text-slate-900 tracking-tight leading-none">
                        ₹999
                      </span>
                      <span className="text-[18px] sm:text-[22px] text-slate-400/80 line-through font-medium leading-none">
                        ₹24,999
                      </span>
                    </p>
                    <p className="text-[14px] sm:text-[15px] text-slate-500 max-w-[480px] leading-relaxed">
                      A 30–minute mentor call and your AI assessment. Your full
                      roadmap — learning, internship, and placement — shared on
                      the call.
                    </p>
                  </>
                )}
              </div>

              <div className="relative z-10 w-full md:w-auto shrink-0 flex flex-col items-center md:items-end gap-2.5">
                <Link href={ctaHref} className="w-full md:w-fit">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full md:w-auto bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold !rounded-2xl px-8 py-3.5 shadow-[0_12px_24px_rgba(37,99,235,0.25)] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(37,99,235,0.35)] hover:scale-[1.01] active:scale-[0.98] inline-flex items-center justify-center gap-2"
                  >
                    {ctaLabel} <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                </Link>
                {!enrolled && (
                  <p className="text-center text-[12px] text-slate-400 w-full">
                    Instant confirmation on WhatsApp
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            DARK CTA BANNER
        ══════════════════════════════ */}
        <section
          className="relative py-16 sm:py-20 overflow-hidden"
          style={{
            background: "linear-gradient(117.44deg, #1E3A8A 0%, #2563EB 100%)",
          }}
        >
          {/* Decorative Bubbles */}
          <div
            className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 rounded-full bg-white/[0.07]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -right-20 w-80 h-80 rounded-full bg-white/[0.07] hidden sm:block"
            aria-hidden="true"
          />

          <div className="relative z-10 container-x text-center flex flex-col items-center">
            {/* Countdown Badge / Pill */}
            {!enrolled && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/20 border border-white/10 px-4 py-1.5 text-xs sm:text-[13px] font-semibold text-white mb-6">
                <span>⏳</span>
                <span className="sm:hidden">12 seats left · ends </span>
                <span className="hidden sm:inline">Offer ends in </span>
                <span className="font-mono tabular-nums">{offerLabel}</span>
              </div>
            )}

            <h2 className="text-3xl sm:text-[40px] font-bold text-white mb-8 tracking-tight leading-tight max-w-3xl">
              {enrolled
                ? "Go to your dashboard."
                : "Secure your seat before it's gone."}
            </h2>

            <Link href={ctaHref} className="w-full sm:w-auto inline-block">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto bg-white! text-[#1E3A8A]! hover:bg-slate-50! font-bold rounded-2xl! px-10 py-4 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 inline-flex items-center justify-center gap-2"
              >
                {ctaLabel} <ArrowRight className="h-[18px] w-[18px] shrink-0" />
              </Button>
            </Link>

            <p className="mt-5 text-[13px] sm:text-[14px] text-white/70 font-medium">
              <span className="sm:hidden">Trusted by 10,000+ students</span>
              <span className="hidden sm:inline">
                NSE-listed company · trusted by 10,000+ students
              </span>
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <StickyBuyBar />
      {/* <StickyMemoSticker /> */}
    </>
  );
}

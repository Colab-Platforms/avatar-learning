"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Star,
  Briefcase,
  BrainCircuit,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button, ScrollReveal, AnimateOnScroll } from "@/components/ui";
import { cn } from "@/lib/utils";
import { StickyBuyBar } from "./StickyBuyBar";
import { UrgencyBanner } from "./UrgencyBanner";
import {
  OfferTimerBar,
  OFFER_BAR_HEIGHT,
  useOfferCountdown,
} from "./OfferTimerBar";
import { useDirect2HireCheckout } from "@/hooks/useDirect2HireCheckout";
import { Testimonials } from "@/components/home/Testimonials/Testimonials";

/* ─── data ─────────────────────────────────────────────────────────── */

const SEATS_TOTAL = 50;
const SEATS_FILLED = 38;
const SEATS_PERCENT = Math.round((SEATS_FILLED / SEATS_TOTAL) * 100);

const STATS = [
  {
    value: "4.9/5",
    label: "3,200+ reviews",
    bg: "bg-surface-alt",
    valueClass: "text-text",
    stars: true,
  },
  {
    value: "96.3%",
    label: "placement rate",
    bg: "bg-brand-50",
    valueClass: "text-brand-600",
  },
  {
    value: "10K+",
    label: "students placed",
    bg: "bg-emerald-50",
    valueClass: "text-emerald-600",
  },
];

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

  useEffect(() => {
    const timer = setInterval(() => {
      setWalkAwaySlide((i) => (i + 1) % WALK_AWAY.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const {
    enroll: _enroll,
    processing,
    message,
    enrolled,
  } = useDirect2HireCheckout();
  const offerLabel = useOfferCountdown();

  const ctaHref = enrolled ? "/dashboard" : "/direct2hire/enroll";
  const ctaLabel = processing
    ? "Processing Payment…"
    : enrolled
      ? "Go to Dashboard"
      : "Claim my seat now";

  return (
    <>
      {!enrolled && (
        <>
          <OfferTimerBar />
          <div style={{ height: OFFER_BAR_HEIGHT }} aria-hidden />
        </>
      )}
      <Navbar offsetTop={enrolled ? 0 : OFFER_BAR_HEIGHT} />

      <main className="min-h-screen bg-white text-text overflow-x-hidden">
        {/* ══════════════════════════════
            HERO
        ══════════════════════════════ */}
        <section className="relative pt-20 pb-6 sm:pt-25 sm:pb-14 overflow-hidden">
          <div
            className="pointer-events-none absolute top-0 right-0 w-[700px] h-[500px] bg-brand-200/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"
            aria-hidden
          />

          <div className="relative container-x">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* left */}
              <div className="lg:col-span-5 xl:col-span-5">
                <ScrollReveal animation="fade-up" delay={0}>
                  <h1 className="h-display font-bold  text-text mb-3 sm:mb-6">
                    Become AI Job Ready in{" "}
                    <span className="text-gradient-brand">Just 120 Days.</span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={80}>
                  <p className="text-text-muted text-[15px] sm:text-[16px] leading-relaxed mb-2 sm:mb-3">
                    <strong>Direct2Hire</strong> helps you build the right
                    skills, gain real experience, and land your first job with
                    expert guidance every step of the way.
                  </p>
                  {/* <p className="text-text-muted text-[15px] sm:text-[16px] leading-relaxed mb-4 sm:mb-8">
                    Start your journey from Career Counseling to AI Learning,
                    Internship and Placement for just{"  "}
                    <span className="text-text-subtle line-through">
                      ₹24,999
                    </span>{" "}
                    <span className="text-brand-600 font-bold text-xl">
                      ₹999/-
                    </span>
                  </p> */}
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={120}>
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

                <ScrollReveal animation="fade-up" delay={150}>
                  {/* <UrgencyBanner /> */}

                  {!enrolled && (
                    <div className="flex items-stretch rounded-2xl border border-border bg-white overflow-hidden w-full sm:w-fit shadow-sm mb-4 sm:mb-5">
                      <div className="min-w-0 flex-1 sm:flex-none px-3 sm:px-5 py-2.5 sm:py-3.5">
                        <p className="text-[10px] sm:text-[11px] text-text-subtle mb-0.5 whitespace-nowrap">
                          Your counselling call
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
                  <div className="relative w-full">
                    <div className="relative w-full aspect-[1672/941] rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] overflow-hidden">
                      <Image
                        src="/counselling-images/new-banner.png"
                        alt="AI-powered career guidance"
                        fill
                        priority
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 100vw, 70vw"
                        className="object-cover object-center"
                      />
                    </div>

                    {/* badges anchored to this bleed wrapper so they sit at
                        the image's real corners on desktop, not the narrower
                        grid column */}
                    <div className="absolute top-3 right-3 sm:top-6 sm:right-6 flex flex-col items-start bg-[#0b1329] px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-[14px] sm:rounded-[18px] shadow-lg select-none">
                      <span className="text-[10px] sm:text-[11.5px] text-slate-400 font-medium tracking-wide  mb-0.5 sm:mb-1">
                        Guaranteed
                      </span>
                      <span className="text-[14px] sm:text-[17px] font-bold text-white leading-none">
                        Internship
                      </span>
                    </div>

                    <span className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 inline-flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white px-3 py-2.5 sm:px-4 sm:py-3 shadow-lg">
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

            {/* batch fill progress */}
            <ScrollReveal
              animation="fade-up"
              delay={180}
              className="mt-8 sm:mt-10"
            >
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-[14px] sm:text-[15px] font-bold text-text">
                  This batch is {SEATS_PERCENT}% full
                </p>
                <p className="text-[13px] sm:text-[14px] font-bold text-brand-600">
                  {SEATS_FILLED} / {SEATS_TOTAL} seats
                </p>
              </div>
              <div className="h-2 sm:h-2.5 w-full rounded-full bg-surface-alt overflow-hidden">
                <div
                  className="h-full rounded-full bg-linear-to-r from-brand-500 to-brand-600"
                  style={{ width: `${SEATS_PERCENT}%` }}
                />
              </div>
            </ScrollReveal>

            {/* stat strip */}
            <ScrollReveal
              animation="fade-up"
              delay={200}
              className="mt-8 sm:mt-10"
            >
              {/* Desktop / Tablet view (>= sm) */}
              <div className="hidden sm:grid sm:grid-cols-4 gap-3 sm:gap-4 items-stretch">
                {STATS.map((s, i) => (
                  <AnimateOnScroll
                    key={s.label}
                    delay={i * 70}
                    className="h-full"
                  >
                    <div className="h-full rounded-2xl border border-border bg-white px-4 sm:px-5 py-4 sm:py-5 card-lift flex items-center">
                      {s.stars ? (
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            {Array.from({ length: 5 }).map((_, j) => (
                              <Star
                                key={j}
                                className="h-3.5 w-3.5 text-amber-400 fill-amber-400"
                              />
                            ))}
                            <span
                              className={cn(
                                "text-xl sm:text-2xl font-bold ml-1 leading-none",
                                s.valueClass,
                              )}
                            >
                              {s.value}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-[12px] text-text-subtle">
                            {s.label}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={cn(
                              "text-2xl sm:text-3xl font-bold leading-none shrink-0",
                              s.valueClass,
                            )}
                          >
                            {s.value}
                          </span>
                          <span className="text-[11px] sm:text-[12px] text-text-subtle leading-tight max-w-14 sm:max-w-17">
                            {s.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </AnimateOnScroll>
                ))}

                <AnimateOnScroll delay={STATS.length * 70} className="h-full">
                  <div className="h-full rounded-2xl bg-text px-4 sm:px-5 py-4 sm:py-5 card-lift flex items-center gap-3">
                    <span className="shrink-0 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 border-brand-400">
                      <ShieldCheck className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-red-400" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] sm:text-[14px] font-bold text-white leading-tight">
                        Placement-backed
                      </p>
                      <p className="text-[10.5px] sm:text-[11.5px] text-white/70 leading-tight">
                        Guarantee on clear terms
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              </div>

              {/* Mobile static view (< sm) */}
              <div className="sm:hidden">
                <div className="grid grid-cols-3 gap-2">
                  {STATS.map((s) => (
                    <div
                      key={s.label}
                      className={cn(
                        "rounded-2xl p-3 text-center card-lift",
                        s.bg,
                      )}
                    >
                      <p className={cn("text-lg font-bold mb-1", s.valueClass)}>
                        {s.value}
                      </p>
                      {s.stars && (
                        <div className="flex items-center justify-center gap-0.5 mb-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className="h-3 w-3 text-amber-400 fill-amber-400"
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-text-subtle">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl bg-text p-3.5 text-left card-lift flex items-center gap-3">
                  <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-400">
                    <ShieldCheck className="h-4 w-4 text-red-400" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white leading-tight">
                      Placement-backed program
                    </p>
                    <p className="text-[10.5px] text-white/70 leading-tight">
                      A placement guarantee, on terms shared upfront.
                    </p>
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
    </>
  );
}

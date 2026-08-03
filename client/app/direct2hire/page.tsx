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

const STATS = [
  { value: "10,000+", label: "Students Got Their Dream Job" },
  { value: "96.3%", label: "Placement Rate" },
  { value: "50+", label: "Placement Partners" },
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
    image: "/counselling-images/new-banner.png",
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
  const [statsSlide, setStatsSlide] = useState(0);
  const [walkAwaySlide, setWalkAwaySlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatsSlide((i) => (i + 1) % STATS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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
      <OfferTimerBar />
      <Navbar offsetTop={OFFER_BAR_HEIGHT} />
      <div style={{ height: OFFER_BAR_HEIGHT }} aria-hidden />

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
                  <h1 className="h-display text-text mb-3 sm:mb-6">
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
                        80%
                      </span>
                      <span className="text-[9px] sm:text-[10px] tracking-wider">
                        OFF
                      </span>
                    </div>
                  </div>

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
                    <p className="text-[12px] text-text-subtle leading-tight">
                      Instant confirmation
                      <br className="hidden sm:block" /> on WhatsApp
                    </p>
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
                  <div className="relative w-full sm:w-[110%] lg:w-[120%] xl:w-[130%]">
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
                    <span className="absolute top-4 right-4 sm:top-6 sm:right-6 inline-flex items-center gap-1.5 rounded-full bg-text/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
                      guaranteed Internship
                    </span>

                    <span className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[13px] font-bold text-text shadow-lg">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      96.3% placement rate
                    </span>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            {/* stat strip */}
            <ScrollReveal
              animation="fade-up"
              delay={200}
              className="mt-8 sm:mt-10"
            >
              {/* Desktop / Tablet view (>= sm) */}
              <div className="hidden sm:grid sm:grid-cols-4 gap-2.5 sm:gap-4">
                {STATS.map((s, i) => (
                  <AnimateOnScroll key={s.label} delay={i * 70}>
                    <div className="rounded-2xl border border-border bg-surface-alt p-3 sm:p-6 text-center card-lift">
                      <p className="text-2xl sm:text-3xl font-bold text-text mb-1">
                        {s.value}
                      </p>
                      <p className="text-[11px] sm:text-[12px] text-text-subtle uppercase tracking-wider">
                        {s.label}
                      </p>
                    </div>
                  </AnimateOnScroll>
                ))}

                <AnimateOnScroll delay={STATS.length * 70}>
                  <div className="h-full rounded-2xl bg-text p-3 sm:p-6 text-left card-lift flex items-center gap-3">
                    <span className="shrink-0 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/15">
                      <ShieldCheck className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
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

              {/* Mobile Carousel View (< sm) */}
              <div className="sm:hidden">
                <div className="relative rounded-2xl border border-border bg-surface-alt p-5 text-center card-lift overflow-hidden min-h-[110px] flex flex-col justify-center items-center">
                  {STATS.map((s, i) => (
                    <div
                      key={s.label}
                      className={cn(
                        "w-full transition-opacity duration-500 ease-out",
                        i === statsSlide
                          ? "opacity-100 relative"
                          : "opacity-0 absolute inset-0 p-5 pointer-events-none flex flex-col justify-center items-center",
                      )}
                    >
                      <p className="text-2xl font-bold text-text mb-1">
                        {s.value}
                      </p>
                      <p className="text-[11.5px] text-text-subtle uppercase tracking-wider">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Carousel dots indicator */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {STATS.map((s, i) => (
                    <button
                      key={s.label}
                      onClick={() => setStatsSlide(i)}
                      aria-label={`Show stat ${i + 1}`}
                      aria-current={i === statsSlide}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === statsSlide
                          ? "w-5 bg-brand-600"
                          : "w-1.5 bg-border-strong hover:bg-brand-300",
                      )}
                    />
                  ))}
                </div>

                <div className="mt-3 rounded-2xl bg-text p-3.5 text-left card-lift flex items-center gap-3">
                  <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-white leading-tight">
                      Placement-backed
                    </p>
                    <p className="text-[10.5px] text-white/70 leading-tight">
                      Guarantee on clear terms
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

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              {HOW_STEPS.map((step) => (
                <div
                  key={step.title}
                  className={cn(
                    "h-full rounded-2xl p-6 sm:p-7 border card-lift",
                    step.dark
                      ? "bg-text border-text text-white"
                      : "bg-white border-border text-text",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-8 w-8 rounded-lg text-[12px] font-bold mb-4",
                      step.dark
                        ? "bg-white/15 text-white"
                        : "bg-brand-50 text-brand-600 border border-brand-200",
                    )}
                  >
                    {step.dark ? (
                      <Star className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      step.num
                    )}
                  </span>
                  <h3 className="font-semibold text-[17px] mb-2">
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
            <div className="rounded-2xl border border-brand-200 bg-linear-to-br from-brand-50 via-white to-brand-100/50 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 mb-3">
                  Offer ends in{" "}
                  <span className="font-mono tabular-nums">{offerLabel}</span>
                </span>
                <p className="leading-none mb-3">
                  <span className="text-4xl sm:text-5xl font-black text-gradient-brand">
                    ₹999
                  </span>{" "}
                  <span className="text-text-subtle line-through text-lg">
                    ₹4,999
                  </span>
                </p>
                <p className="text-[13.5px] text-text-muted max-w-sm leading-relaxed">
                  A 30 minute mentor call and your AI assessment. Your full
                  roadmap — learning, internship, and placement — shared on the
                  call.
                </p>
              </div>
              <Link href={ctaHref} className="w-full md:w-fit shrink-0">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {ctaLabel} <ArrowRight className="h-4 w-4 shrink-0" />
                </Button>
                <p className="mt-2.5 text-center text-[11px] text-text-subtle">
                  Instant confirmation on WhatsApp
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            DARK CTA BANNER
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-text border-t border-border">
          <div className="container-x text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-6">
              Secure your seat before it&apos;s gone.
            </h2>
            <Link href={ctaHref} className="inline-block">
              <Button
                variant="primary"
                size="lg"
                className="bg-white! text-text! hover:bg-white/90!"
              >
                {ctaLabel} <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </Link>
            <p className="mt-4 text-[12.5px] text-white/60">
              NSE-listed company · trusted by 10,000+ students
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <StickyBuyBar />
    </>
  );
}

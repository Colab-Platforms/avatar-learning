"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Star, Play, Check, X } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button, ScrollReveal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { StickyBuyBar } from "./StickyBuyBar";
import { StickyMemoSticker } from "./StickyMemoSticker";
import { UrgencyBanner } from "./UrgencyBanner";
import { useOfferCountdown } from "./OfferTimerBar";
import { D2HCoursesSection } from "./D2HCoursesSection";
import FAQSection from "./FAQSection";
import { useDirect2HireCheckout } from "@/hooks/useDirect2HireCheckout";
import { useAppSelector } from "@/store/hooks";
import { Testimonials } from "@/components/home/Testimonials/Testimonials";
import { RECENT_ENROLLMENTS } from "@/data/socialProof";
import type { ComponentType, CSSProperties } from "react";
import { ChartColumnBig, ChartArea, Palette } from "lucide-react";
import { SiElevenlabs, SiJira, SiN8N, SiZapier } from "react-icons/si";
import {
  RiOpenaiFill,
  RiClaudeFill,
  RiGeminiFill,
  RiGoogleFill,
  RiPerplexityFill,
  RiFigmaFill,
  RiNotionFill,
  RiLinkedinBoxFill,
  RiFileExcel2Fill,
  RiDatabase2Fill,
  RiMetaFill,
} from "react-icons/ri";

/* ─── data ─────────────────────────────────────────────────────────── */

const HERO_VIDEO_URL =
  "https://res.cloudinary.com/w55pkbm8/video/upload/v1788175876/Avatar_India_Web_Page_w7mfvh.mp4";

const SEATS_TOTAL = 50;
const SEATS_FILLED = 38;
const SEATS_PERCENT = Math.round((SEATS_FILLED / SEATS_TOTAL) * 100);

const PLANS = [
  {
    tag: "PRACTITIONER",
    price: "₹499",
    meta: "1 week · certificate",
    popular: true,
  },
  {
    tag: "CAREER+",
    price: "₹4,999",
    meta: "120 days · internship + placement",
    popular: false,
  },
];

const TRUST_MARKS = [
  {
    img: "/nse-logo.png",
    label: "Powered by",
    value: "Avatar India, NSE Listed Company",
  },
  {
    img: "/nep-logo.png",
    label: "Aligned with",
    value: "NEP, National Education Policy",
  },
];

const STAT_TILES = [
  {
    value: "4.5",
    valueClass: "text-text",
    label: "Average learner rating",
    stars: true,
  },
  {
    value: "100%",
    valueClass: "text-blue-600",
    label: "Placement Assistance",
    stars: false,
  },
  {
    value: "10,000+",
    valueClass: "text-emerald-600",
    label: "Students placed",
    stars: false,
  },
  {
    value: "3.6 LPA",
    valueClass: "text-brand-600",
    label: "Average package",
    stars: false,
  },
];

const TRUST_BARS = [
  { label: "AI & Machine Learning", pct: 26 },
  { label: "Prompt Engineering", pct: 21 },
  { label: "Data & AI Analytics", pct: 19 },
  { label: "Generative AI & Content", pct: 18 },
  { label: "AI Support & Operations", pct: 16 },
];

const FIVE_STEPS = [
  {
    num: "1",
    numClass: "bg-emerald-500 text-white",
    title: "Assessment",
    desc: "We find the AI track that fits you best.",
    tag: "Career+ only",
    tagClass: "text-emerald-400",
  },
  {
    num: "2",
    numClass: "bg-emerald-500 text-white",
    title: "Counseling",
    desc: "A mentor guides you 1-on-1 through the 120-day path.",
    tag: "Career+ only",
    tagClass: "text-emerald-400",
  },
  {
    num: "3",
    numClass: "bg-blue-600 text-white",
    title: "Learning",
    desc: "Easy video lessons you can watch anytime. Career+ unlocks more.",
    tag: "Both plans",
    tagClass: "text-slate-400",
  },
  {
    num: "4",
    numClass: "bg-emerald-500 text-white",
    title: "Internship",
    desc: "Real, guaranteed work on live company projects.",
    tag: "Career+ only",
    tagClass: "text-emerald-400",
  },
  {
    num: "5",
    numClass: "bg-emerald-500 text-white",
    title: "Placement",
    desc: "We connect you to hiring companies until you get the job.",
    tag: "Career+ only",
    tagClass: "text-emerald-400",
  },
];

const PLAN_DETAILS = [
  {
    tag: "PRACTITIONER · BEGINNER",
    tagClass: "text-white/50",
    badge: "1 week",
    price: "₹499",
    sub: "Learn your first AI skill in a single week.",
    popular: true,
    items: [
      "Beginner-friendly, no prerequisites",
      "Week-long course",
      "Self-Paced Learning (60–90 mins)",
      "Quiz",
      "Certificate",
    ],
  },
  {
    tag: "CAREER+ · PRO",
    tagClass: "text-brand-600",
    badge: "120 days",
    price: "₹4,999",
    sub: "The full path from learning all the way to a job.",
    popular: false,
    items: [
      "Career quiz + counseling",
      "1 month self-paced learning",
      "2 month internship",
      "Mentor support",
      "Placement support",
    ],
  },
];

const PLAN_MODALS = [
  {
    eyebrow: "PRACTITIONER · BEGINNER · 1 WEEK",
    name: "Practitioner",
    tagline:
      "Best for students who want to test AI cheaply before committing to a longer path.",
    price: "₹499",
    features: [
      {
        title: "Beginner-friendly, no prerequisites",
        desc: "No coding or prior experience needed — the course starts from the basics and uses free tools.",
      },
      {
        title: "Week-long course",
        desc: "Pick any one course from the catalogue and finish it within the week, at your own pace.",
      },
      {
        title: "Self-Paced Learning (60–90 mins)",
        desc: "A recorded session walks you through the tool end to end. Nothing is live, so you never miss a class.",
      },
      {
        title: "Quiz",
        desc: "A short quiz at the end confirms you actually picked up the skill.",
      },
      {
        title: "Certificate",
        desc: "Pass the quiz and you get a completion certificate for your resume and LinkedIn.",
      },
    ],
    outcome:
      "Understand how AI tools work, know which AI field fits you best, and finish the week with a certificate in hand.",
  },
  {
    eyebrow: "CAREER+ · PRO · 120 DAYS",
    name: "Career+",
    tagline: "The full 120-day path from your first lesson to a real job.",
    price: "₹4,999",
    features: [
      {
        title: "Career quiz + counseling",
        desc: "An assessment picks your track, then a mentor plans the 120 days with you 1-on-1.",
      },
      {
        title: "1 month self-paced learning",
        desc: "Recorded lessons and assignments build the core skills for your chosen AI track. Nothing is live.",
      },
      {
        title: "2 month internship",
        desc: "Two months of real project work with a company, ending in an internship certificate.",
      },
      {
        title: "Internship certificate",
        desc: "A certificate from the company you interned with, on top of your course certificate.",
      },
      {
        title: "Placement support",
        desc: "We connect you with hiring companies and keep supporting you until you land a job.",
      },
    ],
    outcome:
      "Finish a two-month internship on live projects, build a portfolio recruiters trust, and get support until you land a job.",
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

const COMPARE_ROWS: {
  label: string;
  others: string;
  d2h: string;
}[] = [
  { label: "Self-paced video lessons", others: "check", d2h: "check" },
  { label: "Industry-recognised certificate", others: "check", d2h: "check" },
  { label: "Placement assistance", others: "Add-on", d2h: "check" },
  { label: "Try before you commit", others: "Varies", d2h: "From ₹499" },
  {
    label: "Course matched to an assessment",
    others: "Sometimes",
    d2h: "Every learner",
  },
  {
    label: "Guaranteed internship on live projects",
    others: "Add-on",
    d2h: "In Career+",
  },
  { label: "Transparent one-time pricing", others: "Varies", d2h: "check" },
];

const TOOLS: {
  name: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { name: "ChatGPT", Icon: RiOpenaiFill, color: "#0DA37F" },
  { name: "Claude", Icon: RiClaudeFill, color: "#D97757" },
  { name: "Gemini", Icon: RiGeminiFill, color: "#1C69FF" },
  { name: "Google ImageFX", Icon: RiGoogleFill, color: "#4285F4" },
  { name: "ElevenLabs", Icon: SiElevenlabs, color: "#0F172A" },
  { name: "Perplexity", Icon: RiPerplexityFill, color: "#20808D" },
  { name: "Jira", Icon: SiJira, color: "#0052CC" },
  { name: "Figma", Icon: RiFigmaFill, color: "#F24E1E" },
  { name: "Notion", Icon: RiNotionFill, color: "#0F172A" },
  { name: "n8n", Icon: SiN8N, color: "#EA4B71" },
  { name: "Zapier", Icon: SiZapier, color: "#FF4F00" },
  { name: "LinkedIn Recruiter", Icon: RiLinkedinBoxFill, color: "#0A66C2" },
  { name: "Excel + AI", Icon: RiFileExcel2Fill, color: "#217346" },
  { name: "Power BI", Icon: ChartColumnBig, color: "#E8A400" },
  { name: "SQL", Icon: RiDatabase2Fill, color: "#00618A" },
  { name: "Tableau", Icon: ChartArea, color: "#1F6FB4" },
  { name: "Meta Ads", Icon: RiMetaFill, color: "#0866FF" },
  { name: "Canva", Icon: Palette, color: "#8B3DFF" },
];

/* ─── page ──────────────────────────────────────────────────────────── */

export default function Direct2HirePage() {
  const [walkAwaySlide, setWalkAwaySlide] = useState(0);
  const [enrollmentIndex, setEnrollmentIndex] = useState(0);
  const [modalPlan, setModalPlan] = useState<number | null>(null);
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(false);

  useEffect(() => {
    if (modalPlan === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalPlan(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [modalPlan]);

  useEffect(() => {
    const timer = setInterval(() => {
      setWalkAwaySlide((i) => (i + 1) % WALK_AWAY.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEnrollmentIndex((i) => (i + 1) % RECENT_ENROLLMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const { processing, message, enrolled } = useDirect2HireCheckout();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);
  const offerLabel = useOfferCountdown();
  const [offerHrs, offerMin, offerSec] = offerLabel.split(":");

  // Not logged in: send through login first, then on to the courses page.
  const ctaHref =
    hasHydrated && !user ? "/login?redirect=/courses" : "/courses";
  const ctaLabel = processing ? "Processing Payment…" : "Enroll Now";

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
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-start lg:items-stretch">
              {/* left */}
              <div className="lg:col-span-6">
                <ScrollReveal animation="fade-up" delay={0}>
                  {!enrolled && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold text-text-muted mb-4 sm:mb-5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Seats filling fast
                    </span>
                  )}
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={40}>
                  <h1 className="h-display font-bold text-text mb-3 sm:mb-5">
                    Learn AI. Get certified.
                    <br />
                    <span className="text-gradient-brand">Get hired.</span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={80}>
                  <p className="text-text-muted text-[15px] sm:text-[16px] leading-relaxed mb-5 sm:mb-6 max-w-lg">
                    Start with a 1-week AI course for ₹499, or take the full
                    120-day path with an internship and placement support.
                  </p>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={100}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5 sm:mb-6 max-w-lg">
                    {TRUST_MARKS.map((m) => (
                      <div
                        key={m.value}
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3 py-2.5"
                      >
                        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                          <Image
                            src={m.img}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-contain p-0.5"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] text-text-subtle leading-tight">
                            {m.label}
                          </p>
                          <p className="text-[11.5px] font-bold text-text leading-tight">
                            {m.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={120}>
                  <div className="flex items-center justify-between mb-2.5 max-w-lg">
                    <p className="text-[13px] font-bold text-text">
                      Pick your plan
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-5 max-w-lg">
                    {PLANS.map((plan) => (
                      <div
                        key={plan.tag}
                        className={cn(
                          "relative overflow-hidden rounded-2xl border px-4 py-3.5",
                          plan.popular
                            ? "bg-text border-text text-white"
                            : "bg-white border-border text-text",
                        )}
                      >
                        {plan.popular && (
                          <span className="absolute right-0 top-0 rounded-bl-lg bg-amber-500 px-2 py-0.5 text-[8.5px] font-black tracking-wider text-white">
                            POPULAR
                          </span>
                        )}
                        <p
                          className={cn(
                            "text-[10px] font-bold tracking-wider mb-1.5",
                            plan.popular ? "text-white/50" : "text-text-subtle",
                          )}
                        >
                          {plan.tag}
                        </p>
                        <p className="text-[22px] sm:text-[26px] font-black leading-none tracking-tight">
                          {plan.price}
                        </p>
                        <p
                          className={cn(
                            "text-[11px] leading-tight mt-1.5",
                            plan.popular ? "text-white/60" : "text-text-subtle",
                          )}
                        >
                          {plan.meta}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={140}>
                  <div className="hidden sm:flex items-center gap-2 mb-4 max-w-lg">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                      <Play className="h-3 w-3 fill-current" />
                    </span>
                    <p className="text-[12.5px] text-text-muted">
                      Watch the video on the right —{" "}
                      <strong className="font-semibold text-text">
                        every plan &amp; outcome explained
                      </strong>
                    </p>
                  </div>

                  {!enrolled && (
                    <div className="inline-flex items-center gap-3 rounded-xl bg-text px-4 py-2 mb-4">
                      <span className="text-[11px] font-medium text-white/60">
                        Offer ends in
                      </span>
                      <span className="flex items-center gap-1.5 font-mono tabular-nums text-white">
                        {[offerHrs, offerMin, offerSec].map((v, i) => (
                          <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span className="text-white/40">:</span>}
                            <span className="rounded-md bg-white/10 px-1.5 py-1 text-[13px] font-black leading-none">
                              {v}
                            </span>
                          </span>
                        ))}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row w-full sm:w-auto items-start sm:items-center gap-2 sm:gap-4">
                    <Link href={ctaHref} className="w-full sm:w-auto">
                      <Button
                        variant="primary"
                        size="lg"
                        className={cn(
                          "w-full sm:w-auto group inline-flex items-center justify-center gap-2",
                          !processing && "anim-shake",
                        )}
                      >
                        {processing ? (
                          "Processing Payment…"
                        ) : (
                          <>
                            Enroll Now
                            <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </>
                        )}
                      </Button>
                    </Link>
                    {!enrolled && (
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <p className="text-[12px] text-text-subtle leading-tight">
                          <strong className="text-text font-semibold">
                            {RECENT_ENROLLMENTS[enrollmentIndex].name}
                          </strong>{" "}
                          just booked a seat ·{" "}
                          {RECENT_ENROLLMENTS[enrollmentIndex].time}
                        </p>
                      </div>
                    )}
                  </div>

                  {!enrolled && (
                    <p className="text-[11.5px] text-text-subtle mt-3">
                      Instant confirmation on WhatsApp
                    </p>
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

              {/* right — video */}
              <div className="lg:col-span-6 relative flex">
                <ScrollReveal
                  animation="fade-left"
                  delay={200}
                  duration={900}
                  className="w-full lg:h-full"
                >
                  <div className="relative w-full h-72 sm:h-96 lg:h-full lg:min-h-120 rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-slate-200">
                    {heroVideoPlaying ? (
                      <video
                        src={HERO_VIDEO_URL}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        playsInline
                        controls
                        preload="auto"
                        title="Direct2Hire — every plan & outcome explained"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setHeroVideoPlaying(true)}
                        aria-label="Play intro video"
                        className="group absolute inset-0"
                      >
                        <Image
                          src="/Direct2hire/d2h-thumbnail.png"
                          alt="Direct2Hire intro video"
                          fill
                          priority
                          sizes="(max-width:1024px) 100vw, 50vw"
                          className="object-cover"
                        />
                        <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow-lg transition-transform group-hover:scale-105">
                            <Play className="h-6 w-6 fill-current translate-x-0.5" />
                          </span>
                        </span>
                      </button>
                    )}
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-2xl border border-border overflow-hidden">
                  {STAT_TILES.map((t) => (
                    <div key={t.label} className="bg-white px-3 py-4 text-center">
                      <p
                        className={cn(
                          "text-[18px] sm:text-[20px] font-bold flex items-center justify-center gap-1",
                          t.valueClass,
                        )}
                      >
                        {t.value}
                        {t.stars && (
                          <span className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-3 w-3 fill-amber-400 text-amber-400"
                              />
                            ))}
                          </span>
                        )}
                      </p>
                      <p className="text-[12px] text-text-subtle leading-tight mt-0.5">
                        {t.label}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </div>
        </section>

        {/* ══════════════════════════════
            WHY STUDENTS TRUST US
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-surface-alt border-t border-border">
          <div className="container-x">
            <ScrollReveal animation="fade-up">
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
                  {/* left */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-3">
                      Why students trust us
                    </p>
                    <p className="text-5xl sm:text-6xl font-black tracking-tight text-text leading-none">
                      90.34%
                    </p>
                    <p className="text-brand-600 font-semibold text-[15px] mt-2">
                      of students get placed
                    </p>
                    <p className="text-text-muted text-[14px] leading-relaxed mt-4 max-w-md">
                      Into the most in-demand AI roles right now. Here&apos;s
                      where last year&apos;s batch landed.
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
                      <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[12px] font-black text-white">
                        10K+
                      </span>
                      <span className="text-[12.5px] font-semibold text-emerald-800">
                        students already hired
                      </span>
                    </span>
                  </div>

                  {/* right — bars */}
                  <div className="space-y-4">
                    {TRUST_BARS.map((bar) => (
                      <div key={bar.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] font-semibold text-text">
                            {bar.label}
                          </span>
                          <span className="text-[13px] font-bold text-brand-600">
                            {bar.pct}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-blue-400 to-blue-600"
                            style={{ width: `${bar.pct * 3}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            FIVE STEPS, ONE PATH
        ══════════════════════════════ */}
        <section
          id="journey"
          className="py-14 sm:py-20 bg-[#0b1220] scroll-mt-20"
        >
          <div className="container-x">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-[12px] font-semibold text-white mb-6">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Trusted path · 10K+ students placed
              </span>
              <h2 className="text-3xl sm:text-[40px] font-bold tracking-tight text-white">
                Five steps, one path to a job.
              </h2>
              <p className="mt-3 text-white/60 text-[14px] sm:text-[15px] leading-relaxed">
                One clear journey.{" "}
                <strong className="font-semibold text-white">
                  Practitioner
                </strong>{" "}
                covers the first steps; only{" "}
                <strong className="font-semibold text-white">Career+</strong>{" "}
                takes you all the way to a job.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {FIVE_STEPS.map((step) => (
                <div
                  key={step.title}
                  className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold",
                      step.numClass,
                    )}
                  >
                    {step.num}
                  </span>
                  <h3 className="mt-4 font-semibold text-[16px] text-white">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/60 flex-1">
                    {step.desc}
                  </p>
                  <div className="my-3 h-px bg-white/10" />
                  <p className={cn("text-[12px] font-semibold", step.tagClass)}>
                    {step.tag}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <D2HCoursesSection />

        {/* ══════════════════════════════
            CHOOSE YOUR PLAN
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-surface-alt border-t border-border">
          <div className="container-x">
            <ScrollReveal animation="fade-up">
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-subtle mb-2">
                  Choose your plan
                </p>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
                  Two ways to get started.
                </h2>
                <p className="mt-3 text-text-muted text-[14px] sm:text-[15px] leading-relaxed">
                  Learn one AI skill in a week, or take the full 120-day path
                  with an internship and placement support.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto items-center">
              {PLAN_DETAILS.map((plan, planIdx) => (
                <ScrollReveal
                  key={plan.tag}
                  animation="fade-up"
                  delay={plan.popular ? 0 : 80}
                  className="h-full"
                >
                  <div
                    className={cn(
                      "relative flex h-full flex-col rounded-3xl border p-6 sm:p-7",
                      plan.popular
                        ? "bg-text border-text text-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.45)] md:scale-[1.03]"
                        : "bg-white border-border text-text",
                    )}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black tracking-wider text-white shadow-sm">
                        MOST POPULAR
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={cn(
                          "text-[10.5px] font-bold tracking-wider",
                          plan.tagClass,
                        )}
                      >
                        {plan.tag}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                          plan.popular
                            ? "bg-white/10 text-white/80"
                            : "bg-surface-alt text-text-subtle border border-border",
                        )}
                      >
                        {plan.badge}
                      </span>
                    </div>

                    <p className="mt-3 flex items-baseline gap-2">
                      <span className="text-[34px] sm:text-[40px] font-black leading-none tracking-tight">
                        {plan.price}
                      </span>
                      <span
                        className={cn(
                          "text-[12px]",
                          plan.popular ? "text-white/50" : "text-text-subtle",
                        )}
                      >
                        one-time
                      </span>
                    </p>

                    <p
                      className={cn(
                        "mt-2 text-[13px] leading-relaxed",
                        plan.popular ? "text-white/60" : "text-text-muted",
                      )}
                    >
                      {plan.sub}
                    </p>

                    <p
                      className={cn(
                        "mt-6 mb-3 text-[10px] font-bold uppercase tracking-wider",
                        plan.popular ? "text-white/40" : "text-text-subtle",
                      )}
                    >
                      What you get
                    </p>
                    <ul className="space-y-2.5 flex-1">
                      {plan.items.map((item, i) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-[13px]"
                        >
                          <span
                            className={cn(
                              "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                              plan.popular
                                ? "bg-white/10 text-white/70"
                                : "bg-brand-50 text-brand-600 border border-brand-100",
                            )}
                          >
                            {i + 1}
                          </span>
                          <span
                            className={cn(
                              plan.popular ? "text-white/85" : "text-text",
                            )}
                          >
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7 flex items-center gap-3">
                      <Link href={ctaHref} className="flex-1">
                        <Button
                          variant="primary"
                          size="md"
                          className={cn(
                            "w-full inline-flex items-center justify-center gap-1.5",
                            plan.popular &&
                              "bg-white! text-brand-600! hover:bg-slate-50!",
                          )}
                        >
                          Enroll Now
                          <ArrowRight className="h-4 w-4 shrink-0" />
                        </Button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setModalPlan(planIdx)}
                        className={cn(
                          "shrink-0 rounded-xl border px-4 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer",
                          plan.popular
                            ? "border-white/20 text-white/80 hover:bg-white/5"
                            : "border-border text-text-muted hover:bg-surface-alt",
                        )}
                      >
                        Know more
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            THE HONEST COMPARISON
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-white border-t border-border">
          <div className="container-x">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 mb-2">
                  The honest comparison
                </p>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
                  How we compare, fairly.
                </h2>
                <p className="mt-3 text-text-muted text-[14px] sm:text-[15px] leading-relaxed">
                  Many established platforms deliver excellent training and
                  place students too. Here&apos;s an honest look at where
                  we&apos;re similar — and where Direct2Hire is built
                  differently on access and structure.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={80}>
              <div className="max-w-3xl mx-auto rounded-2xl border border-border overflow-hidden bg-white">
                {/* header */}
                <div className="grid grid-cols-[1fr_110px_120px] sm:grid-cols-[1fr_180px_200px] items-stretch bg-surface-alt">
                  <div className="flex items-center px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-subtle">
                    What you get
                  </div>
                  <div className="flex items-center justify-center px-2 py-3 sm:py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-subtle text-center">
                    Other AI platforms
                  </div>
                  <div className="flex items-center justify-center gap-1.5 bg-brand-50 px-2 py-3 sm:py-4 text-[11px] sm:text-[12.5px] font-bold text-brand-700">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current shrink-0" />
                    Direct2Hire
                  </div>
                </div>

                {/* rows */}
                {COMPARE_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1fr_110px_120px] sm:grid-cols-[1fr_180px_200px] items-stretch border-t border-border"
                  >
                    <div className="flex items-center px-4 sm:px-6 py-3.5 sm:py-4 text-[12.5px] sm:text-[14px] font-semibold text-text">
                      {row.label}
                    </div>
                    <div className="flex items-center justify-center px-2 py-3.5 sm:py-4 text-center text-[11.5px] sm:text-[13px] font-medium text-text-subtle">
                      {row.others === "check" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        row.others
                      )}
                    </div>
                    <div className="flex items-center justify-center px-2 py-3.5 sm:py-4 bg-brand-50/60 text-center text-[11.5px] sm:text-[13px] font-bold text-brand-700">
                      {row.d2h === "check" ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        row.d2h
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <p className="mt-4 text-center text-[11.5px] text-text-subtle max-w-2xl mx-auto leading-relaxed">
              Reflects commonly available program structures, not any single
              provider. Our focus: affordable access, an assessment-led start,
              and transparent pricing.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════
            TOOLS YOU'LL MASTER
        ══════════════════════════════ */}
        <section className="py-13 sm:py-16 bg-surface-alt border-t border-border">
          <div className="container-x">
            <ScrollReveal animation="fade-up">
              <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-subtle mb-2">
                  You will master the tools
                </p>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-text">
                  Hands-on with the AI tools{" "}
                  <span className="text-brand-600">
                    companies actually use.
                  </span>
                </h2>
                <p className="mt-3 text-text-muted text-[14px] sm:text-[15px] leading-relaxed">
                  You learn by doing the actual work, on the actual tools.
                </p>
              </div>
            </ScrollReveal>

            {/* Desktop / tablet — static grid */}
            <ScrollReveal animation="fade-up" delay={80}>
              <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto">
                {TOOLS.map((tool) => (
                  <div
                    key={tool.name}
                    aria-label={tool.name}
                    style={{ "--tool": tool.color } as CSSProperties}
                    className="group relative flex aspect-square items-center justify-center rounded-2xl border border-border bg-white p-2 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_30px_-12px_var(--tool)] hover:border-(--tool)"
                  >
                    <tool.Icon className="h-8 w-8 text-(--tool) transition-transform duration-300 group-hover:scale-110" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-(--tool) bg-white px-2.5 py-1 text-[11.5px] font-bold text-(--tool) opacity-0 shadow-lg transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                      {tool.name}
                      <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-(--tool) bg-white" />
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Mobile — two-row infinite marquee, opposite directions */}
            <div className="sm:hidden space-y-3">
              {[
                { row: TOOLS.slice(0, 9), direction: "animate-marquee-left" },
                { row: TOOLS.slice(9), direction: "animate-marquee-right" },
              ].map(({ row, direction }, rowIndex) => (
                <div key={rowIndex} className="relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-linear-to-r from-surface-alt to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-surface-alt to-transparent" />
                  <div className={cn("flex w-max gap-2.5", direction)}>
                    {[...row, ...row].map((tool, i) => (
                      <div
                        key={`${tool.name}-${i}`}
                        style={{ "--tool": tool.color } as CSSProperties}
                        className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-white py-2 pl-2 pr-5 shadow-xs"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--tool)/10">
                          <tool.Icon className="h-4.5 w-4.5 text-(--tool)" />
                        </span>
                        <span className="whitespace-nowrap text-[13.5px] font-semibold text-text">
                          {tool.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-[12.5px] font-medium text-text-subtle">
              and many more
            </p>
          </div>
        </section>

        {/* ══════════════════════════════
            YOU'LL WALK AWAY WITH
        ══════════════════════════════ */}
        {/* <section className="py-13 sm:py-16 bg-white border-t border-border">
          <div className="container-x">
            <div className="mb-6 sm:mb-10 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-text-subtle mb-2">
                You&apos;ll walk away with
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                Proof, not just{" "}
                <span className="text-gradient-brand">a certificate.</span>
              </h2>
            </div> */}

        {/* mobile — single-card slideshow */}
        {/* <div className="mx-auto max-w-sm sm:hidden">
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
                        quality={"100"}
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
              </div> */}

        {/* dots */}
        {/* <div className="flex items-center justify-center gap-1.5 mt-4">
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
            </div> */}

        {/* desktop — all cards side by side */}
        {/* <div className="hidden sm:grid sm:grid-cols-3 gap-4 sm:gap-6">
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
        </section> */}

        <Testimonials className="py-13 sm:py-16" />

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

        <FAQSection />
      </main>

      {/* ══════════════════════════════
          PLAN DETAIL MODAL
      ══════════════════════════════ */}
      {modalPlan !== null && (
        <div
          className="fixed inset-0 z-80 flex items-start justify-center overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={PLAN_MODALS[modalPlan].name}
          onClick={() => setModalPlan(null)}
        >
          <div
            className="relative w-full max-w-md my-auto rounded-3xl bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalPlan(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-text-subtle hover:bg-surface-alt hover:text-text transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 sm:p-7">
              <p className="text-[10.5px] font-bold tracking-wider text-brand-600">
                {PLAN_MODALS[modalPlan].eyebrow}
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-text">
                {PLAN_MODALS[modalPlan].name}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
                {PLAN_MODALS[modalPlan].tagline}
              </p>

              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-[34px] font-black leading-none tracking-tight text-text">
                  {PLAN_MODALS[modalPlan].price}
                </span>
                <span className="text-[12px] text-text-subtle">one-time</span>
              </p>

              <div className="my-5 h-px bg-border" />

              <ul className="space-y-4">
                {PLAN_MODALS[modalPlan].features.map((f) => (
                  <li key={f.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-text leading-tight">
                        {f.title}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-text-subtle">
                        {f.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-6 rounded-2xl border border-border bg-surface-alt p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 mb-1.5">
                  Outcome of this plan
                </p>
                <p className="text-[12.5px] leading-relaxed text-text-muted">
                  {PLAN_MODALS[modalPlan].outcome}
                </p>
              </div>

              <Link href={ctaHref} onClick={() => setModalPlan(null)}>
                <Button
                  variant="primary"
                  size="lg"
                  className="mt-5 w-full inline-flex items-center justify-center gap-1.5"
                >
                  Enroll Now
                </Button>
              </Link>
              <p className="mt-3 text-center text-[11px] text-text-subtle">
                Instant confirmation on WhatsApp · 7-day money-back
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
      {/* <StickyBuyBar /> */}
      {/* <StickyMemoSticker /> */}
    </>
  );
}

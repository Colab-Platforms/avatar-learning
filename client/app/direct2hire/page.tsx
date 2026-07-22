"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Video,
  BrainCircuit,
  FileText,
  Target,
  Route,
  FileCheck2,
  XCircle,
  CheckCircle2,
  Bot,
  BadgePercent,
  Map,
  Zap,
  ChevronDown,
  Sparkles,
  IndianRupee,
  Briefcase,
  MessageCircle,
  Users,
  Award,
  Calculator,
  Flame,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  ScrollReveal,
  AnimateOnScroll,
  Button,
  HelpWidget,
  ShinyText,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { StickyBuyBar } from "./StickyBuyBar";
import { UrgencyBanner } from "./UrgencyBanner";
import { useDirect2HireCheckout } from "@/hooks/useDirect2HireCheckout";

/* ─── data ─────────────────────────────────────────────────────────── */

const STATS = [
  { value: "10,000+", label: "Students Got Their Dream Job" },
  { value: "96.3%", label: "Placement Rate" },
  { value: "50+", label: "Corporates Listed as Placement Partners" },
];

const WHO_FOR = [
  {
    image: "/counselling-images/Collage-Students.png",
    title: "College Students",
    desc: "Already picked a degree but unsure if it leads to a career you'll actually enjoy.",
  },
  {
    image: "/counselling-images/Final-Year-Students.png",
    title: "Final-Year Students & Freshers",
    desc: "Need real skills, an internship, and a job plan before or right after graduating.",
  },
  {
    image: "/counselling-images/Early-Professionals.png",
    title: "Early Professionals",
    desc: "Feel stuck in the wrong job and ready to switch to a high-growth, future-proof career.",
  },
];

const OUTCOMES = [
  "Complete clarity on the right career path for you — no more second-guessing",
  "A personalized, step-by-step roadmap mapped to your goals and timeline",
  "Practical, in-demand AI skills that employers are actively hiring for",
  "Real, hands-on experience through a guided internship, not just theory",
  "Active placement support until you land an offer, not just a certificate",
];

const JOURNEY_STEPS = [
  {
    num: "01",
    icon: BrainCircuit,
    title: "AI-Powered Quiz",
    desc: "Complete a short questionnaire in your dashboard and receive an AI-powered course recommendation tailored to your goals, interests, and personality.",
  },
  {
    num: "02",
    icon: Users,
    title: "Career Counseling",
    desc: "A 1-on-1 session with an experienced counselor to discuss your goals, strengths, and next steps — scheduled after your AI assessment.",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "AI Learning Programs",
    desc: "A structured, mentor-guided program that builds the practical AI and digital skills employers are actively hiring for.",
  },
  {
    num: "04",
    icon: Briefcase,
    title: "Guaranteed Internship",
    desc: "Apply what you've learned in a real internship with a partner company — the experience that makes your resume stand out.",
  },
  {
    num: "05",
    icon: Award,
    title: "Job Placement Support",
    desc: "Get matched with hiring partners, prepped for interviews, and supported until you land an offer.",
  },
];

const WITHOUT_PLAN = [
  "4 years and ₹8–15 lakhs spent on the wrong degree",
  "Graduating with no clarity about career options",
  "Struggling to get internships or jobs after college",
  "Regretting the decision for years",
];

const WITH_SESSION = [
  "Get clarity on the right career path in 30 minutes",
  "Receive a personalised roadmap",
  "Understand high-growth skills and opportunities",
  "Start your journey with confidence and direction",
];

const INCLUDED = [
  {
    icon: Video,
    title: "30-Minute 1-on-1 Consultation",
    desc: "Speak directly with an experienced career counselor who understands your background and goals.",
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Career Assessment",
    desc: "Get data-backed insights into your personality, strengths, interests, and suitable career paths.",
  },
  {
    icon: FileText,
    title: "Personalized Career Report",
    desc: "Receive a detailed report with your assessment results and career alignment analysis.",
  },
  {
    icon: Target,
    title: "Top Career Recommendations",
    desc: "Get 3–5 well-researched career options tailored to your profile, skills, and interests.",
  },
  {
    icon: Route,
    title: "Extensive Learning Roadmap",
    desc: "A clear, step-by-step action plan with skills to learn, courses, and milestones for the next few days.",
  },
  {
    icon: FileCheck2,
    title: "Resume Review + Feedback",
    desc: "Get expert feedback on your current resume with specific suggestions to improve it.",
  },
];

const BONUS_BENEFITS = [
  "Internship Guidance",
  "7 Day WhatsApp Mentorship",
  "Community Access",
];

const VALUE_STACK = [
  { icon: Users, label: "Career Counseling Session", price: "₹2000/-" },
  {
    icon: BrainCircuit,
    label: "AI Powered Quiz + Feedback",
    price: "₹2000/-",
  },
  {
    icon: Sparkles,
    label: "AI Basic/AI Social Media Learning Program",
    price: "₹10,000/-",
  },
  { icon: Briefcase, label: "Guaranteed Internship", price: "₹5,500/-" },
  { icon: Target, label: "Job Placement Support", price: "₹5,499/-" },
  { icon: Calculator, label: "Total", price: "₹24,999/-" },
];

const DIFFERENTIATORS = [
  {
    icon: Bot,
    title: "AI + Human Expertise",
    desc: "We combine powerful AI assessments with experienced human counselors who deeply understand the education system and job market.",
  },
  {
    icon: BadgePercent,
    title: "Affordable & Transparent",
    desc: "Most platforms charge ₹2,000–₹15,000 for similar sessions. We deliver real clarity and a complete roadmap at just ₹999 with no hidden costs.",
  },
  {
    icon: Map,
    title: "Actionable Roadmap + Ongoing Support",
    desc: "You don't just get advice. You walk away with a personalized plan and 7 days of direct WhatsApp mentorship to stay on track.",
  },
  {
    icon: Zap,
    title: "Fast, Focused & Actionable",
    desc: "Get real clarity and a clear plan in just one 30-minute session — no long, confusing processes.",
  },
];

const FAQS = [
  {
    q: "Is the ₹999 session the entire Direct2Hire program?",
    a: "It covers your first steps in Direct2Hire — an AI assessment with a personalized course recommendation, plus a 1-on-1 counseling session. Based on your results, you can continue into the AI Fundamentals Program, a guaranteed internship, and placement support to complete the full 5-step journey.",
  },
  {
    q: "Am I locked into the full program after the session?",
    a: "No. The ₹999 session stands on its own — you walk away with real clarity and a roadmap either way. Continuing to the AI program, internship, and placement is entirely optional and depends on fit.",
  },
  {
    q: "Is ₹999 really enough for proper guidance?",
    a: "Yes. You get an AI-powered assessment with a course recommendation, a 30-minute 1-on-1 counseling consultation, a personalized report, and a step-by-step roadmap. We keep the price low so every student can afford real guidance, not because we cut corners.",
  },
  {
    q: "Who will conduct the session?",
    a: "Your session is conducted by an experienced career counselor who understands the Indian education system, current job market trends, and high-growth career paths — supported by insights from our AI assessment.",
  },
  {
    q: "How is this different from free advice online?",
    a: "Free advice is generic. Our guidance is built specifically for you — based on your assessment results, background, interests, and goals — and comes with a concrete action plan.",
  },
  {
    q: "Is this only for final-year students?",
    a: "Not at all. Students from Class 9 onward, college students at any stage, and early-career professionals looking to switch paths all benefit from the session. The earlier you get clarity, the more time and money you save.",
  },
  {
    q: "Can my parents join the session?",
    a: "Absolutely. We encourage parents to join — career decisions are family decisions in India, and having everyone aligned on the plan makes execution much easier.",
  },
  {
    q: "What is your refund policy?",
    a: (
      <div className="space-y-2 text-text-muted">
        <p>
          We offer a simple and transparent refund policy to ensure a fair
          experience for all learners:
        </p>
        <ul className="list-disc pl-5 space-y-1 my-2">
          <li>Within 48 hours of purchase: Eligible for a 100% refund.</li>
          <li>Between Day 3 and Day 7: Eligible for a 50% refund.</li>
          <li>
            After 7 days from the date of purchase: No refund will be
            applicable.
          </li>
        </ul>
        <div className="mt-3 p-3 rounded-lg  border border-gray-200 text-[12.5px] text-amber-800">
          <strong className="font-semibold text-amber-900">Note: </strong>
          Avatar India reserves the right to verify refund requests and may
          decline refunds in cases of policy misuse, fraudulent activity, or
          violation of our Terms & Conditions.
        </div>
      </div>
    ),
  },
];

/* ─── page ──────────────────────────────────────────────────────────── */

export default function Direct2HirePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [whoForSlide, setWhoForSlide] = useState(0);
  const [diffSlide, setDiffSlide] = useState(0);
  const [statsSlide, setStatsSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatsSlide((i) => (i + 1) % STATS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const { enroll, processing, message, enrolled } = useDirect2HireCheckout();
  const heroBtnLabel = processing
    ? "Processing Payment…"
    : enrolled
      ? "Enrolled ✓"
      : "Enroll Now for ₹999";

  useEffect(() => {
    const timer = setInterval(() => {
      setWhoForSlide((i) => (i + 1) % WHO_FOR.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDiffSlide((i) => (i + 1) % DIFFERENTIATORS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-text overflow-x-hidden">
        {/* ══════════════════════════════
            HERO
        ══════════════════════════════ */}
        <section className="relative pt-20 pb-6 sm:pt-32 sm:pb-14 overflow-hidden">
          <div
            className="pointer-events-none absolute top-0 right-0 w-[700px] h-[500px] bg-brand-200/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3"
            aria-hidden
          />

          <div className="relative container-x">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* left */}
              <div className="lg:col-span-5 xl:col-span-5">
                <ScrollReveal animation="fade-up" delay={0}>
                  {/* <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-[11px] sm:text-[12px] font-semibold text-emerald-700 mb-4">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Admissions Open • 96% Discount Active
                  </span> */}
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
                  <p className="text-text-muted text-[15px] sm:text-[16px] leading-relaxed mb-4 sm:mb-8">
                    Start your journey from Career Counseling to AI Learning,
                    Internship and Placement for just{"  "}
                    <span className="text-text-subtle line-through">
                      ₹24,999
                    </span>{" "}
                    <span className="text-brand-600 font-bold text-xl">
                      ₹999/-
                    </span>
                  </p>
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
                  <UrgencyBanner />
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-3">
                    <Link
                      href={enrolled ? "/dashboard" : "/direct2hire/enroll"}
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        {heroBtnLabel}
                      </Button>
                    </Link>
                    <Link href="#journey" className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        See our 5-Step Journey
                      </Button>
                    </Link>
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
                  <p className="mt-3 text-[12px] text-text-subtle">
                    Instant WhatsApp confirmation • No hidden costs
                  </p>
                </ScrollReveal>
              </div>

              {/* right — image */}
              <div className="lg:col-span-7 xl:col-span-7 relative">
                <ScrollReveal animation="fade-left" delay={200} duration={900}>
                  <div className="relative w-full sm:w-[110%] lg:w-[120%] xl:w-[130%]">
                    <div className="relative w-full aspect-[1672/941] rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] overflow-hidden sm:mask-[linear-gradient(to_right,transparent_0%,black_15%,black_100%)]">
                      <Image
                        src="/counselling-images/banner.jpeg"
                        alt="AI-powered career guidance"
                        fill
                        priority
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 100vw, 70vw"
                        className="object-cover object-center"
                      />
                    </div>
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
              <div className="hidden sm:grid sm:grid-cols-3 gap-2.5 sm:gap-4">
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
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            THE COST OF CONFUSION
        ══════════════════════════════ */}
        <section className="py-6 sm:py-10 bg-surface-alt border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-5 sm:mb-12">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3 sm:mb-4 cursor-default">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    <ShinyText
                      text="THE COST OF CONFUSION"
                      color="#1d4ed8"
                      shineColor="#93c5fd"
                      speed={2.5}
                    />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text max-w-xl">
                    <span className="text-gradient-brand">90% students</span>
                    {"  "}
                    make this mistake.
                  </h2>
                  <p className="mt-3 text-text-muted">
                    Choses an education or Career without Guidance and a full
                    proof plan
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Without a plan */}
              <AnimateOnScroll delay={0} className="order-2 md:order-1">
                <div className="group h-full rounded-2xl border border-red-200 bg-white overflow-hidden card-lift">
                  <div className="p-6 sm:p-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 border border-red-200">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </span>
                      <h3 className="text-xl font-bold text-red-600">
                        Without a Plan
                      </h3>
                    </div>
                    <ul className="space-y-2.5 sm:space-y-4">
                      {WITHOUT_PLAN.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-3 text-[14px] text-text-muted leading-relaxed"
                        >
                          <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimateOnScroll>

              {/* With Avatar's session */}
              <AnimateOnScroll delay={120} className="order-1 md:order-2">
                <div className="group h-full rounded-2xl border border-emerald-200 bg-white overflow-hidden card-lift">
                  <div className="p-6 sm:p-10">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </span>
                      <h3 className="text-xl font-bold text-emerald-600">
                        With Direct2Hire
                      </h3>
                    </div>
                    <ul className="space-y-2.5 sm:space-y-4">
                      {WITH_SESSION.map((pt) => (
                        <li
                          key={pt}
                          className="flex items-start gap-3 text-[14px] text-text-muted leading-relaxed"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            WHO IT'S FOR
        ══════════════════════════════ */}
        <section className="py-6 sm:py-12 bg-white border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <ScrollReveal
              animation="fade-up"
              className="mb-5 sm:mb-12 text-center"
            >
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3 sm:mb-4 cursor-default">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                <ShinyText
                  text="WHO IS THIS FOR ?"
                  color="#1d4ed8"
                  shineColor="#93c5fd"
                  speed={2.5}
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                Direct2Hire Is Built For{" "}
                <span className="text-gradient-brand">
                  Anyone Facing Obstacles in Learning Real Corporates AI Skills
                </span>
              </h2>
              <p className="mt-3 text-text-muted max-w-2xl mx-auto">
                Wherever you need a support to help you with right skills or
                opportunities to get a job, this program takes you there.
              </p>
            </ScrollReveal>

            {/* mobile / tablet — single-card slideshow */}
            <div className="mx-auto max-w-sm sm:max-w-md lg:hidden">
              <div className="relative rounded-2xl border border-border bg-surface-alt overflow-hidden card-lift">
                <div className="relative w-full aspect-4/3 overflow-hidden">
                  {WHO_FOR.map((p, i) => (
                    <div
                      key={p.title}
                      className={cn(
                        "absolute inset-0 transition-opacity duration-500 ease-out",
                        i === whoForSlide
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none",
                      )}
                    >
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(max-width:640px) 90vw, 400px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="relative p-5 sm:p-7 min-h-35">
                  {WHO_FOR.map((p, i) => (
                    <div
                      key={p.title}
                      className={cn(
                        "transition-opacity duration-500 ease-out",
                        i === whoForSlide
                          ? "opacity-100 relative"
                          : "opacity-0 absolute inset-0 p-5 sm:p-7 pointer-events-none",
                      )}
                    >
                      <h3 className="font-semibold text-[16px] text-text mb-1.5">
                        {p.title}
                      </h3>
                      <p className="text-[13.5px] text-text-muted leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {WHO_FOR.map((p, i) => (
                  <button
                    key={p.title}
                    onClick={() => setWhoForSlide(i)}
                    aria-label={`Show ${p.title}`}
                    aria-current={i === whoForSlide}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === whoForSlide
                        ? "w-6 bg-brand-600"
                        : "w-2 bg-border-strong hover:bg-brand-300",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* desktop — all cards side by side */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {WHO_FOR.map((p, i) => (
                <AnimateOnScroll key={p.title} delay={i * 80}>
                  <div className="group h-full rounded-2xl border border-border bg-surface-alt overflow-hidden card-lift">
                    <div className="relative w-full aspect-4/3 overflow-hidden">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="400px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-[16px] text-text mb-2 group-hover:text-brand-600 transition-colors duration-300">
                        {p.title}
                      </h3>
                      <p className="text-[13.5px] text-text-muted leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            THE DIRECT2HIRE JOURNEY
        ══════════════════════════════ */}
        <section
          id="journey"
          className="py-7 sm:py-14 bg-surface-alt border-t border-border relative overflow-hidden scroll-mt-20"
        >
          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="mb-6 sm:mb-14">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3 sm:mb-4 cursor-default">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                <ShinyText
                  text="THE COMPLETE PROGRAM"
                  color="#1d4ed8"
                  shineColor="#93c5fd"
                  speed={2.5}
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                One Program.{" "}
                <span className="text-gradient-brand">Five Guided Steps.</span>
              </h2>
              <p className="mt-3 text-text-muted max-w-2xl">
                Direct2Hire isn&apos;t just a single session — it&apos;s a
                structured journey from figuring out your path to actually
                getting hired.
              </p>
            </ScrollReveal>

            <div className="relative">
              {/* connector line (desktop) — spans from the center of the first
                  step circle to the center of the last, matching the 5-col grid
                  (44px circle, gap-5 = 20px gap) */}
              <div className="absolute top-[22px] left-5.5 right-[calc(20%-38px)] hidden lg:block">
                <div className="h-[2px] w-full bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200" />
              </div>

              <div className="relative grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
                {JOURNEY_STEPS.map((step, i) => (
                  <AnimateOnScroll key={step.num} delay={i * 80}>
                    <div className="group h-full flex flex-col items-start">
                      <div className="hidden sm:flex relative z-10 mb-3 sm:mb-4 h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white text-[13px] font-bold shadow-md shadow-brand-500/25">
                        {step.num}
                      </div>
                      <div className="h-full w-full rounded-2xl border border-border bg-white p-5 sm:p-6 card-lift cursor-default">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3 sm:mb-4 bg-brand-50 border border-brand-200 group-hover:bg-brand-100 transition-all duration-300">
                          <step.icon className="h-5 w-5 text-brand-600" />
                        </div>
                        <h3 className="font-semibold text-[15px] text-text mb-2 group-hover:text-brand-600 transition-colors duration-300">
                          {step.title}
                        </h3>
                        <p className="text-[13px] text-text-muted leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            WHAT'S INCLUDED
        ══════════════════════════════ */}
        {/* <section
          id="whats-included"
          className="py-14 bg-white border-t border-border relative overflow-hidden scroll-mt-20"
        >
          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                What You Get in the{" "}
                <span className="text-gradient-brand">₹999</span>
              </h2>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INCLUDED.map((item, i) => (
                <AnimateOnScroll key={item.title} delay={i * 70}>
                  <div className="group h-full rounded-2xl border border-border bg-surface-alt p-7 card-lift cursor-default">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl mb-5
                                 bg-brand-50 border border-brand-200
                                 group-hover:bg-brand-100 transition-all duration-350"
                    >
                      <item.icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <h3 className="font-semibold text-[16px] text-text mb-2 group-hover:text-brand-600 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>

            bonus bar
            <ScrollReveal animation="fade-up" delay={120} className="mt-6">
              <div className="rounded-2xl border border-brand-200 bg-brand-50 px-7 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl shrink-0 bg-white border border-brand-200">
                    <Gift className="h-5 w-5 text-brand-600" />
                  </span>
                  <div>
                    <p className="font-semibold text-[15px] text-text">
                      Bonus Benefits Included
                    </p>
                    <p className="text-[13px] text-text-muted mt-1">
                      {BONUS_BENEFITS.join(" • ")}
                    </p>
                  </div>
                </div>
                <Link href="/direct2hire/enroll" className="w-full sm:w-fit shrink-0">
                  <Button variant="primary" size="md" className="w-full sm:w-fit">
                    Book now for ₹499/- <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section> */}

        {/* ══════════════════════════════
            THE OUTCOME
        ══════════════════════════════ */}
        <section className="py-7 sm:py-14 bg-surface-alt border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-10 items-center">
              <div className="lg:col-span-2">
                <ScrollReveal animation="fade-up">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3 sm:mb-4 cursor-default">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    <ShinyText
                      text="THE OUTCOME"
                      color="#1d4ed8"
                      shineColor="#93c5fd"
                      speed={2.5}
                    />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text mb-3 sm:mb-4">
                    You Don&apos;t Just Get Advice.{" "}
                    <span className="text-gradient-brand">You Get Hired.</span>
                  </h2>
                  <p className="text-text-muted leading-relaxed mb-4 sm:mb-6">
                    Most sessions end with a PDF and a goodbye. Direct2Hire is
                    built to end with an offer letter — here&apos;s exactly what
                    changes for you.
                  </p>
                  <Link
                    href="/direct2hire/enroll"
                    className="block w-full sm:inline-block sm:w-fit"
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Start Your Transformation{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </ScrollReveal>
              </div>

              <div className="lg:col-span-3">
                <AnimateOnScroll delay={100}>
                  <div className="rounded-2xl border border-border bg-white p-2 sm:p-3">
                    {OUTCOMES.map((outcome, i) => (
                      <div
                        key={outcome}
                        className={cn(
                          "flex items-start gap-3.5 px-4 sm:px-5 py-3 sm:py-4",
                          i !== OUTCOMES.length - 1 && "border-b border-border",
                        )}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mt-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        </span>
                        <p className="text-[14px] sm:text-[15px] text-text leading-relaxed">
                          {outcome}
                        </p>
                      </div>
                    ))}
                  </div>
                </AnimateOnScroll>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            COMPLETE BREAKDOWN / PRICING
        ══════════════════════════════ */}
        <section className="py-7 sm:py-14 bg-white border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-5 sm:mb-12">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3 sm:mb-4 cursor-default">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    <ShinyText
                      text="COMPLETE BREAKDOWN"
                      color="#1d4ed8"
                      shineColor="#93c5fd"
                      speed={2.5}
                    />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                    The Full Direct2Hire Journey{" "}
                    <span className="text-gradient-brand">
                      Starts at ₹999/-
                    </span>
                  </h2>
                  <p className="mt-3 text-text-muted ">
                    Quiz, Counseling, Learning, Internship, and Placement — Real
                    value worth{" "}
                    <span className="line-through text-text-subtle">
                      ₹24,999
                    </span>
                    , now available at a fraction of the cost.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 items-stretch w-full">
              {/* value stack */}
              <AnimateOnScroll delay={0} className="w-full lg:col-span-3">
                <div className="h-full w-full rounded-2xl border border-border bg-surface-alt p-3 sm:p-6 flex flex-col justify-center divide-y divide-border">
                  {VALUE_STACK.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4
                                 hover:bg-brand-50 transition-colors duration-250 rounded-lg"
                    >
                      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                        <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg shrink-0 bg-white border border-brand-200">
                          <item.icon className="h-4 w-4 text-brand-600" />
                        </span>
                        <p className="text-[13px] sm:text-[14px] text-text font-medium truncate">
                          {item.label}
                        </p>
                      </div>
                      <p className="text-[13px] sm:text-[14px] text-text-subtle font-semibold line-through shrink-0 pl-2">
                        {item.price}
                      </p>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>

              {/* you pay only card */}
              <AnimateOnScroll delay={120} className="w-full lg:col-span-2">
                <div className="relative w-full h-full rounded-2xl border border-brand-200 p-5 sm:p-10 overflow-hidden flex flex-col items-center justify-center text-center bg-gradient-to-br from-brand-50 via-white to-brand-100/50 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
                  <p className="relative text-[11px] sm:text-[12px] text-text-subtle uppercase tracking-[0.16em] mb-3">
                    You Pay Only
                  </p>
                  <p className="relative text-4xl sm:text-6xl font-black text-gradient-brand">
                    ₹999/-
                  </p>
                  <span className="relative mt-4 sm:mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-1.5 text-[11px] sm:text-[12px] font-semibold text-emerald-700">
                    <IndianRupee className="h-3 w-3 shrink-0" />
                    Save ₹24,000 (96% OFF)
                  </span>
                  <Link
                    href="/direct2hire/enroll"
                    className="relative mt-3 w-full sm:w-fit"
                  >
                    <Button variant="primary" size="md" className="w-full">
                      Book Your Seat <ArrowRight className="h-4 w-4 shrink-0" />
                    </Button>
                  </Link>
                  <p className="relative mt-3 text-[10px] sm:text-[11px] text-text-subtle">
                    Instant confirmation on WhatsApp
                  </p>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            WHY STUDENTS CHOOSE AVATAR
        ══════════════════════════════ */}
        <section className="py-7 sm:py-14 bg-surface-alt border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <ScrollReveal
              animation="fade-up"
              className="text-center mb-6 sm:mb-14"
            >
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3 sm:mb-4 cursor-default">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                <ShinyText
                  text="WHAT MAKES US DIFFERENT"
                  color="#1d4ed8"
                  shineColor="#93c5fd"
                  speed={2.5}
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                Why Students{" "}
                <span className="text-gradient-brand">Choose Avatar</span>
              </h2>
              <p className="mt-3 text-text-muted max-w-2xl mx-auto">
                Avatar combines AI-powered insights with human expertise to
                deliver clarity, affordability, and real results — designed
                specifically for Indian students.
              </p>
            </ScrollReveal>

            {/* mobile — single-card slideshow */}
            <div className="sm:hidden">
              <div className="relative rounded-2xl border border-border bg-white p-6 min-h-50 card-lift">
                {DIFFERENTIATORS.map((d, i) => (
                  <div
                    key={d.title}
                    className={cn(
                      "transition-opacity duration-500 ease-out",
                      i === diffSlide
                        ? "opacity-100 relative"
                        : "opacity-0 absolute inset-0 p-6 pointer-events-none",
                    )}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4 bg-brand-50 border border-brand-200">
                      <d.icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">
                      {d.title}
                    </h3>
                    <p className="text-[14px] text-text-muted leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {DIFFERENTIATORS.map((d, i) => (
                  <button
                    key={d.title}
                    onClick={() => setDiffSlide(i)}
                    aria-label={`Show ${d.title}`}
                    aria-current={i === diffSlide}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === diffSlide
                        ? "w-6 bg-brand-600"
                        : "w-2 bg-border-strong hover:bg-brand-300",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* tablet / desktop — grid */}
            <div className="hidden sm:grid sm:grid-cols-2 gap-5">
              {DIFFERENTIATORS.map((d, i) => (
                <AnimateOnScroll key={d.title} delay={i * 80}>
                  <div className="group h-full rounded-2xl border border-border bg-white p-8 sm:p-9 card-lift cursor-default">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl mb-6
                                 bg-brand-50 border border-brand-200
                                 group-hover:bg-brand-100 transition-all duration-350"
                    >
                      <d.icon className="h-5 w-5 text-brand-600" />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-3 group-hover:text-brand-600 transition-colors duration-300">
                      {d.title}
                    </h3>
                    <p className="text-[14px] text-text-muted leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            CTA
        ══════════════════════════════ */}
        <section className="py-1 bg-white border-t border-border relative overflow-hidden">
          <div className="container-x">
            <ScrollReveal animation="zoom-in" duration={800}>
              <div className="relative rounded-3xl overflow-hidden border border-brand-100/60 p-6 sm:p-16 text-center bg-gradient-to-br from-brand-50/50 via-white to-brand-100/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="relative inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-2 sm:mb-3 cursor-default">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                  <ShinyText
                    text="YOUR FUTURE STARTS HERE"
                    color="#1d4ed8"
                    shineColor="#93c5fd"
                    speed={2.5}
                  />
                </div>
                <h2 className="relative text-3xl sm:text-4xl font-bold text-text mb-3 sm:mb-4">
                  Ready to take control{" "}
                  <span className="text-gradient-brand">of your future?</span>
                </h2>
                <p className="relative text-text-muted max-w-lg mx-auto mb-4 sm:mb-6 text-[15px]">
                  One 30-minute session can save you years of confusion and
                  lakhs of rupees. Get clear direction, a personalized roadmap,
                  and expert support — starting at just ₹999.
                </p>
                <div className="relative flex flex-col items-center">
                  <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                    <Link
                      href="/direct2hire/enroll"
                      className="w-full sm:w-auto"
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        Book Your Seats Now <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <p className="relative mt-5 text-[12px] text-text-subtle">
                  30-minute call • Limited time offer
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            FAQ
        ══════════════════════════════ */}
        <section className="py-7 sm:py-14 bg-surface-alt border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
              {/* left */}
              <div className="lg:col-span-2">
                <ScrollReveal animation="fade-up">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3 sm:mb-4 cursor-default">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    <ShinyText
                      text="FREQUENTLY ASKED QUESTIONS"
                      color="#1d4ed8"
                      shineColor="#93c5fd"
                      speed={2.5}
                    />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text mb-3 sm:mb-4">
                    Got Questions?{" "}
                    <span className="text-gradient-brand">
                      We&apos;ve Got You Covered.
                    </span>
                  </h2>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={100}>
                  <div className="mt-5 sm:mt-8 rounded-2xl border border-border bg-white p-6 sm:p-7 card-lift">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4 bg-brand-50 border border-brand-200">
                      <MessageCircle className="h-5 w-5 text-brand-600" />
                    </div>
                    <h3 className="font-semibold text-[16px] text-text mb-2">
                      Still have questions?
                    </h3>
                    <p className="text-[13px] text-text-muted leading-relaxed mb-5">
                      We&apos;re here to help — reach out to our team and
                      we&apos;ll help you out.
                    </p>
                    <Link href="/contact">
                      <Button variant="outline" size="sm">
                        Contact Support <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </ScrollReveal>
              </div>

              {/* right — accordion */}
              <div className="lg:col-span-3">
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {FAQS.map((faq, i) => {
                    const open = openFaq === i;
                    return (
                      <AnimateOnScroll key={faq.q} delay={i * 60}>
                        <div
                          className={cn(
                            "rounded-2xl border bg-white transition-all duration-300",
                            open
                              ? "border-brand-300 shadow-sm"
                              : "border-border hover:border-border-strong",
                          )}
                        >
                          <button
                            onClick={() => setOpenFaq(open ? null : i)}
                            className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left"
                            aria-expanded={open}
                          >
                            <span
                              className={cn(
                                "text-[15px] font-medium transition-colors duration-250",
                                open ? "text-brand-600" : "text-text",
                              )}
                            >
                              {faq.q}
                            </span>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform duration-300",
                                open
                                  ? "rotate-180 text-brand-600"
                                  : "text-text-subtle",
                              )}
                            />
                          </button>
                          <div
                            className={cn(
                              "grid transition-all duration-300 ease-out",
                              open
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0",
                            )}
                          >
                            <div className="overflow-hidden">
                              <div className="px-6 pb-5 text-[13.5px] text-text-muted leading-relaxed whitespace-pre-line">
                                {faq.a}
                              </div>
                            </div>
                          </div>
                        </div>
                      </AnimateOnScroll>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <HelpWidget />
      <StickyBuyBar />
    </>
  );
}

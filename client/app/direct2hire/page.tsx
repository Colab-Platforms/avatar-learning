"use client";

import { useState } from "react";
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
  Gift,
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
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal, AnimateOnScroll, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ─── data ─────────────────────────────────────────────────────────── */

const STATS = [
  { value: "2300+", label: "Students Guided" },
  { value: "4.9/5 ★", label: "Average Rating" },
  { value: "₹12L+", label: "Avg Package Secured" },
  { value: "150+", label: "Colleges & Schools" },
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

const STEPS = [
  {
    num: "01",
    title: "Career Assessment",
    desc: "Complete our AI-powered career assessment to understand your strengths, interests, personality, and suitable career paths.",
  },
  {
    num: "02",
    title: "Expert Counseling",
    desc: "Discuss your assessment results with an experienced counselor and get clear answers to every career question you have.",
  },
  {
    num: "03",
    title: "Get Your Roadmap",
    desc: "Get access to internship opportunities (many of which are free or low-commitment) to gain real-world experience and build your profile.",
  },
  {
    num: "04",
    title: "Start Executing",
    desc: "Receive guidance on resume building, interview preparation, and placement opportunities as you move closer to your career goals.",
  },
];

const VALUE_STACK = [
  { icon: Users, label: "Career Counseling Session", price: "₹999/-" },
  { icon: BrainCircuit, label: "AI Powered Assessment + Feedback", price: "₹999/-" },
  { icon: Sparkles, label: "AI Basic Learning Program", price: "₹4,999/-" },
  { icon: Briefcase, label: "Paid Internship", price: "₹2,999/-" },
  { icon: Target, label: "Job Placement Support", price: "₹2,999/-" },
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
    desc: "Most platforms charge ₹2,000–₹15,000 for similar sessions. We deliver real clarity and a complete roadmap at just ₹499 with no hidden costs.",
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
    q: "Is ₹499 really enough for proper guidance?",
    a: "Yes. The session is compact but complete — you get an AI-powered assessment, a 30-minute 1-on-1 consultation, a personalized report, and a step-by-step roadmap. We keep the price low so every student can afford real guidance, not because we cut corners.",
  },
  {
    q: "Who will conduct the session?",
    a: "Your session is conducted by an experienced career counselor who understands the Indian education system, current job market trends, and high-growth career paths — supported by insights from our AI assessment.",
  },
  {
    q: "How is this different from free advice online?",
    a: "Free advice is generic. Our guidance is built specifically for you — based on your assessment results, background, interests, and goals — and comes with a concrete action plan and 7 days of follow-up mentorship.",
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
    q: "What happens after the 7 day mentorship?",
    a: "You keep lifetime access to your career report and roadmap, plus access to our community. You can also continue with our learning programs, internships, and placement support whenever you're ready.",
  },
];

/* ─── page ──────────────────────────────────────────────────────────── */

export default function Direct2HirePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-text overflow-x-hidden">
        {/* ══════════════════════════════
            HERO
        ══════════════════════════════ */}
        <section className="relative pt-28 pb-14 sm:pt-32 overflow-hidden">
          <div className="pointer-events-none absolute top-0 right-0 w-[700px] h-[500px] bg-brand-200/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" aria-hidden />

          <div className="relative container-x">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* left */}
              <div>
                <ScrollReveal animation="fade-up" delay={0}>
                  <p className="eyebrow mb-4">
                    India&apos;s AI-Powered Career Platform
                  </p>
                  <h1 className="h-display text-text mb-6">
                    Stop guessing.{" "}
                    <span className="text-gradient-brand">
                      Start planning your future.
                    </span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={80}>
                  <p className="text-text-muted text-[16px] leading-relaxed mb-8">
                    Discover the right career path based on your interests, strengths, personality, and future job opportunities.{" "}
                    <span className="text-text-subtle line-through">₹12,995</span>{" "}
                    <span className="text-brand-600 font-semibold">₹499/-</span>
                  </p>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={150}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href="/contact">
                      <Button variant="primary" size="lg">
                        Book Your Session <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="#whats-included">
                      <Button variant="outline" size="lg">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                  <p className="mt-4 text-[12px] text-text-subtle">
                    Limited slots • Instant confirmation
                  </p>
                </ScrollReveal>
              </div>

              {/* right — image */}
              <ScrollReveal animation="fade-left" delay={200} duration={900}>
                <div className="relative">
                  <div
                    className="relative aspect-4/3 rounded-2xl overflow-hidden border border-border
                               hover:border-brand-300 transition-all duration-500 group shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
                  >
                    <Image
                      src="/counselling-images/banner.png"
                      alt="AI-powered career guidance"
                      fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="object-cover object-right transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* floating price card */}
                  <div className="absolute -bottom-5 -left-4 rounded-xl border border-border bg-white px-4 py-3 shadow-md hidden md:block">
                    <p className="text-[10px] text-brand-600 uppercase tracking-wider">
                      Full Session
                    </p>
                    <p className="text-2xl font-bold text-text mt-0.5">
                      ₹499/-
                    </p>
                    <p className="text-[10px] text-text-subtle mt-0.5 line-through">
                      Worth ₹12,995
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* stat strip */}
            <ScrollReveal animation="fade-up" delay={200} className="mt-20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map((s, i) => (
                  <AnimateOnScroll key={s.label} delay={i * 70}>
                    <div className="rounded-2xl border border-border bg-surface-alt p-6 text-center card-lift">
                      <p className="text-3xl font-bold text-text mb-1">
                        {s.value}
                      </p>
                      <p className="text-[12px] text-text-subtle uppercase tracking-wider">
                        {s.label}
                      </p>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            THE COST OF CONFUSION
        ══════════════════════════════ */}
        <section className="py-14 bg-surface-alt border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                  <p className="eyebrow mb-4">The Cost of Confusion</p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text max-w-xl">
                    Most students make{" "}
                    <span className="text-gradient-brand">
                      one expensive mistake.
                    </span>
                  </h2>
                  <p className="mt-3 text-text-muted">
                    They choose a career without a clear plan.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Without a plan */}
              <AnimateOnScroll delay={0}>
                <div className="group h-full rounded-2xl border border-red-200 bg-white overflow-hidden card-lift">
                  <div className="relative aspect-16/9 overflow-hidden">
                    <Image
                      src="/counselling-images/without.png"
                      alt="Without a plan"
                      fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-8 sm:p-10 pt-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 border border-red-200">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </span>
                      <h3 className="text-xl font-bold text-red-600">
                        Without a Plan
                      </h3>
                    </div>
                    <ul className="space-y-4">
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
              <AnimateOnScroll delay={120}>
                <div className="group h-full rounded-2xl border border-emerald-200 bg-white overflow-hidden card-lift">
                  <div className="relative aspect-16/9 overflow-hidden">
                    <Image
                      src="/counselling-images/with.png"
                      alt="With Avatar's session"
                      fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-8 sm:p-10 pt-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </span>
                      <h3 className="text-xl font-bold text-emerald-600">
                        With Avatar&apos;s Session
                      </h3>
                    </div>
                    <ul className="space-y-4">
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
            WHAT'S INCLUDED
        ══════════════════════════════ */}
        <section
          id="whats-included"
          className="py-14 bg-white border-t border-border relative overflow-hidden scroll-mt-20"
        >
          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="mb-12">
              <p className="eyebrow mb-4">What&apos;s Included</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                What You Get in Your{" "}
                <span className="text-gradient-brand">30-Minute Session</span>
              </h2>
              <p className="mt-3 text-text-muted">
                Everything you need to move forward with clarity.
              </p>
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

            {/* bonus bar */}
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
                <Link href="/contact">
                  <Button variant="primary" size="md" className="shrink-0 w-fit">
                    Book now for ₹499/- <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            HOW IT WORKS
        ══════════════════════════════ */}
          {/* <section className="py-14 bg-surface-alt border-t border-border relative overflow-hidden">
            <div className="relative container-x">
              <ScrollReveal animation="fade-up" className="mb-12">
                <p className="eyebrow mb-4">Simple &amp; Clear Process</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                  How It <span className="text-gradient-brand">Works</span>
                </h2>
                <p className="mt-3 text-text-muted max-w-2xl">
                  From booking your session to walking away with a clear plan,
                  everything happens in just 4 easy steps. Get expert guidance, a
                  personalized roadmap and ongoing support without any complexity.
                </p>
              </ScrollReveal>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STEPS.map((step, i) => (
                  <AnimateOnScroll key={step.num} delay={i * 80}>
                    <div className="group h-full rounded-2xl border border-border bg-white p-7 card-lift cursor-default">
                      <p
                        className="text-4xl font-black text-transparent mb-5"
                        style={{ WebkitTextStroke: "1px #2A78CC" }}
                      >
                        {step.num}
                      </p>
                      <h3 className="font-semibold text-[16px] text-text mb-2 group-hover:text-brand-600 transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-[13px] text-text-muted leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </section> */}

        {/* ══════════════════════════════
            COMPLETE BREAKDOWN / PRICING
        ══════════════════════════════ */}
        <section className="py-14 bg-white border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                  <p className="eyebrow mb-4">Complete Breakdown</p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text">
                    Everything You Get{" "}
                    <span className="text-gradient-brand">For Just ₹499/-</span>
                  </h2>
                  <p className="mt-3 text-text-muted">
                    Real value worth{" "}
                    <span className="line-through text-text-subtle">₹12,995</span>.
                    Now available at a fraction of the cost.
                  </p>
                </div>
                <Link href="/contact">
                  <Button variant="primary" size="md" className="shrink-0 w-fit">
                    Get Your Career Plan For ₹499/-{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid lg:grid-cols-5 gap-6 items-stretch">
              {/* value stack */}
              <AnimateOnScroll delay={0} className="lg:col-span-3">
                <div className="h-full rounded-2xl border border-border bg-surface-alt p-4 sm:p-6 flex flex-col justify-center divide-y divide-border">
                  {VALUE_STACK.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-4 px-2 sm:px-4 py-4
                                 hover:bg-brand-50 transition-colors duration-250 rounded-lg"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 bg-white border border-brand-200">
                          <item.icon className="h-4 w-4 text-brand-600" />
                        </span>
                        <p className="text-[14px] text-text font-medium truncate">
                          {item.label}
                        </p>
                      </div>
                      <p className="text-[14px] text-text-subtle font-semibold line-through shrink-0">
                        {item.price}
                      </p>
                    </div>
                  ))}
                </div>
              </AnimateOnScroll>

              {/* you pay only card */}
              <AnimateOnScroll delay={120} className="lg:col-span-2">
                <div className="relative h-full rounded-2xl border border-brand-200 p-8 sm:p-10 overflow-hidden flex flex-col items-center justify-center text-center bg-gradient-to-br from-brand-50 via-white to-brand-100/50 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
                  <p className="relative text-[12px] text-text-subtle uppercase tracking-[0.16em] mb-3">
                    You Pay Only
                  </p>
                  <p className="relative text-5xl sm:text-6xl font-black text-gradient-brand">
                    ₹499/-
                  </p>
                  <span className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[12px] font-semibold text-emerald-700">
                    <IndianRupee className="h-3 w-3" />
                    Save ₹12,495 (96% OFF)
                  </span>
                  <Link href="/contact">
                    <Button variant="primary" size="md" className="relative mt-7">
                      Book Your Session <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════
            WHY STUDENTS CHOOSE AVATAR
        ══════════════════════════════ */}
        <section className="py-14 bg-surface-alt border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="text-center mb-14">
              <p className="eyebrow mb-4">What Makes Us Different</p>
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

            <div className="grid sm:grid-cols-2 gap-5">
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
        <section className="py-14 bg-white border-t border-border relative overflow-hidden">
          <div className="container-x">
            <ScrollReveal animation="zoom-in" duration={800}>
              <div className="relative rounded-3xl overflow-hidden border border-brand-100/60 p-10 sm:p-16 text-center bg-gradient-to-br from-brand-50/50 via-white to-brand-100/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <p className="relative eyebrow mb-3">Your Future Starts Here</p>
                <h2 className="relative text-3xl sm:text-4xl font-bold text-text mb-4">
                  Ready to take control{" "}
                  <span className="text-gradient-brand">of your future?</span>
                </h2>
                <p className="relative text-text-muted max-w-lg mx-auto mb-8 text-[15px]">
                  One 30-minute session can save you years of confusion and
                  lakhs of rupees. Get clear direction, a personalized roadmap,
                  and expert support — starting at just ₹499.
                </p>
                <div className="relative flex flex-wrap justify-center gap-3">
                  <Link href="/contact">
                    <Button variant="primary" size="lg">
                      Book Your Session Now <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="relative mt-5 text-[12px] text-text-subtle">
                  30-minute call • Limited slots this month
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══════════════════════════════
            FAQ
        ══════════════════════════════ */}
        <section className="py-14 bg-surface-alt border-t border-border relative overflow-hidden">
          <div className="relative container-x">
            <div className="grid lg:grid-cols-5 gap-12">
              {/* left */}
              <div className="lg:col-span-2">
                <ScrollReveal animation="fade-up">
                  <p className="eyebrow mb-4">Frequently Asked Questions</p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text mb-4">
                    Got Questions?{" "}
                    <span className="text-gradient-brand">
                      We&apos;ve Got You Covered.
                    </span>
                  </h2>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={100}>
                  <div className="mt-8 rounded-2xl border border-border bg-white p-7 card-lift">
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
                <div className="flex flex-col gap-3">
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
                            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
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
                              <p className="px-6 pb-5 text-[13.5px] text-text-muted leading-relaxed">
                                {faq.a}
                              </p>
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
    </>
  );
}

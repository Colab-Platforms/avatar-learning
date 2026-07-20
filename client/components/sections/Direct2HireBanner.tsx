"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  GraduationCap,
  Building2,
  Award,
  Users,
  ClipboardList,
  BookOpen,
  Briefcase,
  Star,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Play,
  Pause,
} from "lucide-react";
import PretextAnimatedHeight from "@/components/counselling/PretextAnimatedHeight";

/* ─────────────────────────────────────────
   DATA DEFINITIONS
───────────────────────────────────────── */
const STEPS = [
  {
    num: 1,
    icon: ClipboardList,
    heading: "Assessment",
    title: "AI Assessment",
    subtitle: "Smart Skill Profiling",
    desc: "Complete a 5-minute interactive questionnaire to analyze your current skill matrix and receive an AI-personalized career roadmap.",
    highlights: [
      "Personalized Skill Matrix",
      "Instant AI Roadmap",
      "Gap Analysis",
    ],
    glowColor: "rgba(37, 99, 235, 0.12)",
  },
  {
    num: 2,
    icon: Users,
    heading: "Counseling",
    title: "1-on-1 Counseling",
    subtitle: "Expert Mentorship",
    desc: "Get paired with an experienced industry expert for 1-on-1 strategic guidance to align your skills with market demands.",
    highlights: ["Dedicated Mentor", "Resume Optimization", "Career Strategy"],
    glowColor: "rgba(14, 165, 233, 0.12)",
  },
  {
    num: 3,
    icon: BookOpen,
    heading: "Programs",
    title: "AI Learning Programs",
    subtitle: "Skill Mastery",
    desc: "Master hands-on technical skills through a structured, project-driven curriculum supercharged with generative AI tools.",
    highlights: ["Hands-on Projects", "AI-Assisted Coding", "Interactive Labs"],
    glowColor: "rgba(99, 102, 241, 0.12)",
  },
  {
    num: 4,
    icon: Briefcase,
    heading: "Internship",
    title: "Curated Internship",
    subtitle: "Real-World Experience",
    desc: "Work on live production projects for top hiring partner startups and build a verified portfolio that hiring managers respect.",
    highlights: [
      "Live Startup Projects",
      "Verified Credentials",
      "Stipends Available",
    ],
    glowColor: "rgba(168, 85, 247, 0.12)",
  },
  {
    num: 5,
    icon: Star,
    heading: "Placement",
    title: "Direct Placement",
    subtitle: "Dream Job Secured",
    desc: "Connect directly with 20+ corporate hiring partners for fast-tracked interviews and dedicated placement support.",
    highlights: [
      "Direct Fast-Track Interviews",
      "Salary Negotiation",
      "100% Hiring Support",
    ],
    glowColor: "rgba(245, 158, 11, 0.12)",
  },
];

const STATS = [
  {
    icon: GraduationCap,
    value: "10,000+",
    label: "Students",
    subtext: "got their Dream Job",
    badge: "Verified Success",
    iconBg: "bg-blue-50 border-blue-100 text-blue-600",
  },
  {
    icon: Award,
    value: "96.3%",
    label: "Placement Rate",
    subtext: "Highest success ratio in industry",
    badge: "Industry Top",
    iconBg: "bg-emerald-50 border-emerald-100 text-emerald-600",
  },
  {
    icon: Building2,
    value: "20+",
    label: "Corporate Partners",
    subtext: "Top-tier companies actively hiring",
    badge: "Exclusive Access",
    iconBg: "bg-indigo-50 border-indigo-100 text-indigo-600",
  },
];

const FEATURES = [
  { icon: Zap, label: "AI-Powered Guidance" },
  { icon: Users, label: "1-on-1 Mentorship" },
  { icon: Briefcase, label: "Guaranteed Internship" },
  { icon: ShieldCheck, label: "Placement Support" },
];

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export function Direct2HireBanner() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance active step every 4.5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsAutoPlaying(false);
  };

  const currentStep = STEPS[activeStep];

  return (
    <section className="relative py-6 sm:py-10 bg-white overflow-hidden">
      <div className="container-x">
        {/* ── Main Outer Light Card Container ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-100/90 shadow-xl shadow-blue-950/5 text-slate-900"
        >
          {/* Ambient Background Glowing Blobs */}
          <div
            className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(191,219,254,0.7) 0%, rgba(224,231,255,0.4) 50%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(186,230,253,0.7) 0%, rgba(209,250,229,0.4) 50%, transparent 70%)",
            }}
          />

          {/* ════════ TOP HERO & INTERACTIVE PATHWAY GRID ════════ */}
          <div className="relative p-6 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* ── LEFT COLUMN: Text Copy & Call to Action (5 cols) ── */}
              <div className="lg:col-span-5 flex flex-col justify-center">
                {/* Eyebrow Badge */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 backdrop-blur-md shadow-xs">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    Direct2Hire Career Accelerator
                  </span>
                </div>

                {/* Main Headline */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] text-slate-900">
                  Transform Your Career From{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600">
                    Learning to Direct Hiring
                  </span>
                </h2>

                {/* Subtitle / Description wrapped in Pretext */}
                <div className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg">
                  <PretextAnimatedHeight
                    text="An all-in-one AI career pathway. Get evaluated, receive 1-on-1 industry mentorship, build real projects in curated internships, and secure job placement with top corporates."
                    font="15px Inter, sans-serif"
                    lineHeight={24}
                  >
                    <p className="text-slate-600 text-sm sm:text-[15px] leading-relaxed">
                      An all-in-one AI career pathway. Get evaluated, receive
                      1-on-1 industry mentorship, build real projects in curated
                      internships, and secure job placement with top corporates.
                    </p>
                  </PretextAnimatedHeight>
                </div>

                {/* Feature Chips */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {FEATURES.map((item, idx) => {
                    const FIcon = item.icon;
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 backdrop-blur-sm shadow-xs transition-colors duration-200 hover:border-blue-300 hover:bg-white"
                      >
                        <FIcon className="h-3.5 w-3.5 text-blue-600" />
                        {item.label}
                      </span>
                    );
                  })}
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/direct2hire"
                    className="group relative inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Your Journey
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </Link>

                  {/* Pause / Auto-play Toggle */}
                  <button
                    onClick={() => setIsAutoPlaying((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5 text-xs font-semibold text-slate-700 backdrop-blur-sm shadow-xs transition-all duration-200 hover:border-blue-300 hover:bg-white"
                    title={
                      isAutoPlaying ? "Pause Auto-switch" : "Enable Auto-switch"
                    }
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause className="h-3.5 w-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Pause Tour</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Auto Tour</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── RIGHT COLUMN: Interactive 5-Step Pathway (7 cols) ── */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {/* ── Horizontal Step Switcher Bar ── */}
                <div className="relative">
                  {/* Connecting Progress Track Line */}
                  <div className="absolute top-1/2 left-4 right-4 h-1 -translate-y-1/2 bg-slate-200 rounded-full hidden sm:block" />
                  <div
                    className="absolute top-1/2 left-4 h-1 -translate-y-1/2 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 rounded-full transition-all duration-500 hidden sm:block"
                    style={{
                      width: `${(activeStep / (STEPS.length - 1)) * 88}%`,
                    }}
                  />

                  {/* Step Selector Buttons Row */}
                  <div className="relative grid grid-cols-5 gap-2 sm:gap-4">
                    {STEPS.map((step, idx) => {
                      const IconComponent = step.icon;
                      const isActive = idx === activeStep;
                      const isCompleted = idx < activeStep;

                      return (
                        <button
                          key={step.num}
                          onClick={() => handleStepClick(idx)}
                          className="group relative flex flex-col items-center focus:outline-none"
                        >
                          {/* Step Circle */}
                          <div
                            className={`relative z-10 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                              isActive
                                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110 ring-4 ring-blue-100"
                                : isCompleted
                                  ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-400 group-hover:border-blue-300 group-hover:text-slate-700 shadow-xs"
                            }`}
                          >
                            <IconComponent className="h-5 w-5" />

                            {/* Glowing Active Ring Pulse */}
                            {isActive && (
                              <motion.span
                                layoutId="activeStepGlowLight"
                                className="absolute inset-0 rounded-2xl bg-blue-400/20 opacity-60 blur-xs"
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </div>

                          {/* Step Label below button */}
                          <span
                            className={`mt-2.5 text-[11px] font-bold transition-colors duration-200 hidden sm:block text-center truncate max-w-[85px] ${
                              isActive
                                ? "text-blue-700 font-extrabold"
                                : isCompleted
                                  ? "text-slate-700"
                                  : "text-slate-400 group-hover:text-slate-600"
                            }`}
                          >
                            {step.heading}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Active Step Highlight Card (Animated) ── */}
                <div className="relative min-h-[220px] rounded-2xl border border-blue-100/90 bg-white/90 p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-blue-950/5 overflow-hidden">
                  {/* Subtle Background Glow corresponding to step */}
                  <div
                    className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-60 blur-2xl transition-all duration-500"
                    style={{ background: currentStep.glowColor }}
                  />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="relative z-10 flex flex-col justify-between h-full"
                    >
                      <div>
                        {/* Step Header Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700 border border-blue-200">
                              {currentStep.num}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                              {currentStep.subtitle}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-semibold">
                            Step {activeStep + 1} of 5
                          </span>
                        </div>

                        {/* Step Title */}
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                          {currentStep.title}
                        </h3>

                        {/* Step Description with Pretext height transition */}
                        <PretextAnimatedHeight
                          text={currentStep.desc}
                          font="14px Inter, sans-serif"
                          lineHeight={22}
                          className="mt-1"
                        >
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {currentStep.desc}
                          </p>
                        </PretextAnimatedHeight>
                      </div>

                      {/* Step Key Highlights Pills */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-xs font-semibold text-slate-500 mr-1">
                          Key Deliverables:
                        </span>
                        {currentStep.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-800"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {h}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* ════════ BOTTOM STATS BAR WITH GENEROUS BREATHING ROOM ════════ */}
          <div className="relative border-t border-blue-100/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {STATS.map((stat, idx) => {
                const StatIcon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 * idx }}
                    whileHover={{ y: -4 }}
                    className="group relative p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all duration-300 flex items-start gap-5"
                  >
                    {/* Stat Icon Badge */}
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-xs transition-transform duration-300 group-hover:scale-105 ${stat.iconBg}`}
                    >
                      <StatIcon className="h-7 w-7" />
                    </div>

                    {/* Stat Copy */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight">
                          {stat.value}
                        </span>
                        {/* <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {stat.badge}
                        </span> */}
                      </div>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        {stat.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {stat.subtext}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

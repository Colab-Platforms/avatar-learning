"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, GraduationCap, Building2, Award, Globe, Users, ClipboardList, BookOpen, Briefcase, Star } from "lucide-react";

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const STEPS = [
  {
    num: 1,
    icon: Users,
    title: "Counselling",
    desc: "Personalized guidance to understand your goals and strengths.",
    active: false,
  },
  {
    num: 2,
    icon: ClipboardList,
    title: "Assessment",
    desc: "AI-driven assessments to evaluate skills and identify opportunities.",
    active: false,
  },
  {
    num: 3,
    icon: BookOpen,
    title: "AI Fundamentals Program",
    desc: "Structured learning path with AI-powered skill development.",
    active: false,
  },
  {
    num: 4,
    icon: Briefcase,
    title: "Internship",
    desc: "Curated internships to gain real-world experience.",
    active: false,
  },
  {
    num: 5,
    icon: Star,
    title: "Job Placement",
    desc: "Connect with top employers and get placed.",
    active: false,
  },
];

const STATS = [
  { icon: GraduationCap, value: "10K+", label: "Students Guided" },
  { icon: Building2, value: "500+", label: "Hiring Partners" },
  { icon: Award, value: "95%", label: "Placement Rate" },
  { icon: Globe, value: "25+", label: "Domains Covered" },
];

const FEATURES = ["AI-Powered", "Industry Mentors", "Internship Support", "Placement Assistance"];

/* ─────────────────────────────────────────
   COMPONENT
───────────────────────────────────────── */
export function Direct2HireBanner() {
  return (
    <section className="relative py-6 bg-white overflow-hidden">
      <div className="container-x">
        {/* ── Outer card ── */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #e8f1ff 0%, #dde9ff 35%, #d0e2ff 65%, #c6daff 100%)",
            boxShadow: "0 8px 48px -8px rgba(59,130,246,0.18), 0 2px 8px rgba(59,130,246,0.08)",
          }}
        >
          {/* Ambient blobs */}
          <div
            className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-40"
            style={{
              background: "radial-gradient(circle, rgba(147,197,253,0.6) 0%, transparent 70%)",
              animation: "orb-float 8s ease-in-out infinite",
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 right-40 h-72 w-72 rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(96,165,250,0.5) 0%, transparent 70%)",
              animation: "orb-float 11s ease-in-out infinite reverse",
            }}
          />

          {/* ════════ TOP SECTION ════════ */}
          <div className="relative grid lg:grid-cols-[420px_1fr] min-h-[360px]">

            {/* ── LEFT: Text ── */}
            <div className="flex flex-col justify-center p-10 sm:p-12 lg:border-r border-blue-200/50">
              {/* Eyebrow */}
              <span
                className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/80 bg-white/70 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 backdrop-blur-sm shadow-sm"
                style={{ animation: "fade-up-in 0.6s ease both" }}
              >
                <Sparkles className="h-3 w-3" />
                AI-Powered Career Acceleration
              </span>

              {/* Heading */}
              <h2
                className="text-[40px] sm:text-[52px] font-extrabold leading-[1.05] tracking-tight text-slate-800"
                style={{ animation: "fade-up-in 0.7s 0.1s ease both" }}
              >
                Direct2Hire
                <br />
                <span className="text-blue-600">AI Programme</span>
              </h2>

              {/* Description */}
              <p
                className="mt-5 text-[14px] leading-[1.85] text-slate-500 max-w-[340px]"
                style={{ animation: "fade-up-in 0.7s 0.2s ease both" }}
              >
                AI-powered career guidance, skill development, internships, and
                placement support—everything you need to go from learning to earning.
              </p>

              {/* Feature pills */}
              <div
                className="mt-6 flex flex-wrap gap-2"
                style={{ animation: "fade-up-in 0.7s 0.3s ease both" }}
              >
                {FEATURES.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-blue-100 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {f}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div
                className="mt-8 flex flex-wrap items-center gap-3"
                style={{ animation: "fade-up-in 0.7s 0.4s ease both" }}
              >
                <Link
                  href="/direct2hire"
                  className="group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0"
                  style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}
                >
                  Start Your Journey
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                {/* <Link
                  href="/direct2hire"
                  className="group inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-6 py-3 text-[14px] font-semibold text-blue-700 backdrop-blur-sm transition-all duration-200 hover:border-blue-400 hover:bg-white hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                >
                  Learn More
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link> */}
              </div>
            </div>

            {/* ── RIGHT: Steps ── */}
            <div className="relative flex items-center px-6 py-10 sm:px-10">
              {/* Steps row */}
              <div className="relative w-full">
                {/* Horizontal connector line (desktop) */}
                <div className="absolute top-[38px] left-[10%] right-[10%] hidden lg:block">
                  <div className="h-[2px] w-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 opacity-60" />
                </div>

                {/* Cards */}
                <div className="relative grid grid-cols-5 gap-3">
                  {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={idx}
                        className={`group flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-2`}
                        style={{ animation: `card-enter 0.5s ${0.1 + idx * 0.1}s ease both` }}
                      >
                        {/* Number bubble */}
                        <div
                          className={`relative z-10 mb-3 flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                            step.active
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-300/50"
                              : "bg-white border-2 border-blue-200 text-blue-400 group-hover:border-blue-400 group-hover:text-blue-600"
                          }`}
                        >
                          {step.active && (
                            <span
                              className="absolute inset-0 rounded-full bg-blue-400 opacity-30"
                              style={{ animation: "pulse-ring 2s ease-out infinite" }}
                            />
                          )}
                          {step.num}
                        </div>

                        {/* Card body */}
                        <div
                          className={`flex flex-col items-center rounded-2xl border p-3.5 w-full transition-all duration-300 ${
                            step.active
                              ? "border-blue-300 bg-white shadow-lg shadow-blue-100/80"
                              : "border-blue-100/60 bg-white/60 backdrop-blur-sm shadow-sm group-hover:border-blue-200 group-hover:bg-white/90 group-hover:shadow-md"
                          }`}
                        >
                          <div
                            className={`mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl ${
                              step.active ? "bg-blue-50 border border-blue-100" : "bg-blue-50/60 border border-blue-100/50"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 transition-colors duration-200 ${
                                step.active ? "text-blue-600" : "text-blue-400 group-hover:text-blue-500"
                              }`}
                            />
                          </div>
                          <p
                            className={`text-[11px] font-bold leading-tight mb-1.5 ${
                              step.active ? "text-blue-700" : "text-slate-700"
                            }`}
                          >
                            {idx + 1}. {step.title}
                          </p>
                          <p className="text-[10px] text-slate-400 leading-snug">{step.desc}</p>

                          {/* Active indicator dots */}
                          <div className="mt-2.5 flex gap-1 justify-center">
                            {[0, 1, 2].map((d) => (
                              <span
                                key={d}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  step.active
                                    ? d === 0
                                      ? "w-4 bg-blue-500"
                                      : "w-1 bg-blue-200"
                                    : "w-1 bg-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ════════ STATS BAR ════════ */}
          <div className="relative border-t border-blue-200/40 bg-white/30 backdrop-blur-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-blue-200/40">
              {STATS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-3 px-6 sm:px-8 py-5 transition-all duration-200 hover:bg-white/30"
                    style={{ animation: `number-up 0.5s ${0.5 + i * 0.08}s ease both` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-blue-100 shadow-sm">
                      <Icon className="h-4.5 w-4.5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[22px] font-extrabold text-slate-800 leading-none">{s.value}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

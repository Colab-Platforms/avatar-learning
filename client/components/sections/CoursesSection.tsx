import Link from "next/link";
import { CourseCard } from "./CourseCard";
import { COURSES, COURSE_FILTERS } from "@/data/courses";
import { ScrollReveal } from "@/components/ui";
import { Layers } from "lucide-react";

export function CoursesSection() {
  return (
    <section
      id="learning"
      className="relative bg-ink-900 py-14 sm:py-16 overflow-hidden"
    >
      {/* Top / bottom dividers */}
      <div className="absolute top-0 inset-x-0 divider-glow" />
      <div className="absolute bottom-0 inset-x-0 divider-glow" />

      {/* Subtle radial orb */}
      <div
        className="absolute -top-60 left-1/2 -translate-x-1/2 w-225 h-150 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(57,130,198,0.06) 0%, transparent 65%)",
        }}
      />

      <div className="container-x">
        {/* ── Section label ── */}
        <ScrollReveal animation="fade-up">
          <div className="flex items-center gap-3 mb-10">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20">
              <Layers className="h-4 w-4 text-brand-400" />
            </span>
            <p className="eyebrow">AI Learning Division</p>
          </div>
          <h2 className="h-display text-white max-w-3xl">
            From Zero to AI-Ready. <br className="hidden sm:block" />
            <span className="text-gradient-brand">At Your Own Pace.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-white/42 text-[15px] leading-[1.85]">
            Whether you&apos;re a student, professional, or business leader —
            our weekend-first programs combine live learning, real projects, and
            certifications that actually move the needle in your career.
          </p>
        </ScrollReveal>

        {/* ── Filters ── */}
        <ScrollReveal animation="fade-up" delay={100} className="mt-10">
          <div className="flex flex-wrap gap-2">
            {COURSE_FILTERS.map((filter, i) => (
              <button
                key={filter}
                className={`${i === 0 ? "filter-pill filter-pill-active" : "filter-pill"} hover:scale-[1.06] active:scale-95`}
              >
                {filter}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* ── Cards ── */}
        <div className="mt-10 space-y-4">
          {COURSES.map((course, i) => (
            <ScrollReveal
              key={course.id}
              animation="slide-up"
              delay={i * 120}
              duration={750}
            >
              <CourseCard course={course} />
            </ScrollReveal>
          ))}
        </div>

        {/* ── View all ── */}
        <ScrollReveal animation="fade-up" delay={80} className="mt-10">
          <button className="px-4 py-2 rounded-2xl bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/20 transition-colors duration-300">
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 text-[13px] font-medium text-white/35 hover:text-brand-400 transition-colors duration-300"
            >
              <span className="underline-offset-4 underline decoration-white/15 group-hover:decoration-brand-400/60 transition-all duration-300">
                View all programs
              </span>
              <span className="group-hover:translate-x-1.5 transition-transform duration-300">
                →
              </span>
            </Link>
          </button>
        </ScrollReveal>
      </div>
    </section>
  );
}

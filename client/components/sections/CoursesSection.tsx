import { CourseCard } from "./CourseCard";
import { COURSES, COURSE_FILTERS } from "@/data/courses";
import { ScrollReveal } from "@/components/ui";
import { Layers } from "lucide-react";

export function CoursesSection() {
  return (
    <section id="learning" className="relative bg-white py-28 sm:py-36 overflow-hidden">

      {/* Section top divider */}
      <div className="absolute top-0 inset-x-0 divider-glow" />

      {/* Subtle radial bg */}
      <div
        className="absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center top, rgba(47,123,255,0.035) 0%, transparent 65%)" }}
      />

      <div className="container-x">

        {/* ── Section label ── */}
        <ScrollReveal animation="fade-up">
          <div className="flex items-center gap-3 mb-10">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand-500/10 border border-brand-500/20">
              <Layers className="h-4 w-4 text-brand-500" />
            </span>
            <p className="eyebrow">AI Learning Division</p>
          </div>
          <h2 className="h-display max-w-3xl">
            From Zero to AI-Ready.{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient-brand">At Your Own Pace.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-ink-900/50 text-[15px] leading-[1.85]">
            Whether you&apos;re a student, professional, or business leader — our weekend-first
            programs combine live learning, real projects, and certifications that
            actually move the needle in your career.
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
        <div className="mt-10 space-y-5">
          {COURSES.map((course, i) => (
            <ScrollReveal key={course.id} animation="slide-up" delay={i * 120} duration={750}>
              <CourseCard course={course} />
            </ScrollReveal>
          ))}
        </div>

        {/* ── Show more ── */}
        <ScrollReveal animation="fade-up" delay={80} className="mt-10">
          <button className="group inline-flex items-center gap-2 text-[13px] font-medium text-ink-900/45 hover:text-brand-500 transition-colors duration-300">
            <span className="underline-offset-4 underline decoration-ink-900/15 group-hover:decoration-brand-400/70 transition-all duration-300">
              Show 5 more courses
            </span>
            <span className="group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </button>
        </ScrollReveal>
      </div>

      {/* Section bottom divider */}
      <div className="absolute bottom-0 inset-x-0 divider-glow" />
    </section>
  );
}

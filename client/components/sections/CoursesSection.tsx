import Link from "next/link";
import { CourseCard } from "./CourseCard";
import { COURSES } from "@/data/courses";
import { ScrollReveal, ShinyText } from "@/components/ui";
import { Layers, ArrowRight } from "lucide-react";

export function CoursesSection() {
  return (
    <section
      id="learning"
      className="relative bg-surface-alt px-5 py-8 sm:pt-1 sm:pb-8"
    >
      <div className="container-x">
        {/* ── Section label & Header ── */}
        <ScrollReveal animation="fade-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <ShinyText
                text="AI Learning Division"
                color="#1d4ed8"
                shineColor="#93c5fd"
                speed={2.5}
              />
            </span>
          </div>
          <h2 className="h-display text-text max-w-3xl">
            From Zero to AI-Job Ready. <br className="hidden sm:block" />
            <span className="text-gradient-brand">At Your Own Pace.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-text-muted text-[15px] sm:text-base leading-relaxed">
            Whether you&apos;re a student, professional, or business leader —
            our weekend-first programs combine live learning, real projects, and
            certifications that actually move the needle in your career.
          </p>
        </ScrollReveal>

        {/* ── Cards Grid (3 Columns Max for 3 Programs) ── */}
        <div className="mt-10 grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course, i) => (
            <ScrollReveal
              key={course.id}
              animation="fade-up"
              delay={i * 100}
              className="h-full"
            >
              <CourseCard course={course} />
            </ScrollReveal>
          ))}
        </div>

        {/* ── View all ── */}
        <ScrollReveal
          animation="fade-up"
          delay={80}
          className="mt-10 flex justify-center sm:justify-start"
        >
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-brand-600 hover:text-brand-700 transition-colors duration-200"
          >
            View all programs
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

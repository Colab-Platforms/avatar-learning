import Link from "next/link";
import { CourseCard } from "./CourseCard";
import { COURSES } from "@/data/courses";
import { ScrollReveal } from "@/components/ui";
import { Layers, ArrowRight } from "lucide-react";

export function CoursesSection() {
  return (
    <section id="learning" className="relative bg-surface-alt py-10 sm:py-5">
      <div className="container-x">
        {/* ── Section label ── */}
        <ScrollReveal animation="fade-up">
          <div className="flex items-center gap-3 mb-10">
            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand-50 border border-brand-200">
              <Layers className="h-4 w-4 text-brand-600" />
            </span>
            <p className="eyebrow">AI Learning Division</p>
          </div>
          <h2 className="h-display text-text max-w-3xl">
            From Zero to AI-Ready. <br className="hidden sm:block" />
            <span className="text-gradient-brand">At Your Own Pace.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-text-muted text-[15px] leading-[1.85]">
            Whether you&apos;re a student, professional, or business leader —
            our weekend-first programs combine live learning, real projects, and
            certifications that actually move the needle in your career.
          </p>
        </ScrollReveal>

        {/* ── Cards ── */}
        <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COURSES.map((course, i) => (
            <ScrollReveal key={course.id} animation="fade-up" delay={i * 100}>
              <CourseCard course={course} />
            </ScrollReveal>
          ))}
        </div>

        {/* ── View all ── */}
        <ScrollReveal animation="fade-up" delay={80} className="mt-10">
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 text-[14px] font-medium text-brand-600 hover:text-brand-700 transition-colors duration-200"
          >
            View all programs
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

import Image from "next/image";
import { ChevronLeft, ChevronRight, BadgeCheck, Zap, Clock, ArrowRight } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { Course } from "@/types";

interface CourseCardProps { course: Course; }

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article
      className="group/card relative rounded-2xl border border-ink-900/[0.07] bg-white overflow-hidden card-lift"
      style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}
    >
      {/* Hover shimmer top line */}
      <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-brand-500/0 to-transparent
                      group-hover/card:via-brand-500/60 transition-all duration-600 origin-center" />

      {/* Right accent glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{ background: "radial-gradient(ellipse at 75% 50%, rgba(47,123,255,0.04) 0%, transparent 60%)" }}
      />

      <div className="relative p-6 sm:p-8 grid gap-8 md:grid-cols-[1fr_2fr]">

        {/* ── Left ── */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {course.free && <Badge variant="free">FREE</Badge>}
            <Badge variant="level-light">{course.level}</Badge>
          </div>

          <h3 className="mt-4 text-xl sm:text-[22px] font-semibold tracking-tight leading-snug
                          group-hover/card:text-brand-600 transition-colors duration-350">
            {course.title}
          </h3>

          {/* Tool tags */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {course.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-lg border border-ink-900/[0.07] bg-ink-900/[0.025] px-2.5 py-1 text-[11px] font-medium text-ink-900/52
                           transition-all duration-250 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 cursor-default"
              >
                {tool}
              </span>
            ))}
          </div>

          {/* Meta */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <span className="flex items-center justify-center h-5 w-5 rounded-md bg-brand-500/10">
                <Zap className="h-3 w-3 text-brand-500" />
              </span>
              {course.weeks} Weeks
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-900/50">
              <Clock className="h-3.5 w-3.5" />
              {course.sessions}
            </span>
            {course.certificate && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <BadgeCheck className="h-4 w-4" />
                Certificate
              </span>
            )}
          </div>

          {/* CTAs */}
          <div className="mt-auto pt-8 flex items-center gap-3">
            <Button variant="primary" size="sm">
              Enroll for free
            </Button>
            <button className="group/lnk inline-flex items-center gap-1 text-sm font-medium text-ink-900/55 hover:text-brand-500 transition-colors duration-250">
              View details
              <ArrowRight className="h-3.5 w-3.5 group-hover/lnk:translate-x-1 transition-transform duration-250" />
            </button>
          </div>
        </div>

        {/* ── Right: module grid ── */}
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {course.modules.map((mod, i) => (
              <div
                key={i}
                className="group/mod cursor-pointer"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-ink-900">
                  <Image
                    src={mod.image} alt={mod.title}
                    fill sizes="180px"
                    className="object-cover transition-transform duration-600 group-hover/mod:scale-110"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                                  opacity-0 group-hover/mod:opacity-100 transition-opacity duration-350
                                  flex items-end p-2">
                    <span className="text-white text-[10px] font-semibold bg-brand-500/80 rounded-md px-1.5 py-0.5
                                     translate-y-2 group-hover/mod:translate-y-0 transition-transform duration-300">
                      Preview →
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[13px] font-medium leading-snug text-ink-900
                               group-hover/mod:text-brand-600 transition-colors duration-250">
                  {mod.title}
                </p>
                <p className="text-[11px] text-ink-900/38 mt-0.5">{mod.session}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost-dark" size="icon" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost-dark" size="icon" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

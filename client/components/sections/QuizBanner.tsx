import Link from "next/link";
import { Button, ScrollReveal } from "@/components/ui";
import { QUIZ_BANNER } from "@/data/quiz";
import { ArrowRight, Sparkles } from "lucide-react";

export function QuizBanner() {
  return (
    <section className="relative bg-white py-6">
      <div className="container-x">
        <ScrollReveal animation="fade-up">
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 border border-blue-100/90 shadow-md shadow-blue-900/5 p-6 sm:p-8 md:px-10 md:py-8 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-blue-200/50 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full bg-indigo-200/40 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
              {/* Left Column: Eyebrow, Heading & Subheading */}
              <div className="flex-1 max-w-2xl">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                    {QUIZ_BANNER.eyebrow}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Not Sure Which Program Is Right For You?
                </h3>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  {QUIZ_BANNER.description}
                </p>
              </div>

              {/* Right Column: CTA Button */}
              <div className="shrink-0 flex items-center">
                <Link href="/quiz" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 group"
                  >
                    {QUIZ_BANNER.ctaLabel}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

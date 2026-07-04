import Link from "next/link";
import { Button, ScrollReveal } from "@/components/ui";
import { QuizIllustration } from "@/components/illustrations/QuizIllustration";
import { QUIZ_BANNER } from "@/data/quiz";
import { Brain, ArrowRight, Sparkles } from "lucide-react";

export function QuizBanner() {
  return (
    <section className="relative bg-white py-5">
      <div className="container-x">
        <ScrollReveal animation="fade-up">
          <div className="rounded-3xl bg-surface-alt border border-border overflow-hidden shadow-sm">
            <div className="grid md:grid-cols-2 items-center">
              {/* ── Text side ── */}
              <div className="p-10 sm:p-14">
                <p className="eyebrow mb-5">
                  <Brain className="h-3.5 w-3.5" />
                  {QUIZ_BANNER.eyebrow}
                </p>
                <h3 className="text-[32px] sm:text-[40px] font-semibold tracking-tight leading-[1.1] text-text">
                  {QUIZ_BANNER.heading.split("\n").map((line, i, arr) => (
                    <span key={i}>
                      {i === 0 ? (
                        <span className="text-gradient-brand">{line}</span>
                      ) : (
                        <span>{line}</span>
                      )}
                      {i < arr.length - 1 && <br />}
                    </span>
                  ))}
                </h3>
                <p className="mt-5 text-[14px] text-text-muted max-w-sm leading-[1.85]">
                  {QUIZ_BANNER.description}
                </p>

                {/* Feature chips */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {["10 Questions", "2 min", "Instant results"].map(
                    (chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-700"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-brand-500" />
                        {chip}
                      </span>
                    ),
                  )}
                </div>

                <Link href="/quiz">
                  <Button
                    variant="primary"
                    size="md"
                    className="mt-8 self-start group/btn w-fit"
                  >
                    {QUIZ_BANNER.ctaLabel}
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-250" />
                  </Button>
                </Link>
              </div>

              {/* ── Illustration side ── */}
              <div className="relative h-72 md:h-auto flex items-center justify-center p-8">
                <QuizIllustration className="w-full h-auto max-w-[280px]" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

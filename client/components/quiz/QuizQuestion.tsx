"use client";

import { cn } from "@/lib/utils";
import type { QuizQuestion as QuizQuestionType } from "@/data/quizQuestions";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";

interface Props {
  question: QuizQuestionType;
  selected: string[];
  onToggle: (label: string) => void;
  current: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
}

export function QuizQuestion({ question, selected, onToggle, current, total, onNext, onBack }: Props) {
  const isLast    = current === total - 1;
  const hasAnswer = selected.length > 0;
  const stepProgress = Math.round(((current + (hasAnswer ? 1 : 0)) / total) * 100);

  return (
    <div className="flex flex-col gap-8">

      {/* ── Heading ── */}
      <div>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 text-3xl
                        bg-brand-500/10 border border-brand-500/20 shadow-[0_0_24px_rgba(0,200,255,0.08)]">
          {question.emoji}
        </div>
        <h1 className="text-[26px] sm:text-[34px] font-semibold leading-[1.15] tracking-tight text-white">
          {question.title}
        </h1>
        <p className="mt-2.5 text-[14px] text-white/50 leading-relaxed">{question.sub}</p>
      </div>

      {/* ── Progress ── */}
      <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] text-white/45 font-medium">
            Question <span className="text-brand-300">{current + 1}</span> of {total}
          </span>
          <span className="text-[12px] text-brand-300/80 font-semibold tabular-nums">{stepProgress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-linear-to-r from-brand-500 to-elec-500 transition-all duration-500 ease-out
                       shadow-[0_0_12px_rgba(0,200,255,0.45)]"
            style={{ width: `${Math.max(4, stepProgress)}%` }}
          />
        </div>
      </div>

      {/* ── Options ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.label);
          return (
            <button
              key={opt.label}
              onClick={() => onToggle(opt.label)}
              className={cn(
                "group relative flex items-center gap-4 rounded-2xl border p-4 text-left",
                "transition-all duration-200 cursor-pointer overflow-hidden",
                isSelected
                  ? "border-brand-500/50 bg-brand-500/12 shadow-[0_0_0_1px_rgba(0,200,255,0.3),0_0_24px_rgba(0,200,255,0.12)]"
                  : "border-white/10 bg-white/4 hover:border-brand-500/25 hover:bg-brand-500/6 hover:shadow-[0_0_20px_rgba(0,200,255,0.06)]",
              )}
            >
              {isSelected && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-60"
                  style={{ background: "radial-gradient(circle at top left, rgba(0,200,255,0.12) 0%, transparent 55%)" }}
                />
              )}

              {/* Icon */}
              <span className={cn(
                "relative flex-shrink-0 text-[20px] w-10 h-10 flex items-center justify-center rounded-xl border select-none transition-colors",
                isSelected
                  ? "bg-brand-500/15 border-brand-500/30"
                  : "bg-white/6 border-white/10 group-hover:border-brand-500/20",
              )}>
                {opt.icon}
              </span>

              {/* Text */}
              <div className="relative flex-1 min-w-0">
                <p className={cn(
                  "text-[13px] font-semibold leading-snug",
                  isSelected ? "text-brand-200" : "text-white/90",
                )}>
                  {opt.label}
                </p>
                {opt.desc && (
                  <p className="mt-0.5 text-[11px] text-white/40 leading-snug">{opt.desc}</p>
                )}
              </div>

              {/* Checkbox / radio indicator */}
              <div className={cn(
                "relative flex-shrink-0 flex items-center justify-center transition-all duration-200",
                question.multi ? "w-5 h-5 rounded-md border-2" : "w-5 h-5 rounded-full border-2",
                isSelected
                  ? "border-brand-400 bg-brand-400 shadow-[0_0_10px_rgba(0,200,255,0.5)]"
                  : "border-white/20 bg-transparent group-hover:border-brand-500/40",
              )}>
                {isSelected && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2">
                    <path d="M1 4l2.5 2.5L9 1" stroke="#050B14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/6">
        <button
          onClick={onBack}
          disabled={current === 0}
          className={cn(
            "inline-flex items-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-full border transition-all duration-200",
            current === 0
              ? "border-white/8 text-white/20 cursor-not-allowed"
              : "border-white/15 text-white/55 hover:text-white hover:border-brand-500/30 hover:bg-brand-500/6",
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <Button
          onClick={onNext}
          disabled={!hasAnswer}
          variant="primary"
          size="md"
          className={cn("btn-glow", !hasAnswer && "opacity-40")}
        >
          {isLast ? "See My Results" : "Next"}
          {isLast && <CheckCircle2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

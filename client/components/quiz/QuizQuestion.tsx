"use client";

import { cn } from "@/lib/utils";
import type { QuizQuestion as QuizQuestionType } from "@/data/quizQuestions";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

interface Props {
  question: QuizQuestionType;
  selected: string[];
  onToggle: (label: string) => void;
  current: number;
  total: number;
  progress: number;
  onNext: () => void;
  onBack: () => void;
}

export function QuizQuestion({ question, selected, onToggle, current, total, progress, onNext, onBack }: Props) {
  const isLast    = current === total - 1;
  const hasAnswer = selected.length > 0;

  return (
    <div className="flex flex-col gap-8">

      {/* ── Heading ── */}
      <div>
        <div className="text-3xl mb-3">{question.emoji}</div>
        <h1 className="text-[26px] sm:text-[34px] font-semibold leading-[1.15] tracking-tight text-white">
          {question.title}
        </h1>
        <p className="mt-2.5 text-[14px] text-white/45">{question.sub}</p>
      </div>

      {/* ── Progress ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-white/35 font-medium">Question {current + 1} of {total}</span>
          <span className="text-[12px] text-white/35 font-medium">{progress}% Complete</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(2, progress)}%` }}
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
                "transition-all duration-200 cursor-pointer",
                isSelected
                  ? "border-brand-500/60 bg-brand-500/10 shadow-[0_0_0_1px_rgba(0,200,255,0.25),0_0_18px_rgba(0,200,255,0.08)]"
                  : "border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6"
              )}
            >
              {/* Icon */}
              <span className="flex-shrink-0 text-[20px] w-10 h-10 flex items-center justify-center rounded-xl bg-white/6 border border-white/8 select-none">
                {opt.icon}
              </span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[13px] font-semibold leading-snug",
                  isSelected ? "text-brand-300" : "text-white/90"
                )}>
                  {opt.label}
                </p>
                {opt.desc && (
                  <p className="mt-0.5 text-[11px] text-white/35 leading-snug">{opt.desc}</p>
                )}
              </div>

              {/* Checkbox / radio indicator */}
              <div className={cn(
                "flex-shrink-0 flex items-center justify-center transition-all duration-200",
                question.multi
                  ? "w-5 h-5 rounded-md border-2"
                  : "w-5 h-5 rounded-full border-2",
                isSelected
                  ? "border-brand-500 bg-brand-500"
                  : "border-white/20 bg-transparent group-hover:border-white/40"
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
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          disabled={current === 0}
          className={cn(
            "inline-flex items-center gap-2 text-[13px] font-medium px-4 py-2.5 rounded-full border transition-all duration-200",
            current === 0
              ? "border-white/8 text-white/20 cursor-not-allowed"
              : "border-white/15 text-white/55 hover:text-white hover:border-white/30"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!hasAnswer}
          className={cn(
            "inline-flex items-center gap-2 text-[14px] font-semibold px-7 py-3 rounded-full transition-all duration-200",
            hasAnswer
              ? "bg-white text-ink-950 hover:bg-white/90 shadow-[0_4px_24px_rgba(255,255,255,0.12)] hover:scale-[1.03] active:scale-[0.97]"
              : "bg-white/10 text-white/25 cursor-not-allowed"
          )}
        >
          {isLast ? "See My Results" : "Next →"}
          {isLast && <CheckCircle2 className="h-4 w-4" />}
          {!isLast && <ArrowRight className="h-4 w-4 hidden" />}
        </button>
      </div>
    </div>
  );
}

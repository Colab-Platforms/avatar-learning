import { CheckIcon } from "lucide-react";
import type { AttemptQuestion } from "@/lib/assessmentApi";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export function QuestionRenderer({
  question,
  selectedOptionId,
  onSelect,
  totalQuestions,
}: {
  question: AttemptQuestion;
  selectedOptionId: string | null;
  onSelect: (optionId: string) => void;
  totalQuestions: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Question header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold uppercase tracking-wider border border-brand-100">
            Question {question.questionOrder}
            <span className="text-brand-400 font-normal">/ {totalQuestions}</span>
          </span>
          {selectedOptionId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
              <CheckIcon size={11} />
              Answered
            </span>
          )}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-relaxed">
          {question.questionText}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((opt, idx) => {
          const active = opt.id === selectedOptionId;
          const label = OPTION_LABELS[idx] ?? String(idx + 1);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              title={active ? "Click to deselect" : undefined}
              className={`w-full flex items-center gap-4 px-4 sm:px-5 py-3.5 rounded-xl text-left border-2 transition-all duration-150 group ${
                active
                  ? "bg-brand-600 border-brand-600 shadow-md shadow-brand-100 hover:bg-brand-700 hover:border-brand-700"
                  : "bg-white border-slate-200 hover:border-brand-300 hover:bg-brand-50/40"
              }`}
            >
              {/* Option label */}
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700"
                }`}
              >
                {label}
              </span>

              {/* Option text */}
              <span
                className={`flex-1 text-sm sm:text-[15px] leading-relaxed font-medium ${
                  active ? "text-white" : "text-slate-700"
                }`}
              >
                {opt.optionText}
              </span>

              {/* Check indicator */}
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  active
                    ? "border-white bg-white"
                    : "border-slate-300 group-hover:border-brand-400"
                }`}
              >
                {active && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

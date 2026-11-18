import { CheckIcon } from "lucide-react";

export function QuestionNavigator({
  questions,
  answers,
  currentId,
  onJump,
}: {
  questions: { id: string; questionOrder: number }[];
  answers: Record<string, string | null>;
  currentId: string;
  onJump: (id: string) => void;
}) {
  const sorted = [...questions].sort((a, b) => a.questionOrder - b.questionOrder);
  const answeredCount = sorted.filter((q) => !!answers[q.id]).length;

  return (
    <div>
      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400 shrink-0" />
          <span className="text-xs text-slate-500">Answered <strong className="text-slate-700">{answeredCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-slate-200 shrink-0" />
          <span className="text-xs text-slate-500">Not answered <strong className="text-slate-700">{sorted.length - answeredCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-3 h-3 rounded-sm bg-brand-500 shrink-0" />
          <span className="text-xs text-slate-500">Current</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 gap-2">
        {sorted.map((q) => {
          const answered = !!answers[q.id];
          const active = q.id === currentId;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(q.id)}
              title={`Question ${q.questionOrder}${answered ? " (answered)" : ""}`}
              className={`aspect-square rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all duration-150 border-2 relative ${
                active
                  ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100 scale-105"
                  : answered
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400"
                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span>{q.questionOrder}</span>
              {answered && !active && (
                <CheckIcon size={8} className="text-emerald-500 absolute bottom-1 right-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { CheckCircle2, XCircle } from "lucide-react";

interface ResultViewOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

interface ResultViewQuestion {
  id: string;
  questionText: string;
  questionOrder: number;
  options: ResultViewOption[];
}

interface ResultViewAnswer {
  selectedOptionId: string | null;
}

export interface AssessmentResultViewData {
  attempt: {
    score: number | null;
    maxScore: number | null;
    scorePercent: number | null;
    isPassed: boolean | null;
  };
  assessment: {
    title: string;
    questions: ResultViewQuestion[];
  };
  answers: Record<string, ResultViewAnswer | undefined>;
}

export function AssessmentResultView({
  result,
  questionsOnly = false,
}: {
  result: AssessmentResultViewData;
  questionsOnly?: boolean;
}) {
  const { attempt, assessment, answers } = result;
  const passed = attempt.isPassed;

  return (
    <div className="space-y-6">
      {!questionsOnly && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {assessment.title}
          </p>
          <p className="text-4xl font-bold text-slate-900">
            {attempt.score ?? 0}
            <span className="text-slate-300">/{attempt.maxScore ?? 0}</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {(attempt.scorePercent ?? 0).toFixed(0)}% score
          </p>
          {passed !== null && (
            <span
              className={`inline-flex items-center gap-1.5 mt-4 px-4 py-1.5 rounded-full text-sm font-semibold ${
                passed ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {passed ? "Passed" : "Not passed"}
            </span>
          )}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-800">Question review</h2>
        {[...assessment.questions]
          .sort((a, b) => a.questionOrder - b.questionOrder)
          .map((q) => {
            const answer = answers[q.id];
            return (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900 mb-3">
                  {q.questionOrder}. {q.questionText}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((o) => {
                    const selected = answer?.selectedOptionId === o.id;
                    return (
                      <div
                        key={o.id}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                          o.isCorrect
                            ? "bg-emerald-50 text-emerald-700"
                            : selected
                              ? "bg-red-50 text-red-700"
                              : "text-slate-600"
                        }`}
                      >
                        {o.isCorrect ? (
                          <CheckCircle2 size={14} className="shrink-0" />
                        ) : selected ? (
                          <XCircle size={14} className="shrink-0" />
                        ) : (
                          <span className="w-3.5 shrink-0" />
                        )}
                        {o.optionText}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

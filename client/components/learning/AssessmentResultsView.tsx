"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  RefreshCw,
  Target,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { LearningBreadcrumbs } from "@/components/learning/LearningBreadcrumbs";
import { useLearningRoutes } from "@/components/learning/LearningRouteContext";
import { AssessmentResultView } from "@/components/assessment/AssessmentResultView";
import {
  AssessmentStatusBadge,
  formatDurationSeconds,
  ScoreStat,
} from "@/components/assessment/AssessmentStatusBadge";
import { useAssessmentResult } from "@/hooks/queries/useAssessmentResult";
import { useStartAssessmentAttempt } from "@/hooks/mutations/useStartAssessmentAttempt";
import { useAppSelector } from "@/store/hooks";

export function AssessmentResultsView({
  courseId,
  attemptId,
}: {
  courseId: string;
  attemptId: string;
}) {
  const id = courseId;
  const routes = useLearningRoutes();
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [starting, setStarting] = useState(false);

  const { data: result, isLoading, isError, error } = useAssessmentResult(attemptId);
  const startAttempt = useStartAssessmentAttempt(id);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const handleRetake = async () => {
    if (!result) return;
    setStarting(true);
    try {
      const attempt = await startAttempt.mutateAsync(result.assessment.id);
      router.push(routes.attempt(attempt.id));
    } catch {
      // mutation error
    } finally {
      setStarting(false);
    }
  };

  const isWeekly = result?.assessment.type === "WEEKLY";
  const typeLabel =
    result?.assessment.type === "FINAL"
      ? "Final Assessment"
      : result?.assessment.weekNumber != null
        ? `Week ${result.assessment.weekNumber} · Weekly Assessment`
        : "Weekly Assessment";

  return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto">
          <LearningBreadcrumbs current="results" className="mb-6" />

          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-red-500">
                {(error as any)?.response?.data?.message ?? "Failed to load results."}
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {typeLabel}
                </p>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {result.assessment.title}
                  </h1>
                  <AssessmentStatusBadge
                    status={
                      result.attempt.isPassed
                        ? "PASSED"
                        : result.attempt.isPassed === false
                          ? "FAILED"
                          : result.summary.status
                    }
                  />
                </div>

                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-slate-900 tabular-nums">
                    {result.attempt.score ?? 0}
                    <span className="text-slate-300">/{result.attempt.maxScore ?? 0}</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {Math.round(result.attempt.scorePercent ?? 0)}% · Attempt #
                    {result.attempt.attemptNumber}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-3">
                    <div className="flex items-center gap-1 text-emerald-600 mb-1">
                      <CheckCircle2 size={12} />
                      <span className="text-[10px] font-semibold uppercase">Correct</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-800">{result.breakdown.correct}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-3">
                    <div className="flex items-center gap-1 text-red-600 mb-1">
                      <XCircle size={12} />
                      <span className="text-[10px] font-semibold uppercase">Wrong</span>
                    </div>
                    <p className="text-lg font-bold text-red-800">{result.breakdown.wrong}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                      <MinusCircle size={12} />
                      <span className="text-[10px] font-semibold uppercase">Skipped</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{result.breakdown.skipped}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3">
                    <div className="flex items-center gap-1 text-slate-500 mb-1">
                      <HelpCircle size={12} />
                      <span className="text-[10px] font-semibold uppercase">Total</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{result.breakdown.total}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 mb-6">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={12} />
                    Time taken {formatDurationSeconds(result.attempt.durationSeconds)}
                  </span>
                  {result.attempt.submittedAt && (
                    <span>
                      {new Date(result.attempt.submittedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  )}
                  {result.assessment.passingScorePercent != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Target size={12} />
                      Pass mark {result.assessment.passingScorePercent}%
                    </span>
                  )}
                </div>

                {isWeekly && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                    <ScoreStat
                      label="Best"
                      value={
                        result.summary.bestScorePercent != null
                          ? `${Math.round(result.summary.bestScorePercent)}%`
                          : "—"
                      }
                    />
                    <ScoreStat
                      label="Latest"
                      value={
                        result.summary.latestScorePercent != null
                          ? `${Math.round(result.summary.latestScorePercent)}%`
                          : "—"
                      }
                    />
                    <ScoreStat
                      label="Highest %"
                      value={
                        result.summary.bestScorePercent != null
                          ? `${Math.round(result.summary.bestScorePercent)}%`
                          : "—"
                      }
                    />
                    <ScoreStat
                      label="Attempts"
                      value={String(result.summary.totalAttempts)}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    href={routes.assessments}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Back to Assessments
                  </Link>
                  {isWeekly && result.summary.canRetake && (
                    <button
                      type="button"
                      onClick={handleRetake}
                      disabled={starting}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw size={14} />
                      {starting ? "Starting…" : "Attempt Again"}
                    </button>
                  )}
                  <Link
                    href={routes.assessmentHistory(result.assessment.id)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View History
                  </Link>
                </div>
              </div>

              <AssessmentResultView result={result} questionsOnly />
            </div>
          )}
        </div>
  );
}

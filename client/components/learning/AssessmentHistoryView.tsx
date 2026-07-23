"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  History,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { LearningBreadcrumbs } from "@/components/learning/LearningBreadcrumbs";
import { useLearningRoutes } from "@/components/learning/LearningRouteContext";
import {
  AssessmentStatusBadge,
  formatDurationSeconds,
  formatRelativeAttemptDate,
  ScoreStat,
} from "@/components/assessment/AssessmentStatusBadge";
import { useAssessmentHistory } from "@/hooks/queries/useAssessment";
import { useStartAssessmentAttempt } from "@/hooks/mutations/useStartAssessmentAttempt";
import { useAppSelector } from "@/store/hooks";

export function AssessmentHistoryView({
  courseId,
  assessmentId,
}: {
  courseId: string;
  assessmentId: string;
}) {
  const id = courseId;
  const routes = useLearningRoutes();
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [starting, setStarting] = useState(false);

  const { data, isLoading, isError, error } = useAssessmentHistory(id, assessmentId);
  const startAttempt = useStartAssessmentAttempt(id);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const handleRetake = async () => {
    setStarting(true);
    try {
      const attempt = await startAttempt.mutateAsync(assessmentId);
      router.push(routes.attempt(attempt.id));
    } catch {
      // mutation error
    } finally {
      setStarting(false);
    }
  };

  const isWeekly = data?.assessment.type === "WEEKLY";
  const canRetake =
    isWeekly ||
    (data?.summary.remainingAttempts != null && data.summary.remainingAttempts > 0);

  return (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-3xl mx-auto">
          <LearningBreadcrumbs current="history" backOnly className="mb-6" />

          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <ShieldAlert size={32} className="mx-auto text-amber-500 mb-3" />
              <p className="text-sm text-slate-600">
                {(error as any)?.response?.data?.message ?? "Failed to load history."}
              </p>
            </div>
          )}

          {data && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                      {data.assessment.type === "FINAL"
                        ? "Final Assessment"
                        : `Week ${data.assessment.weekNumber ?? "—"} · History`}
                    </p>
                    <h1 className="text-xl font-bold text-slate-900">{data.assessment.title}</h1>
                  </div>
                  <AssessmentStatusBadge status={data.summary.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                  <ScoreStat
                    label="Best"
                    value={
                      data.summary.bestScorePercent != null
                        ? `${Math.round(data.summary.bestScorePercent)}%`
                        : "—"
                    }
                  />
                  <ScoreStat
                    label="Latest"
                    value={
                      data.summary.latestScorePercent != null
                        ? `${Math.round(data.summary.latestScorePercent)}%`
                        : "—"
                    }
                  />
                  <ScoreStat label="Attempts" value={String(data.summary.totalAttempts)} />
                  <ScoreStat
                    label="Last"
                    value={formatRelativeAttemptDate(data.summary.lastAttemptAt)}
                  />
                </div>

                {canRetake && (
                  <button
                    type="button"
                    onClick={handleRetake}
                    disabled={starting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw size={14} />
                    {starting ? "Starting…" : isWeekly ? "Attempt Again" : "Retake Assessment"}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <History size={15} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-800">All attempts</h2>
              </div>

              {data.attempts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No completed attempts yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.attempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-900">
                            Attempt #{attempt.attemptNumber}
                          </p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              attempt.isPassed
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {attempt.isPassed ? "Passed" : "Failed"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            {attempt.submittedAt
                              ? new Date(attempt.submittedAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} />
                            {formatDurationSeconds(attempt.durationSeconds)}
                          </span>
                          <span>
                            Score {attempt.score ?? 0}/{attempt.maxScore ?? 0} (
                            {Math.round(attempt.scorePercent ?? 0)}%)
                          </span>
                        </div>
                      </div>
                      <Link
                        href={routes.results(attempt.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                      >
                        View Result
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
  );
}

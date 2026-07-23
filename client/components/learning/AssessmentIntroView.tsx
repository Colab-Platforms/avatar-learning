"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ClipboardList,
  Clock,
  HelpCircle,
  History,
  ShieldAlert,
  Target,
} from "lucide-react";
import { AssessmentStatusBadge } from "@/components/assessment/AssessmentStatusBadge";
import { LearningBreadcrumbs } from "@/components/learning/LearningBreadcrumbs";
import { useLearningRoutes } from "@/components/learning/LearningRouteContext";
import { useAssessmentDetail } from "@/hooks/queries/useAssessment";
import { useStartAssessmentAttempt } from "@/hooks/mutations/useStartAssessmentAttempt";
import { useAppSelector } from "@/store/hooks";

export function AssessmentIntroView({
  courseId,
  assessmentId,
}: {
  courseId: string;
  assessmentId: string;
}) {
  const routes = useLearningRoutes();
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);

  const { data: assessment, isLoading, isError, error } = useAssessmentDetail(
    courseId,
    assessmentId,
  );
  const startAttempt = useStartAssessmentAttempt(courseId);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const handleStart = async () => {
    try {
      const attempt = await startAttempt.mutateAsync(assessmentId);
      router.push(routes.attempt(attempt.id));
    } catch {
      // surfaced via startAttempt.error
    }
  };

  const typeLabel =
    assessment?.type === "FINAL"
      ? "Final Assessment"
      : assessment?.weekNumber != null
        ? `Week ${assessment.weekNumber} Assessment`
        : "Weekly Assessment";

  const inProgress = assessment?.inProgressAttempt ?? null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto">
      <LearningBreadcrumbs current="intro" backOnly className="mb-6" />

      {isLoading && <div className="rounded-2xl bg-slate-200 animate-pulse h-64" />}

      {isError && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert size={32} className="mx-auto text-amber-500 mb-3" />
          <p className="text-sm text-slate-600">
            {(error as any)?.response?.data?.message ??
              "This assessment is not available yet."}
          </p>
        </div>
      )}

      {assessment && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                {typeLabel}
              </p>
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <ClipboardList size={22} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                {assessment.title}
              </h1>
            </div>
            <AssessmentStatusBadge status={assessment.status} />
          </div>

          {assessment.description && (
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {assessment.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Time Limit
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {assessment.timeLimitMinutes} min
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <HelpCircle size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  Questions
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {assessment.questionCount}
              </p>
            </div>
            {assessment.passingScorePercent != null && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Target size={14} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    Passing Score
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-800">
                  {assessment.passingScorePercent}%
                </p>
              </div>
            )}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <ShieldAlert size={14} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {assessment.type === "WEEKLY" ? "Attempts" : "Attempts left"}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {assessment.type === "WEEKLY"
                  ? "Unlimited"
                  : `${assessment.remainingAttempts ?? 0} / ${assessment.maxAttempts ?? 0}`}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 mb-6 text-xs text-amber-800 leading-relaxed">
            Once started, stay on this tab — switching away is tracked and repeated
            switches will auto-submit your attempt. The timer cannot be paused.
          </div>

          {assessment.unlockStatus === "LOCKED" && (
            <p className="text-sm text-slate-500 mb-4">
              {assessment.lockReason ?? "This assessment is locked."}
            </p>
          )}

          {startAttempt.isError && (
            <p className="text-red-500 text-sm mb-4">
              {(startAttempt.error as any)?.response?.data?.message ??
                "Failed to start attempt."}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {inProgress ? (
              <Link
                href={routes.attempt(inProgress.id)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Resume Attempt
                <ChevronRight size={16} />
              </Link>
            ) : assessment.canStartNew || assessment.canRetake ? (
              <button
                type="button"
                onClick={handleStart}
                disabled={
                  startAttempt.isPending ||
                  assessment.questionCount === 0 ||
                  assessment.unlockStatus === "LOCKED"
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {startAttempt.isPending
                  ? "Starting…"
                  : assessment.totalAttempts > 0
                    ? "Attempt Again"
                    : "Start Assessment"}
                {!startAttempt.isPending && <ChevronRight size={16} />}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed"
              >
                Maximum Attempts Reached
              </button>
            )}

            {assessment.totalAttempts > 0 && (
              <Link
                href={routes.assessmentHistory(assessment.id)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <History size={15} />
                View History
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

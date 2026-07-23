"use client";

import Link from "next/link";
import {
  ClipboardList,
  Clock,
  HelpCircle,
  History,
  Lock,
  PlayCircle,
  RefreshCw,
  Target,
  Trophy,
} from "lucide-react";
import type { AssessmentSummary } from "@/lib/assessmentApi";
import { createLearningRoutes } from "@/lib/learningRoutes";
import { useLearningRoutesOptional } from "@/components/learning/LearningRouteContext";
import {
  AssessmentStatusBadge,
  formatRelativeAttemptDate,
  ScoreStat,
} from "./AssessmentStatusBadge";

export function AssessmentCard({
  courseId,
  assessment,
  onStart,
  starting,
}: {
  courseId: string;
  assessment: AssessmentSummary;
  onStart: (assessmentId: string) => void;
  starting: boolean;
}) {
  const ctxRoutes = useLearningRoutesOptional();
  const routes = ctxRoutes ?? createLearningRoutes(courseId, "public");
  const locked = assessment.unlockStatus === "LOCKED";
  const inProgress = assessment.unlockStatus === "IN_PROGRESS" || assessment.status === "IN_PROGRESS";
  const isWeekly = assessment.type === "WEEKLY";
  const exhausted = assessment.status === "EXHAUSTED";

  const historyHref = routes.assessmentHistory(assessment.id);
  const resumeHref =
    assessment.inProgressAttempt?.id
      ? routes.attempt(assessment.inProgressAttempt.id)
      : null;

  const subtitle = isWeekly
    ? `Week ${assessment.weekNumber ?? "—"} · Practice`
    : "Capstone · Limited attempts";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
              {subtitle}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {assessment.title}
            </h3>
            {assessment.description && (
              <p className="text-sm text-slate-500 mt-1.5 line-clamp-2">{assessment.description}</p>
            )}
          </div>
          <AssessmentStatusBadge status={assessment.status ?? "NOT_ATTEMPTED"} />
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <HelpCircle size={13} className="text-slate-400" />
            {assessment.questionCount} Questions
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
            <Clock size={13} className="text-slate-400" />
            {assessment.timeLimitMinutes} min
          </span>
          {assessment.passingScorePercent != null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
              <Target size={13} className="text-slate-400" />
              {assessment.passingScorePercent}% to pass
            </span>
          )}
          {!isWeekly && assessment.maxAttempts != null && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
              <Trophy size={13} className="text-slate-400" />
              {assessment.attemptsUsed} / {assessment.maxAttempts} attempts
            </span>
          )}
        </div>

        {assessment.totalAttempts > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <ScoreStat
              label="Best"
              value={
                assessment.bestScorePercent != null
                  ? `${Math.round(assessment.bestScorePercent)}%`
                  : "—"
              }
            />
            <ScoreStat
              label="Latest"
              value={
                assessment.latestScorePercent != null
                  ? `${Math.round(assessment.latestScorePercent)}%`
                  : "—"
              }
            />
            <ScoreStat label="Attempts" value={String(assessment.totalAttempts)} />
            <ScoreStat
              label="Last attempt"
              value={formatRelativeAttemptDate(assessment.lastAttemptAt)}
            />
          </div>
        )}

        {locked && (
          <p className="text-xs text-slate-500 mb-4 flex items-start gap-2">
            <Lock size={13} className="mt-0.5 shrink-0 text-slate-400" />
            {assessment.lockReason ?? "Complete prior requirements to unlock."}
          </p>
        )}

        {!isWeekly && exhausted && (
          <p className="text-xs text-slate-600 mb-4 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            Maximum attempts reached. You can still review your attempt history and results.
          </p>
        )}

        {!isWeekly && !exhausted && assessment.remainingAttempts != null && (
          <p className="text-xs text-slate-500 mb-4">
            <span className="font-semibold text-slate-700">{assessment.remainingAttempts}</span>{" "}
            attempt{assessment.remainingAttempts === 1 ? "" : "s"} remaining
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          {locked ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              <Lock size={14} /> Locked
            </button>
          ) : inProgress && resumeHref ? (
            <Link
              href={resumeHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
            >
              <PlayCircle size={14} /> Resume Attempt
            </Link>
          ) : assessment.totalAttempts === 0 ? (
            <button
              type="button"
              disabled={starting || !assessment.canStartNew}
              onClick={() => onStart(assessment.id)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <ClipboardList size={14} />
              {starting ? "Starting…" : "Start Assessment"}
            </button>
          ) : isWeekly ? (
            <button
              type="button"
              disabled={starting}
              onClick={() => onStart(assessment.id)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} />
              {starting ? "Starting…" : "Attempt Again"}
            </button>
          ) : assessment.canStartNew ? (
            <button
              type="button"
              disabled={starting}
              onClick={() => onStart(assessment.id)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} />
              {starting ? "Starting…" : "Retake Assessment"}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              Maximum Attempts Reached
            </button>
          )}

          {assessment.totalAttempts > 0 && (
            <Link
              href={historyHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <History size={14} /> View History
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

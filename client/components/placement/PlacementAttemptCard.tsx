"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import type { PlacementAttemptHistoryItem } from "@/lib/direct2hire/placementApi";
import { formatDateTime, formatDuration } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type AttemptLike = Pick<
  PlacementAttemptHistoryItem,
  | "id"
  | "attemptNumber"
  | "status"
  | "score"
  | "maxScore"
  | "scorePercent"
  | "startedAt"
  | "submittedAt"
  | "durationSeconds"
  | "isPassed"
>;

interface PlacementAttemptCardProps {
  attempt: AttemptLike;
  variant?: "light" | "dark";
  showResultLink?: boolean;
}

function statusLabel(status: AttemptLike["status"]) {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";
    case "AUTO_SUBMITTED_TIMEOUT":
      return "Auto-submitted (timeout)";
    case "AUTO_SUBMITTED_VIOLATION":
      return "Auto-submitted (violation)";
    default:
      return status;
  }
}

export function PlacementAttemptCard({
  attempt,
  variant = "light",
  showResultLink = false,
}: PlacementAttemptCardProps) {
  const isDark = variant === "dark";
  const passed = attempt.isPassed === true;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3",
        isDark ? "border-white/8 bg-ink-900/40" : "border-slate-200 bg-slate-50/80",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-slate-800")}>
            Attempt #{attempt.attemptNumber}
          </p>
          <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
            {statusLabel(attempt.status)}
          </p>
        </div>
        {attempt.isPassed != null && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide",
              passed
                ? isDark
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isDark
                  ? "bg-red-500/10 text-red-400 border-red-500/25"
                  : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {passed ? "Passed" : "Failed"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Score" value={attempt.score != null ? `${attempt.score}/${attempt.maxScore ?? "—"}` : "—"} isDark={isDark} />
        <Stat
          label="Percentage"
          value={attempt.scorePercent != null ? `${attempt.scorePercent.toFixed(0)}%` : "—"}
          isDark={isDark}
        />
        <Stat label="Time Taken" value={formatDuration(attempt.durationSeconds)} isDark={isDark} />
        <Stat label="Started" value={formatDateTime(attempt.startedAt)} isDark={isDark} />
        <Stat label="Submitted" value={formatDateTime(attempt.submittedAt)} isDark={isDark} />
      </div>

      {showResultLink && (
        <Link
          href={`/dashboard/placement/assessment/results/${attempt.id}`}
          className={cn(
            "inline-flex text-xs font-semibold transition-colors",
            isDark ? "text-brand-400 hover:text-brand-300" : "text-blue-600 hover:text-blue-700",
          )}
        >
          View detailed results →
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div>
      <p className={cn("text-[10px] font-semibold uppercase tracking-widest", isDark ? "text-white/30" : "text-slate-400")}>
        {label}
      </p>
      <p className={cn("text-sm font-semibold mt-0.5", isDark ? "text-white/80" : "text-slate-700")}>{value}</p>
    </div>
  );
}

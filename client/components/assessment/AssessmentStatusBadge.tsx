import { CheckCircle2, Clock3, XCircle, Loader2, Ban, CircleDashed } from "lucide-react";
import type { AssessmentPerformanceStatus } from "@/lib/assessmentApi";

const STATUS_META: Record<
  AssessmentPerformanceStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  NOT_ATTEMPTED: {
    label: "Not Attempted",
    className: "bg-slate-100 text-slate-600",
    icon: CircleDashed,
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-amber-50 text-amber-700",
    icon: Loader2,
  },
  PASSED: {
    label: "Passed",
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },
  EXHAUSTED: {
    label: "Max Attempts Reached",
    className: "bg-slate-800 text-white",
    icon: Ban,
  },
};

export function AssessmentStatusBadge({
  status,
}: {
  status: AssessmentPerformanceStatus;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.NOT_ATTEMPTED;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.className}`}
    >
      <Icon size={12} className={status === "IN_PROGRESS" ? "animate-spin" : undefined} />
      {meta.label}
    </span>
  );
}

export function formatRelativeAttemptDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000);

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDurationSeconds(seconds: number | null | undefined) {
  if (seconds == null || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function ScoreStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        <Clock3 size={11} />
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

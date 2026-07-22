"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MockInterviewTimeline } from "@/lib/direct2hire/mockInterviewApi";

const STEPS: {
  key: keyof MockInterviewTimeline;
  label: string;
}[] = [
  { key: "assessmentCompletedAt", label: "Assessment Completed" },
  { key: "requestedAt", label: "Interview Requested" },
  { key: "scheduledAt", label: "Interview Scheduled" },
  { key: "completedAt", label: "Interview Completed" },
  { key: "feedbackPublishedAt", label: "Feedback Published" },
];

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function MockInterviewTimelineView({
  timeline,
  variant = "light",
}: {
  timeline: MockInterviewTimeline;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";

  return (
    <ol className="space-y-0">
      {STEPS.map((step, index) => {
        const done = !!timeline[step.key];
        const dateLabel = formatDate(timeline[step.key]);
        const isLast = index === STEPS.length - 1;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.06 }}
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border",
                  done
                    ? isDark
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : isDark
                      ? "bg-white/5 border-white/10 text-white/30"
                      : "bg-slate-50 border-slate-200 text-slate-300",
                )}
              >
                {done ? <CheckCircle2 size={14} /> : <Circle size={12} />}
              </motion.div>
              {!isLast && (
                <div
                  className={cn(
                    "w-px flex-1 min-h-[20px] my-1",
                    done
                      ? isDark
                        ? "bg-emerald-500/30"
                        : "bg-emerald-200"
                      : isDark
                        ? "bg-white/8"
                        : "bg-slate-200",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-5", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  done
                    ? isDark
                      ? "text-white/90"
                      : "text-slate-800"
                    : isDark
                      ? "text-white/35"
                      : "text-slate-400",
                )}
              >
                {step.label}
              </p>
              {dateLabel && (
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    isDark ? "text-white/40" : "text-slate-500",
                  )}
                >
                  {dateLabel}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function MockInterviewStatusBadge({
  status,
  variant = "light",
}: {
  status: string;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  const config: Record<string, { label: string; light: string; dark: string }> =
    {
      REQUESTED: {
        label: "Requested",
        light: "bg-amber-50 text-amber-700 border-amber-200",
        dark: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      },
      SCHEDULED: {
        label: "Scheduled",
        light: "bg-blue-50 text-blue-700 border-blue-200",
        dark: "bg-blue-500/10 text-blue-400 border-blue-500/25",
      },
      COMPLETED: {
        label: "Completed",
        light: "bg-violet-50 text-violet-700 border-violet-200",
        dark: "bg-violet-500/10 text-violet-400 border-violet-500/25",
      },
      FEEDBACK_PUBLISHED: {
        label: "Feedback Published",
        light: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dark: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      },
      CANCELLED: {
        label: "Cancelled",
        light: "bg-slate-50 text-slate-500 border-slate-200",
        dark: "bg-white/6 text-white/40 border-white/10",
      },
    };

  const item = config[status] ?? config.REQUESTED;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide",
        isDark ? item.dark : item.light,
      )}
    >
      <Mic size={10} />
      {item.label}
    </span>
  );
}

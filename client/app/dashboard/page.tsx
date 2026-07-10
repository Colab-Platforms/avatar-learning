"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  GraduationCap,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useAppSelector } from "@/store/hooks";

const PILLARS = [
  { key: "counselling", label: "Counselling" },
  { key: "assessment", label: "Assessment" },
  { key: "learning", label: "Learning" },
  { key: "internship", label: "Internship" },
  { key: "placement", label: "Placement" },
] as const;

// Static for now — only the Learning pillar has real tracking wired up.
const CURRENT_PILLAR_INDEX = 2;

export default function DashboardOverviewPage() {
  const { user } = useAppSelector((s) => s.auth);
  const { data, isLoading } = useD2HStatus();

  const firstName = user?.firstName || "there";
  const overallProgress = data?.courses.length
    ? Math.round(
        data.courses.reduce((sum, c) => sum + c.progress, 0) /
          data.courses.length,
      )
    : 0;

  return (
    <div className="p-8 max-w-5xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">
          Good to see you, <span className="text-blue-600">{firstName}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          You're making great progress. Keep going!
        </p>
      </div>

      {/* 5-Pillar Journey Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-800 mb-6">
          5-Pillar Journey Progress
        </p>
        <div className="flex items-center">
          {PILLARS.map((pillar, idx) => {
            const done = idx < CURRENT_PILLAR_INDEX;
            const current = idx === CURRENT_PILLAR_INDEX;
            return (
              <div key={pillar.key} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                      done
                        ? "bg-blue-600 border-blue-600 text-white"
                        : current
                          ? "border-blue-600 text-blue-600"
                          : "border-slate-200 text-slate-300"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${current ? "text-blue-600" : "text-slate-400"}`}
                  >
                    {pillar.label}
                  </span>
                </div>
                {idx < PILLARS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 mb-5 ${done ? "bg-blue-600" : "bg-slate-150"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Pillar: Learning */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-blue-600" />
            <p className="text-sm font-semibold text-slate-800">
              Current Pillar: AI Learning
            </p>
          </div>
          <Link
            href="/dashboard/learning"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View courses <ArrowRight size={12} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : !data || data.courses.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Your courses will appear here once your Direct2Hire enrollment is
            confirmed.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600 shrink-0">
                {overallProgress}%
              </span>
            </div>
            {data.courses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-slate-150 px-4 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.isCompleted ? (
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Circle size={14} className="text-slate-300 shrink-0" />
                  )}
                  <span className="text-sm text-slate-700 truncate">
                    {c.title}
                  </span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {c.progress}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

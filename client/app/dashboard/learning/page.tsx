"use client";

import Link from "next/link";
import { GraduationCap, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";

export default function AILearningPage() {
  const { data, isLoading, isError } = useD2HStatus();

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <GraduationCap size={20} className="text-blue-600" />
          AI Learning
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your Direct2Hire course track — watch sessions in order to unlock the
          next one.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-red-500">
          Failed to load your learning status.
        </p>
      ) : data.courses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <GraduationCap size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.courses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                {course.isCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                ) : (
                  <GraduationCap size={14} className="text-blue-600" />
                )}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {course.isCompleted ? "Completed" : "In progress"}
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-800 mb-1">
                {course.title}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {course.totalLessons} session
                {course.totalLessons !== 1 ? "s" : ""}
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 shrink-0">
                  {course.progress}%
                </span>
              </div>

              {course.enrolled ? (
                <Link
                  href={`/courses/${course.id}/learn`}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold
                             bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {course.progress > 0 ? "Continue learning" : "Start learning"}
                  <ArrowRight size={12} />
                </Link>
              ) : (
                <p className="mt-auto text-xs text-slate-400 text-center py-2">
                  Unlocks once your Direct2Hire enrollment is confirmed.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

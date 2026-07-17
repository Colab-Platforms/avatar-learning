"use client";

import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Video,
  Clock3,
  Award,
  PlayCircle,
  Lock,
  Lightbulb,
  Sparkles,
  Compass,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useLearnCourse } from "@/hooks/queries/useLearnCourse";
import type { DBLesson } from "@/lib/coursesApi";

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return hours % 1 === 0 ? `${hours}` : hours.toFixed(1);
}

function lessonStatus(lesson: DBLesson): "completed" | "in-progress" | "locked" {
  if (lesson.isLocked) return "locked";
  const total = lesson.topics.length;
  const done = lesson.topics.filter((t) => t.isCompleted).length;
  if (total > 0 && done === total) return "completed";
  return "in-progress";
}

function lessonDuration(lesson: DBLesson) {
  const total = lesson.topics.reduce((sum, t) => sum + (t.duration ?? 0), 0);
  if (!total) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

const TIPS = [
  {
    icon: Sparkles,
    color: "text-amber-500 bg-amber-50",
    text: "Complete Session 3 this weekend",
  },
  {
    icon: Lightbulb,
    color: "text-emerald-500 bg-emerald-50",
    text: "Practice what you learn in your daily work",
  },
  {
    icon: Compass,
    color: "text-blue-500 bg-blue-50",
    text: "Book a counselling session for guidance on next steps",
  },
];

export default function AILearningPage() {
  const { user } = useAppSelector((s) => s.auth);
  const { data: status, isLoading: statusLoading, isError: statusError } =
    useD2HStatus();

  const activeCourseSummary =
    status?.courses.find((c) => c.enrolled && !c.isCompleted) ??
    status?.courses.find((c) => c.enrolled) ??
    status?.courses[0];

  const { data: course, isLoading: courseLoading } = useLearnCourse(
    activeCourseSummary?.id ?? "",
  );

  const firstName = user?.firstName || "there";

  const overallProgress = status?.courses.length
    ? Math.round(
        status.courses.reduce((sum, c) => sum + c.progress, 0) /
          status.courses.length,
      )
    : 0;

  const isLoading = statusLoading || (!!activeCourseSummary && courseLoading);

  const lessons = [...(course?.lessons ?? [])].sort(
    (a, b) => a.weekNumber - b.weekNumber,
  );
  const totalSessions = lessons.length;
  const completedSessions = lessons.filter(
    (l) => lessonStatus(l) === "completed",
  ).length;
  const progressPct = course?.enrollment.progress ?? 0;

  const totalMinutes = lessons.reduce(
    (sum, l) => sum + l.topics.reduce((s, t) => s + (t.duration ?? 0), 0),
    0,
  );
  const completedMinutes = lessons.reduce(
    (sum, l) =>
      sum +
      l.topics.reduce(
        (s, t) => s + (t.isCompleted ? (t.duration ?? 0) : 0),
        0,
      ),
    0,
  );

  return (
    <div className="p-8 w-full max-w-350">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          {activeCourseSummary && (
            <span className="inline-block mb-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase tracking-wide">
              Direct2Hire Programme
            </span>
          )}
          <h1 className="text-xl font-bold text-slate-800">
            Welcome back, {firstName}!
          </h1>
          {activeCourseSummary && (
            <p className="text-sm text-slate-500 mt-1">
              You&apos;re currently enrolled in the{" "}
              <span className="text-blue-600 font-medium">
                {activeCourseSummary.title}
              </span>{" "}
              course.
            </p>
          )}
        </div>
        {status && status.courses.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">Overall Programme Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {overallProgress}%
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : statusError || !status ? (
        <p className="text-sm text-red-500">
          Failed to load your learning status.
        </p>
      ) : !activeCourseSummary || !course ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <GraduationCap size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No courses available yet.</p>
        </div>
      ) : (
        <>
          {/* Continue Learning */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Continue Learning
            </h2>
            <Link
              href={`/courses/${course.id}/learn`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Go to course <ArrowRight size={12} />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <div className="flex gap-5">
              <div className="hidden sm:block w-40 h-28 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {course.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`inline-block mb-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                    course.enrollment.isCompleted
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {course.enrollment.isCompleted ? "Completed" : "In Progress"}
                </span>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500 mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Video size={13} className="text-slate-400" />
                    {totalSessions} Session{totalSessions !== 1 ? "s" : ""}
                  </span>
                  {totalMinutes > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={13} className="text-slate-400" />
                      Approx {formatHours(totalMinutes)} hours
                    </span>
                  )}
                  {course.certificate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Award size={13} className="text-slate-400" />
                      Certificate included
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    {completedSessions} of {totalSessions} sessions completed (
                    {progressPct}%)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle size={13} />
                    {progressPct > 0 ? "Continue Learning" : "Start Learning"}
                  </Link>
                  {course.enrollment.isCompleted && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      View Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Sessions Completed
                </p>
                <Video size={14} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {completedSessions}
                <span className="text-sm font-medium text-slate-400">
                  {" "}
                  / {totalSessions}
                </span>
              </p>
              {totalSessions - completedSessions > 0 && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Next session unlocks this weekend
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Time Invested
                </p>
                <Clock3 size={14} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {formatHours(completedMinutes)}
                <span className="text-sm font-medium text-slate-400">hrs</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Out of ~{formatHours(totalMinutes)} hours total
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Course Completion
                </p>
                <CheckCircle2 size={14} className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {progressPct}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {progressPct >= 100
                  ? "Completed"
                  : `On track · ${totalSessions - completedSessions} session${
                      totalSessions - completedSessions !== 1 ? "s" : ""
                    } remaining`}
              </p>
            </div>
          </div>

          {/* Modules */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Modules in this course
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalSessions} session{totalSessions !== 1 ? "s" : ""} · Unlock
                2 every weekend
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {lessons.map((lesson) => {
                const status = lessonStatus(lesson);
                const duration = lessonDuration(lesson);
                return (
                  <div
                    key={lesson.id}
                    className={`rounded-xl border p-3.5 ${
                      status === "in-progress"
                        ? "border-blue-300 ring-1 ring-blue-100"
                        : "border-slate-150"
                    } ${status === "locked" ? "bg-slate-50" : "bg-white"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide ${
                          status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : status === "in-progress"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 size={9} />
                        ) : status === "in-progress" ? (
                          <PlayCircle size={9} />
                        ) : (
                          <Lock size={9} />
                        )}
                        {status === "completed"
                          ? "Completed"
                          : status === "in-progress"
                            ? "Now Playing"
                            : "Locked"}
                      </span>
                    </div>
                    <p
                      className={`text-xs font-medium leading-snug mb-1 ${
                        status === "locked" ? "text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {lesson.weekNumber}. {lesson.title}
                    </p>
                    {duration && (
                      <p className="text-[10px] text-slate-400">{duration}</p>
                    )}
                    {status === "locked" && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Unlocks next weekend
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Learning tips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              Learning Tips for This Week
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {TIPS.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tip.color}`}
                  >
                    <tip.icon size={15} />
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tip.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Loader2,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useLearnCourse } from "@/hooks/queries/useLearnCourse";
import { basicCourseRoutes, dashboardRoutes } from "@/lib/dashboardRoutes";
import { useEnrollmentTier } from "@/hooks/queries/useMyEnrollments";
import { hasD2H } from "@/lib/courseTier";

export function BasicOverview({ courseId }: { courseId: string }) {
  const { user } = useAppSelector((s) => s.auth);
  const ownsD2H = hasD2H(useEnrollmentTier(courseId));
  const { data: course, isLoading } = useLearnCourse(courseId, {
    track: "BASIC",
  });
  const routes = basicCourseRoutes(courseId);

  if (isLoading || !course) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const firstName = user?.firstName || "there";
  const progressPct = course.enrollment.progress ?? 0;
  const isCompleted = course.enrollment.isCompleted;
  const totalSessions = course.lessons.length;
  const completedSessions = course.lessons.filter((l) => {
    const total = l.topics.length;
    if (total === 0) return false;
    return l.topics.filter((t) => t.isCompleted).length === total;
  }).length;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6 text-slate-800">
      <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-6 sm:p-8 text-white shadow-xl">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-200 backdrop-blur-xs">
          Basic Course
        </span>
        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome back, <span className="text-slate-300">{firstName}</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-xl">
          {isCompleted
            ? `You've completed ${course.title}. Grab your certificate below.`
            : `Keep going with ${course.title}. You're ${progressPct}% through the course.`}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={routes.learn}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
          >
            <PlayCircle size={16} />
            {progressPct > 0 ? "Continue Learning" : "Start Learning"}
            <ArrowRight size={14} />
          </Link>
          {isCompleted && (
            <Link
              href={routes.certificate}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98]"
            >
              <Award size={16} /> View Certificate
            </Link>
          )}
        </div>
      </div>

      {/* This is where a Basic buyer lands, so it is the main upgrade surface —
          but not for someone already holding both plans. */}
      {!ownsD2H && (
        <Link
          href={`/courses/${courseId}/enroll?plan=d2h`}
          className="group flex flex-col gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-6 transition hover:border-brand-300 hover:bg-brand-100/60 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            {/* <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <Sparkles size={18} />
          </div> */}
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Upgrade to Career+
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                A separate 5-step track with mentors, live projects, internship
                tasks and placement support. You keep everything in your
                Practitioner course.
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white transition group-hover:bg-brand-600 sm:self-auto">
            See the programme <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {ownsD2H && (
        <Link
          href={dashboardRoutes(courseId).root}
          className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
            {/* <Sparkles size={16} className="text-emerald-600" /> */}
            Switch to your Direct2Hire track
          </span>
          <ArrowRight size={16} className="text-slate-400" />
        </Link>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href={routes.learn}
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <ArrowRight
              size={16}
              className="text-slate-300 group-hover:text-blue-500 transition-colors"
            />
          </div>
          <h2 className="mt-4 text-sm font-bold text-slate-900">Learning</h2>
          <p className="mt-1 text-xs text-slate-500">
            {completedSessions} of {totalSessions} session
            {totalSessions === 1 ? "" : "s"} completed
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
        </Link>

        <Link
          href={routes.certificate}
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-emerald-300 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCompleted
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <Award size={18} />
            </div>
            <ArrowRight
              size={16}
              className="text-slate-300 group-hover:text-emerald-500 transition-colors"
            />
          </div>
          <h2 className="mt-4 text-sm font-bold text-slate-900">
            Certification
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isCompleted
              ? "Your certificate is ready to download."
              : "Complete every session to unlock your certificate."}
          </p>
        </Link>
      </div>
    </div>
  );
}

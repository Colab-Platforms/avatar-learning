"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Loader2,
  Sparkles,
} from "lucide-react";
import { fetchMyEnrollments, type MyEnrollment } from "@/lib/coursesApi";
import { dashboardRoutes } from "@/lib/dashboardRoutes";

/**
 * My Courses — the landing page for a signed-in student.
 *
 * Direct2Hire used to be a single journey per user, so /dashboard could show it
 * directly. Now that both plans are bought per course, a student can hold
 * several at once, and this grid is where they pick which one to open.
 */
export default function MyCoursesPage() {
  const {
    data: enrollments,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: fetchMyEnrollments,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/8 px-5 py-4 text-sm text-red-400">
        Failed to load your courses. Please refresh and try again.
      </div>
    );
  }

  const courses = enrollments ?? [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-text">My Courses</h1>
        <p className="mt-1 text-sm text-text-muted">
          {courses.length === 0
            ? "You haven't enrolled in any courses yet."
            : `${courses.length} ${courses.length === 1 ? "course" : "courses"} in progress.`}
        </p>
      </header>

      {courses.length === 0 ? <EmptyState /> : <CourseGrid courses={courses} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-surface-alt px-6 py-16 text-center">
      <BookOpen className="mx-auto mb-4 h-10 w-10 text-text-subtle" />
      <p className="text-sm text-text-muted">
        Browse the catalogue to enrol in your first course.
      </p>
      <Link
        href="/courses"
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Browse courses <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function CourseGrid({ courses }: { courses: MyEnrollment[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {courses.map((enrollment) => (
        <CourseCard key={enrollment.id} enrollment={enrollment} />
      ))}
    </div>
  );
}

function CourseCard({ enrollment }: { enrollment: MyEnrollment }) {
  const { course, tier, progress, isCompleted } = enrollment;
  const isBasic = tier === "BASIC";

  // Basic has no 5-step journey — just videos, a final assessment and a
  // certificate — so it goes straight to the content rather than through a
  // dashboard that would show almost nothing.
  const href = isBasic
    ? `/courses/${course.slug}/learn`
    : dashboardRoutes(course.id).root;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-brand-400/50"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-surface-alt">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <GraduationCap className="h-8 w-8 text-text-subtle" />
          </div>
        )}

        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${
            isBasic
              ? "bg-slate-900/70 text-slate-100"
              : "bg-brand-500/90 text-white"
          }`}
        >
          {isBasic ? (
            "Basic"
          ) : (
            <>
              <Sparkles className="h-3 w-3" /> Direct2Hire
            </>
          )}
        </span>

        {isCompleted && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            <BadgeCheck className="h-3 w-3" /> Completed
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] uppercase tracking-wide text-text-subtle">
          {course.category?.name}
        </p>
        <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-text">
          {course.title}
        </h2>

        <div className="mt-auto pt-5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-text-muted">
            <span>{progress}% complete</span>
            <span className="inline-flex items-center gap-1 font-medium text-brand-500 opacity-0 transition-opacity group-hover:opacity-100">
              {isBasic ? "Continue" : "Open dashboard"}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
            <div
              className={`h-full rounded-full transition-all ${
                isCompleted ? "bg-emerald-500" : "bg-brand-500"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

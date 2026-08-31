"use client";

import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { RootState } from "@/store";
import type { MyEnrollment } from "@/lib/coursesApi";
import { dashboardRoutes } from "@/lib/dashboardRoutes";
import { useMyEnrollments } from "@/hooks/queries/useMyEnrollments";

const SPRING = [0.16, 1, 0.3, 1] as const;

const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: SPRING } },
};

export default function MyCoursesPage() {
  const { data: enrollments, isLoading, isError } = useMyEnrollments();
  const firstName = useSelector((state: RootState) => state.auth.user?.firstName ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 lg:p-12">
        <p className="text-sm text-red-400">Failed to load your courses. Please refresh.</p>
      </div>
    );
  }

  const courses = enrollments ?? [];

  return (
    <div className="min-h-full bg-slate-50">
      <div className="px-6 py-10 lg:px-12">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: SPRING }}
          className="mb-8"
        >
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
            {firstName ? `${firstName}'s Courses` : "My Courses"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {courses.length === 0
              ? "No courses enrolled yet."
              : `${courses.length} ${courses.length === 1 ? "course" : "courses"} enrolled`}
          </p>
        </motion.div>

        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            variants={grid}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {courses.map((e) => (
              <CourseCard key={e.id} enrollment={e} />
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <BookOpen className="h-6 w-6 text-slate-400" />
      </div>
      <h2 className="text-base font-semibold text-slate-700">No courses yet</h2>
      <p className="mt-1.5 max-w-xs text-sm text-slate-400">
        Browse the catalogue to enroll in your first course.
      </p>
      <Link
        href="/courses"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Browse courses
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  );
}

function CourseCard({ enrollment }: { enrollment: MyEnrollment }) {
  const { course, tier, progress, isCompleted } = enrollment;
  const isD2H = tier === "D2H" || tier === "BOTH";
  const href = dashboardRoutes(course.slug).root;
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <motion.div variants={card}>
      <Link
        href={href}
        className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <GraduationCap className="h-8 w-8 text-slate-300" />
            </div>
          )}

          {/* Tier pill */}
          <span
            className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
              isD2H
                ? "bg-emerald-500 text-white"
                : "bg-black/50 text-white backdrop-blur-sm"
            }`}
          >
            {isD2H ? (
              <><Sparkles className="h-2.5 w-2.5" /> Direct2Hire</>
            ) : (
              "Basic"
            )}
          </span>

          {/* Completed pill */}
          {isCompleted && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              <BadgeCheck className="h-2.5 w-2.5" /> Done
            </span>
          )}

          {/* Progress strip — YouTube/Netflix style at bottom of thumbnail */}
          {pct > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/15">
              <div
                className={`h-full ${isCompleted || isD2H ? "bg-emerald-400" : "bg-blue-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          {course.category?.name && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {course.category.name}
            </p>
          )}

          <h2 className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-snug text-slate-800">
            {course.title}
          </h2>

          <div className="mt-auto flex items-center justify-between pt-4">
            <span className="text-xs text-slate-400">
              {isCompleted
                ? "Completed"
                : pct === 0
                  ? "Not started"
                  : `${pct}% complete`}
            </span>
            <span
              className={`flex items-center gap-0.5 text-xs font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${
                isD2H ? "text-emerald-600" : "text-blue-600"
              }`}
            >
              {isCompleted ? "Review" : pct === 0 ? "Start" : "Continue"}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

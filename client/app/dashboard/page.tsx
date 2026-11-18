"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  FileText,
  Flame,
  Globe2,
  GraduationCap,
  Loader2,
  Megaphone,
  Search,
  Trophy,
} from "lucide-react";
import type { RootState } from "@/store";
import type { MyEnrollment } from "@/lib/coursesApi";
import { basicCourseRoutes, dashboardRoutes } from "@/lib/dashboardRoutes";
import { useMyEnrollments } from "@/hooks/queries/useMyEnrollments";
import { hasD2H } from "@/lib/courseTier";

const SPRING = [0.16, 1, 0.3, 1] as const;

// Pastel background palette for placeholder illustration headers matching reference design
const HEADER_THEMES = [
  {
    bg: "bg-purple-100/70",
    iconBg: "bg-purple-200/80 text-purple-700",
    border: "border-purple-200/50",
    accent: "text-purple-600",
    bar: "bg-purple-600",
    icon: FileText,
  },
  {
    bg: "bg-amber-100/70",
    iconBg: "bg-amber-200/80 text-amber-700",
    border: "border-amber-200/50",
    accent: "text-amber-600",
    bar: "bg-amber-600",
    icon: Globe2,
  },
  {
    bg: "bg-rose-100/70",
    iconBg: "bg-rose-200/80 text-rose-700",
    border: "border-rose-200/50",
    accent: "text-rose-600",
    bar: "bg-rose-600",
    icon: Megaphone,
  },
  {
    bg: "bg-blue-100/70",
    iconBg: "bg-blue-200/80 text-blue-700",
    border: "border-blue-200/50",
    accent: "text-blue-600",
    bar: "bg-blue-600",
    icon: Compass,
  },
  {
    bg: "bg-emerald-100/70",
    iconBg: "bg-emerald-200/80 text-emerald-700",
    border: "border-emerald-200/50",
    accent: "text-emerald-600",
    bar: "bg-emerald-600",
    icon: Trophy,
  },
  {
    bg: "bg-indigo-100/70",
    iconBg: "bg-indigo-200/80 text-indigo-700",
    border: "border-indigo-200/50",
    accent: "text-indigo-600",
    icon: GraduationCap,
    bar: "bg-indigo-600",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: SPRING },
  },
};

export default function MyCoursesPage() {
  const { data: enrollments, isLoading, isError } = useMyEnrollments();
  const firstName = useSelector(
    (state: RootState) => state.auth.user?.firstName ?? "",
  );

  const [activeFilter, setActiveFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const courses = useMemo(() => enrollments ?? [], [enrollments]);

  // Compute stats
  const completedCount = useMemo(
    () => courses.filter((c) => c.isCompleted || c.progress >= 100).length,
    [courses],
  );
  const inProgressCount = courses.length - completedCount;

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((e) => {
      const matchesSearch =
        e.course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.course.category?.name &&
          e.course.category.name.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === "COMPLETED") {
        return e.isCompleted || e.progress >= 100;
      }
      if (activeFilter === "IN_PROGRESS") {
        return !e.isCompleted && e.progress < 100;
      }
      return true;
    });
  }, [courses, searchQuery, activeFilter]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-500">Loading your courses...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 lg:p-12">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
          <p className="text-sm font-medium text-red-600">
            Failed to load your courses. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50/60 pb-16 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {firstName ? `${firstName}'s Courses` : "My Courses"}
                </h1>
                {courses.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                    {courses.length} {courses.length === 1 ? "Course" : "Courses"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Continue learning where you left off and track your progress.
              </p>
            </div>

            {/* Quick Stats Pill */}
            {courses.length > 0 && (
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 border border-slate-200/80 shadow-xs text-xs font-medium text-slate-600">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <span>{inProgressCount} in progress</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2 border border-slate-200/80 shadow-xs text-xs font-medium text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{completedCount} completed</span>
                </div>
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          {courses.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/60 pt-5">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-2xl max-w-fit">
                <button
                  type="button"
                  onClick={() => setActiveFilter("ALL")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({courses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("IN_PROGRESS")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "IN_PROGRESS"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  In Progress ({inProgressCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("COMPLETED")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    activeFilter === "COMPLETED"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Completed ({completedCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search my courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-1.5 pl-9 pr-3.5 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {courses.length === 0 ? (
          <EmptyState />
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No courses found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query or filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("ALL");
              }}
              className="mt-4 text-xs font-semibold text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredCourses.map((enrollment, index) => (
              <CourseCard
                key={enrollment.id}
                enrollment={enrollment}
                themeIndex={index % HEADER_THEMES.length}
              />
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
        <BookOpen className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">No enrolled courses yet</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        Explore our curated curriculum and begin your journey towards mastering industry-standard skills.
      </p>
      <Link
        href="/courses"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs shadow-blue-500/20 transition-all hover:bg-blue-700 hover:shadow-md"
      >
        Explore Courses
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

function CourseCard({
  enrollment,
  themeIndex,
}: {
  enrollment: MyEnrollment;
  themeIndex: number;
}) {
  const { course, tier, progress, isCompleted } = enrollment;
  const isD2H = hasD2H(tier);
  const ownsBoth = tier === "BOTH";
  const theme = HEADER_THEMES[themeIndex] || HEADER_THEMES[0];
  const IconComponent = theme.icon;

  const href = isD2H
    ? dashboardRoutes(course.slug).root
    : basicCourseRoutes(course.slug).root;

  const pct = Math.min(100, Math.max(0, Math.round(progress)));
  const totalLessons = course._count?.lessons || 0;
  const lessonsLeft = totalLessons > 0 ? Math.max(0, Math.round(totalLessons * (1 - pct / 100))) : null;

  // Render for dual enrollment (owns both Basic + Direct2Hire)
  if (ownsBoth) {
    return (
      <motion.div
        variants={cardVariants}
        className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]"
      >
        {/* Visual Header / Illustration matching reference design */}
        <div
          className={`relative aspect-[16/10] w-full overflow-hidden ${
            course.thumbnail ? "bg-slate-100" : theme.bg
          } flex items-center justify-center`}
        >
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${theme.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}
              >
                <IconComponent className="h-10 w-10" />
              </div>
            </div>
          )}

          {/* Top Badge without unnecessary icon - just clean content */}
          <div className="absolute left-3.5 top-3.5 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-900/85 px-3 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-md shadow-xs">
              Basic + Direct2Hire
            </span>
          </div>

          {isCompleted && (
            <div className="absolute right-3.5 top-3.5">
              <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
                Completed
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* Category / Subtitle */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400 uppercase tracking-wider text-[11px]">
              {course.category?.name || "Professional Track"}
            </span>
            {course.level && (
              <span className="text-slate-400 capitalize text-[11px]">
                {course.level.toLowerCase()}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="mt-2 line-clamp-2 text-base font-bold text-slate-800 leading-snug tracking-tight group-hover:text-blue-600 transition-colors">
            {course.title}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Select a track below to continue:
          </p>

          {/* Vertically stacked buttons: One transparent with hover effect, one blue like course detail page Enroll Now */}
          <div className="mt-5 flex flex-col gap-2.5 pt-2 border-t border-slate-100">
            {/* Transparent Button with hover effect */}
            <TrackButton
              href={basicCourseRoutes(course.slug).root}
              label="Basic Track"
              variant="transparent"
            />

            {/* Blue Button matching course detail page Enroll Now button */}
            <TrackButton
              href={dashboardRoutes(course.slug).root}
              label="Direct2Hire Track"
              variant="blue"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Single plan enrollment (Basic OR Direct2Hire)
  return (
    <motion.div
      variants={cardVariants}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)]"
    >
      <Link href={href} className="flex flex-1 flex-col">
        {/* Visual Header / Illustration matching reference design */}
        <div
          className={`relative aspect-[16/10] w-full overflow-hidden ${
            course.thumbnail ? "bg-slate-100" : theme.bg
          } flex items-center justify-center`}
        >
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${theme.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}
              >
                <IconComponent className="h-10 w-10" />
              </div>
            </div>
          )}

          {/* Top Badge without unnecessary icon - just clean text content */}
          <div className="absolute left-3.5 top-3.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide shadow-xs ${
                isD2H
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900/85 text-white backdrop-blur-md"
              }`}
            >
              {isD2H ? "Direct2Hire" : "Basic Track"}
            </span>
          </div>

          {isCompleted && (
            <div className="absolute right-3.5 top-3.5">
              <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs">
                Completed
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {/* Category / Subtitle */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400 uppercase tracking-wider text-[11px]">
              {course.category?.name || "Course"}
            </span>
            {course.level && (
              <span className="text-slate-400 capitalize text-[11px]">
                {course.level.toLowerCase()}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="mt-2 line-clamp-2 text-base font-bold text-slate-800 leading-snug tracking-tight group-hover:text-blue-600 transition-colors">
            {course.title}
          </h2>

          {/* Progress Bar Section (Reference Design) */}
          <div className="mt-auto pt-6">
            {/* Progress Bar Track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isCompleted ? "bg-emerald-500" : isD2H ? "bg-emerald-500" : "bg-blue-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Progress Info Row */}
            <div className="mt-2.5 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>
                {isCompleted
                  ? "Completed"
                  : lessonsLeft !== null && lessonsLeft > 0
                    ? `Lessons left: ${lessonsLeft}`
                    : pct === 0
                      ? "Not started"
                      : "In progress"}
              </span>
              <span className="font-semibold text-slate-700">
                Completed: {pct}%
              </span>
            </div>

            {/* Action CTA Button */}
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-blue-700 active:scale-[0.99]">
              {pct === 0 ? "Start Learning" : isCompleted ? "Review Course" : "Continue Learning"}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** Track button for dual enrollment - simple clean buttons */
function TrackButton({
  href,
  label,
  variant,
}: {
  href: string;
  label: string;
  variant: "transparent" | "blue";
}) {
  if (variant === "transparent") {
    return (
      <Link
        href={href}
        className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-transparent px-4 py-2.5 text-xs font-semibold text-slate-800 transition-all duration-200 hover:border-slate-300 hover:bg-slate-100/80 active:scale-[0.99]"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-blue-700 active:scale-[0.99]"
    >
      {label}
    </Link>
  );
}

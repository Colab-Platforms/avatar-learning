"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  Clock,
  ArrowRight,
  Layers,
  ChevronDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { type DBCourse, type PaginatedResponse } from "@/lib/coursesApi";
import { useCourses } from "@/hooks/queries/useCourses";

/* ─────────────────────────── types / constants ─────────────────────────── */

type Level = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type SortBy = "NEWEST" | "TITLE_ASC";

const LEVELS: { value: Level; label: string }[] = [
  { value: "ALL", label: "All Levels" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "NEWEST", label: "Newest First" },
  { value: "TITLE_ASC", label: "Title: A → Z" },
];

// same level wording as the landing / Direct2Hire course cards
const LEVEL_BADGES: Record<string, string> = {
  BEGINNER: "LEARNER",
  INTERMEDIATE: "PROFESSIONAL",
  ADVANCED: "CAREER +",
};

/* ─────────────────────────── skeleton card ─────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden animate-pulse p-5 sm:p-6 space-y-4 h-full flex flex-col">
      <div className="aspect-[1.8/1] w-full bg-slate-100 rounded-2xl" />
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-md bg-slate-100" />
          <div className="h-5 w-3/4 rounded bg-slate-100" />
        </div>
        <div className="flex gap-2 pt-4">
          <div className="h-6 w-16 rounded-full bg-slate-100" />
          <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── course card ───────────────────────────────── */

function CourseCard({ course }: { course: DBCourse }) {
  const isComingSoon = course.isComingSoon;
  const levelLabel = LEVEL_BADGES[course.level] ?? course.level;
  const coverImage =
    course.heroImage || course.bannerImage || course.thumbnail || "";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative flex flex-col rounded-3xl border border-slate-200/80 bg-white
                 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1.5
                 transition-all duration-300 h-full cursor-pointer"
    >
      {/* ── Thumbnail ── */}
      <div className="relative h-[220px] w-full overflow-hidden bg-slate-50 shrink-0">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            quality={95}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <BookOpen className="h-10 w-10 text-slate-300" />
          </div>
        )}

        {/* Watermark (top left) */}
        <div className="absolute top-0 left-4 bg-white px-2.5 py-4 rounded-b-xl shadow-xs flex items-center justify-center z-10">
          <div className="relative h-8 w-8">
            <Image
              src="/favicon.png"
              alt="Avatar Logo"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
        </div>

        {/* Coming soon badge (top right) */}
        {isComingSoon && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className="inline-flex items-center rounded-full border border-amber-200
                         bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px]
                         font-bold tracking-wider text-amber-700 shadow-xs"
            >
              COMING SOON
            </span>
          </div>
        )}

        {/* Level badge (bottom right) */}
        <div className="absolute bottom-3 right-3 bg-[#1d4ed8] text-white text-[10px] font-bold tracking-wider px-3.5 py-1.5 rounded-full shadow-xs uppercase z-10">
          {levelLabel}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Branding */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative h-4.5 w-4.5">
            <Image
              src="/favicon.png"
              alt=""
              fill
              sizes="20px"
              className="object-contain"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold tracking-wide">
            Avatar Learning
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        {/* Pills row */}
        <div className="flex flex-wrap items-center gap-2 mb-4 mt-auto">
          {course.totalWeeks > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-100">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {course.totalWeeks} {course.totalWeeks === 1 ? "week" : "weeks"}
            </span>
          )}
          {course._count.lessons > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-100">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              {course._count.lessons}{" "}
              {course._count.lessons === 1 ? "lesson" : "lessons"}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-100 my-1" />

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
            <span>{course.rating ? course.rating.toFixed(1) : "4.8"}</span>
            <span className="text-slate-400 font-medium text-xs ml-1">
              ({course.reviews || "840 Reviews"})
            </span>
          </div>
          <span
            className="flex items-center gap-0.5 text-[12px] font-semibold text-slate-400
                       group-hover:text-blue-600 transition-colors duration-250"
          >
            View Course
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-250" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────── filter pill ───────────────────────────────── */

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-[13px] font-semibold border transition-all duration-250 cursor-pointer",
        active
          ? "bg-blue-50 border-blue-200 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────── empty state ───────────────────────────────── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div
        className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-50
                      flex items-center justify-center mb-5"
      >
        <Search className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-[17px] font-semibold text-slate-800 mb-2">
        No courses found
      </h3>
      <p className="text-[14px] text-slate-500 max-w-xs mb-6">
        Try adjusting your search or filters to find what you're looking for.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50
                   px-5 py-2.5 text-[13px] text-slate-650 hover:text-slate-800 hover:border-slate-350
                   transition-all duration-250 cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5 text-slate-400" /> Reset filters
      </button>
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────────────── */

export default function CoursesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<Level>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("NEWEST");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch courses for current page using TanStack Query
  const { data, isLoading: loading, isError, error } = useCourses(currentPage);

  const courses = data?.data ?? [];
  const pagination = data
    ? {
        currentPage: data.currentPage,
        pageSize: data.pageSize,
        totalRecords: data.totalRecords,
        totalPages: data.totalPages,
        hasNextPage: data.hasNextPage,
        hasPreviousPage: data.hasPreviousPage,
      }
    : null;

  /* derived filtered + sorted list */
  const filtered = useMemo(() => {
    let list = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.name.toLowerCase().includes(q),
      );
    }

    if (level !== "ALL") {
      list = list.filter((c) => c.level === level);
    }

    if (sortBy === "TITLE_ASC")
      list.sort((a, b) => a.title.localeCompare(b.title));
    // NEWEST: server already orders by createdAt desc

    return list;
  }, [courses, search, level, sortBy]);

  const hasActiveFilters = level !== "ALL" || search.trim().length > 0;

  const resetFilters = () => {
    setSearch("");
    setLevel("ALL");
    setSortBy("NEWEST");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen overflow-x-hidden bg-white text-slate-800">
        {/* HERO SECTION - Light Brand Background */}
        <div className="relative pt-28 pb-8 bg-slate-50 border-b border-slate-100">
          <div className="relative container-x max-w-7xl">
            {/* ── PAGE HEADER ── */}
            <ScrollReveal animation="fade-up" duration={700}>
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg
                              bg-brand-50 border border-brand-200"
                >
                  <Layers className="h-4 w-4 text-brand-600" />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">
                  AI Learning Division
                </p>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-800 mb-4">
                Our Programs
              </h1>
              <p className="text-slate-500 text-[16px] leading-relaxed max-w-xl">
                Explore our comprehensive curriculum designed for the next era
                of technological mastery. Filter by level and duration to find
                your optimal path.
              </p>
            </ScrollReveal>
          </div>
        </div>

        {/* MAIN CONTENT SECTION - White Background */}
        <div className="relative container-x pt-6 pb-10 max-w-7xl">
          {/* ── SEARCH + FILTER BAR ── */}
          <ScrollReveal animation="fade-up" delay={100} duration={650}>
            <div className="flex flex-col gap-4">
              {/* top row: search + sort + filter toggle */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 py-3
                               text-[14px] text-slate-800 placeholder-slate-400
                               focus:outline-none focus:border-blue-500/40 focus:bg-white
                               focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center
                                 justify-center rounded-full text-slate-400 hover:text-slate-655
                                 transition-colors duration-150 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* sort dropdown */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-9 py-3
                               text-[13px] text-slate-650 focus:outline-none focus:border-blue-500/40
                               transition-all duration-200 cursor-pointer hover:border-slate-350 hover:bg-slate-100/50"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                                         h-4 w-4 text-slate-400"
                  />
                </div>

                {/* filter toggle (mobile) */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={cn(
                    "sm:hidden flex items-center justify-center gap-2 rounded-xl border px-4 py-3 cursor-pointer",
                    "text-[13px] font-semibold transition-all duration-250",
                    filtersOpen
                      ? "border-blue-500/40 bg-blue-50 text-blue-600"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>

              {/* filter pills row — always visible on desktop, toggleable on mobile */}
              <div
                className={cn(
                  "flex flex-wrap gap-2 sm:flex",
                  filtersOpen ? "flex" : "hidden sm:flex",
                )}
              >
                {/* LEVEL */}
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((l) => (
                    <FilterPill
                      key={l.value}
                      active={level === l.value}
                      onClick={() => setLevel(l.value)}
                    >
                      {l.label}
                    </FilterPill>
                  ))}
                </div>

                {/* reset */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5
                               text-[12px] text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50
                               transition-all duration-250 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3 text-slate-400" /> Reset
                  </button>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* results meta */}
          {!loading && !isError && (
            <div className="mt-6 mb-2 flex items-center justify-between">
              <p className="text-[13px] text-slate-450 font-medium">
                {filtered.length === 0
                  ? "No programs found"
                  : `Showing ${filtered.length} program${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          )}

          {/* ── ERROR STATE ── */}
          {isError && (
            <div className="mt-12 flex flex-col items-center text-center py-20">
              <div
                className="h-14 w-14 rounded-2xl border border-red-200 bg-red-50
                              flex items-center justify-center mb-4"
              >
                <X className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-700 mb-2">
                Something went wrong
              </h3>
              <p className="text-[13px] text-slate-500 mb-5">
                {error?.message ?? "Failed to load courses. Please try again."}
              </p>
              <button
                onClick={() => {
                  setCurrentPage(1);
                }}
                className="rounded-full border border-slate-200 px-5 py-2 text-[13px] text-slate-650 bg-slate-50
                           hover:text-slate-800 hover:border-slate-350 transition-all duration-250 cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {/* ── COURSE GRID ── */}
          {!isError && (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              ) : filtered.length === 0 ? (
                <EmptyState onReset={resetFilters} />
              ) : (
                filtered.map((course, i) => (
                  <ScrollReveal
                    key={course.id}
                    animation="fade-up"
                    delay={i * 60}
                    duration={650}
                  >
                    <CourseCard course={course} />
                  </ScrollReveal>
                ))
              )}
            </div>
          )}

          {/* ── PAGINATION ── */}
          {!isError && !loading && filtered.length > 0 && pagination && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPreviousPage}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                  pagination.hasPreviousPage
                    ? "border border-slate-200 text-slate-600 bg-slate-50 hover:border-blue-500/40 hover:text-blue-650 hover:bg-slate-100/50"
                    : "border border-slate-100 text-slate-300 cursor-not-allowed",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: pagination.totalPages },
                  (_, i) => i + 1,
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "h-9 w-9 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer",
                      currentPage === page
                        ? "bg-blue-600 text-white font-black shadow-sm"
                        : "border border-slate-200 text-slate-600 bg-slate-50 hover:border-blue-500/40 hover:text-blue-650 hover:bg-slate-100/50",
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer",
                  pagination.hasNextPage
                    ? "border border-slate-200 text-slate-600 bg-slate-50 hover:border-blue-500/40 hover:text-blue-650 hover:bg-slate-100/50"
                    : "border border-slate-100 text-slate-300 cursor-not-allowed",
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

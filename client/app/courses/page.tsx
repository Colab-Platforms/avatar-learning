"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, X, BookOpen, Clock,
  Users, ArrowRight, Layers, ChevronDown, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button, ScrollReveal } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { fetchPublishedCourses, type DBCourse } from "@/lib/coursesApi";
import { useAppSelector } from "@/store/hooks";

/* ─────────────────────────── types / constants ─────────────────────────── */

type Level = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type PriceFilter = "ALL" | "FREE" | "PAID";
type SortBy = "NEWEST" | "PRICE_ASC" | "PRICE_DESC";

const LEVELS: { value: Level; label: string }[] = [
  { value: "ALL",          label: "All Levels" },
  { value: "BEGINNER",     label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED",     label: "Advanced" },
];

const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "ALL",  label: "Any Price" },
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "NEWEST",     label: "Newest First" },
  { value: "PRICE_ASC",  label: "Price: Low → High" },
  { value: "PRICE_DESC", label: "Price: High → Low" },
];

const LEVEL_COLOR: Record<string, string> = {
  BEGINNER:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  INTERMEDIATE: "bg-amber-500/15  text-amber-400  border-amber-500/25",
  ADVANCED:     "bg-red-500/15    text-red-400    border-red-500/25",
};

/* ─────────────────────────── skeleton card ─────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800 overflow-hidden animate-pulse">
      <div className="aspect-video w-full bg-ink-700" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-20 rounded-full bg-white/8" />
        <div className="h-5 w-4/5 rounded-full bg-white/10" />
        <div className="h-4 w-full rounded-full bg-white/6" />
        <div className="h-4 w-2/3 rounded-full bg-white/6" />
        <div className="flex gap-2 mt-4">
          <div className="h-3 w-16 rounded-full bg-white/6" />
          <div className="h-3 w-16 rounded-full bg-white/6" />
        </div>
        <div className="h-8 rounded-xl bg-white/6 mt-4" />
      </div>
    </div>
  );
}

/* ─────────────────────────── course card ───────────────────────────────── */

function CourseCard({ course }: { course: DBCourse }) {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const isFree = course.price === 0;

  const handleEnroll = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) router.push("/login");
  };

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative flex flex-col rounded-2xl border border-white/6 bg-ink-800
                 overflow-hidden transition-all duration-350 hover:-translate-y-1.5
                 hover:border-brand-500/30 hover:shadow-[0_16px_48px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,200,255,0.08)]"
      style={{
        background: "linear-gradient(160deg, rgba(13,23,39,0.9) 0%, rgba(9,18,32,0.98) 100%)",
        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* top shimmer on hover */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/0
                      to-transparent group-hover:via-brand-500/50 transition-all duration-500 z-10" />

      {/* thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-ink-700 shrink-0">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(0,60,140,0.4) 0%, rgba(0,200,255,0.08) 100%)" }}>
            <BookOpen className="h-10 w-10 text-brand-500/25" />
          </div>
        )}
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent" />

        {/* price badge */}
        <div className="absolute top-3 right-3 z-10">
          {isFree ? (
            <span className="inline-flex items-center rounded-full border border-emerald-500/30
                             bg-ink-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px]
                             font-semibold text-emerald-400">
              FREE
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-white/15
                             bg-ink-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px]
                             font-semibold text-white">
              ₹{course.price.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* category pill */}
        {course.category && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center rounded-full border border-brand-500/20
                             bg-ink-900/80 backdrop-blur-sm px-2.5 py-1 text-[10px]
                             font-medium text-brand-300/80">
              {course.category.name}
            </span>
          </div>
        )}
      </div>

      {/* content */}
      <div className="flex flex-col flex-1 p-5">
        {/* level badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            LEVEL_COLOR[course.level] ?? "bg-white/8 text-white/50 border-white/10"
          )}>
            {course.level.charAt(0) + course.level.slice(1).toLowerCase()}
          </span>
        </div>

        {/* title */}
        <h3 className="text-[15px] font-semibold leading-snug text-white mb-2
                       group-hover:text-brand-300 transition-colors duration-300 line-clamp-2">
          {course.title}
        </h3>

        {/* description */}
        {course.description && (
          <p className="text-[13px] text-white/40 leading-relaxed line-clamp-2 mb-4">
            {course.description}
          </p>
        )}

        {/* meta row */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-white/35 mb-4">
          {course.totalWeeks > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-500/50" />
              {course.totalWeeks} {course.totalWeeks === 1 ? "week" : "weeks"}
            </span>
          )}
          {course._count.lessons > 0 && (
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-brand-500/50" />
              {course._count.lessons} {course._count.lessons === 1 ? "lesson" : "lessons"}
            </span>
          )}
          {course._count.enrollments > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-brand-500/50" />
              {course._count.enrollments.toLocaleString("en-IN")} enrolled
            </span>
          )}
        </div>

        {/* divider */}
        <div className="h-px bg-white/5 mb-4" />

        {/* actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleEnroll}
            className={cn(
              "flex-1 rounded-xl py-2 text-[13px] font-semibold transition-all duration-250 bg-brand-500 text-ink-950 hover:bg-brand-400 shadow-[0_2px_12px_rgba(0,200,255,0.3)]"
            )}
          >
            Enroll Now
          </button>
          <span className="flex items-center gap-0.5 text-[12px] text-white/30
                           group-hover:text-brand-400 transition-colors duration-250">
            Details
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-250" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────── filter pill ───────────────────────────────── */

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all duration-250",
        active
          ? "bg-brand-500/12 border-brand-500/40 text-brand-300"
          : "border-white/8 bg-white/3 text-white/40 hover:border-brand-500/25 hover:text-white/70"
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
      <div className="h-16 w-16 rounded-2xl border border-white/8 bg-white/4
                      flex items-center justify-center mb-5">
        <Search className="h-7 w-7 text-white/20" />
      </div>
      <h3 className="text-[17px] font-semibold text-white/60 mb-2">No courses found</h3>
      <p className="text-[14px] text-white/30 max-w-xs mb-6">
        Try adjusting your search or filters to find what you're looking for.
      </p>
      <button
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4
                   px-5 py-2 text-[13px] text-white/50 hover:text-white/80 hover:border-white/20
                   transition-all duration-250"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset filters
      </button>
    </div>
  );
}

/* ─────────────────────────── main page ─────────────────────────────────── */

export default function CoursesPage() {
  const [courses,       setCourses]       = useState<DBCourse[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [level,         setLevel]         = useState<Level>("ALL");
  const [priceFilter,   setPriceFilter]   = useState<PriceFilter>("ALL");
  const [sortBy,        setSortBy]        = useState<SortBy>("NEWEST");
  const [filtersOpen,   setFiltersOpen]   = useState(false);

  /* fetch on mount */
  useEffect(() => {
    fetchPublishedCourses()
      .then(setCourses)
      .catch(() => setError("Failed to load courses. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  /* derived filtered + sorted list */
  const filtered = useMemo(() => {
    let list = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.name.toLowerCase().includes(q)
      );
    }

    if (level !== "ALL") {
      list = list.filter((c) => c.level === level);
    }

    if (priceFilter === "FREE") list = list.filter((c) => c.price === 0);
    if (priceFilter === "PAID") list = list.filter((c) => c.price > 0);

    if (sortBy === "PRICE_ASC")  list.sort((a, b) => a.price - b.price);
    if (sortBy === "PRICE_DESC") list.sort((a, b) => b.price - a.price);
    // NEWEST: server already orders by createdAt desc

    return list;
  }, [courses, search, level, priceFilter, sortBy]);

  const hasActiveFilters = level !== "ALL" || priceFilter !== "ALL" || search.trim().length > 0;

  const resetFilters = () => {
    setSearch("");
    setLevel("ALL");
    setPriceFilter("ALL");
    setSortBy("NEWEST");
  };

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-white overflow-x-hidden pt-16"
        style={{
          background: "linear-gradient(160deg, #060D1A 0%, #091220 25%, #060D1A 55%, #091525 80%, #060D1A 100%)",
        }}
      >
        {/* ambient layers */}
        <div className="pointer-events-none fixed inset-0 dot-grid-dark opacity-20" aria-hidden />
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-[0.11]"
          style={{
            background: "radial-gradient(ellipse at top, rgba(0,200,255,0.45) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none fixed bottom-0 right-0 w-[600px] h-[500px] opacity-[0.07]"
          style={{
            background: "radial-gradient(ellipse at bottom right, rgba(0,80,200,0.7) 0%, transparent 65%)",
            filter: "blur(90px)",
          }}
          aria-hidden
        />

        <div className="relative container-x py-14 max-w-7xl">

          {/* ── PAGE HEADER ── */}
          <ScrollReveal animation="fade-up" duration={700}>
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg
                               bg-brand-500/10 border border-brand-500/20">
                <Layers className="h-4 w-4 text-brand-400" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400">
                AI Learning Division
              </p>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white mb-4">
              Our Programs
            </h1>
            <p className="text-white/40 text-[15px] leading-relaxed max-w-xl">
              Explore our comprehensive curriculum designed for the next era of technological mastery.
              Filter by level, duration, and investment to find your optimal path.
            </p>
          </ScrollReveal>


          {/* ── SEARCH + FILTER BAR ── */}
          <ScrollReveal animation="fade-up" delay={100} duration={650}>
            <div className="mt-10 flex flex-col gap-4">

              {/* top row: search + sort + filter toggle */}
              <div className="flex flex-col sm:flex-row gap-3">

                {/* search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search programs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/8 bg-white/[0.04] pl-11 pr-10 py-3
                               text-[14px] text-white placeholder-white/22
                               focus:outline-none focus:border-brand-500/50 focus:bg-white/[0.06]
                               focus:ring-2 focus:ring-brand-500/10 transition-all duration-200"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center
                                 justify-center rounded-full text-white/30 hover:text-white/60
                                 transition-colors duration-150"
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
                    className="appearance-none rounded-xl border border-white/8 bg-ink-800 pl-4 pr-9 py-3
                               text-[13px] text-white/60 focus:outline-none focus:border-brand-500/40
                               transition-all duration-200 cursor-pointer hover:border-white/15"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                                         h-4 w-4 text-white/30" />
                </div>

                {/* filter toggle (mobile) */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={cn(
                    "sm:hidden flex items-center justify-center gap-2 rounded-xl border px-4 py-3",
                    "text-[13px] font-medium transition-all duration-250",
                    filtersOpen
                      ? "border-brand-500/40 bg-brand-500/10 text-brand-300"
                      : "border-white/8 bg-white/4 text-white/50"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="h-2 w-2 rounded-full bg-brand-400" />
                  )}
                </button>
              </div>

              {/* filter pills row — always visible on desktop, toggleable on mobile */}
              <div className={cn(
                "flex flex-wrap gap-2 sm:flex",
                filtersOpen ? "flex" : "hidden sm:flex"
              )}>
                {/* LEVEL */}
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((l) => (
                    <FilterPill key={l.value} active={level === l.value} onClick={() => setLevel(l.value)}>
                      {l.label}
                    </FilterPill>
                  ))}
                </div>

                <div className="hidden sm:block w-px bg-white/8 self-stretch mx-1" />

                {/* PRICE */}
                <div className="flex flex-wrap gap-2">
                  {PRICE_OPTIONS.map((p) => (
                    <FilterPill key={p.value} active={priceFilter === p.value} onClick={() => setPriceFilter(p.value)}>
                      {p.label}
                    </FilterPill>
                  ))}
                </div>

                {/* reset */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto flex items-center gap-1.5 rounded-full border border-white/8 px-3.5 py-1.5
                               text-[12px] text-white/35 hover:text-red-400/70 hover:border-red-500/20
                               transition-all duration-250"
                  >
                    <RotateCcw className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>

            </div>
          </ScrollReveal>

          {/* results meta */}
          {!loading && !error && (
            <div className="mt-6 mb-2 flex items-center justify-between">
              <p className="text-[13px] text-white/30">
                {filtered.length === 0
                  ? "No programs found"
                  : `Showing ${filtered.length} program${filtered.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          )}


          {/* ── ERROR STATE ── */}
          {error && (
            <div className="mt-12 flex flex-col items-center text-center py-20">
              <div className="h-14 w-14 rounded-2xl border border-red-500/20 bg-red-500/8
                              flex items-center justify-center mb-4">
                <X className="h-6 w-6 text-red-400/70" />
              </div>
              <h3 className="text-[16px] font-semibold text-white/50 mb-2">Something went wrong</h3>
              <p className="text-[13px] text-white/30 mb-5">{error}</p>
              <button
                onClick={() => { setError(null); setLoading(true); fetchPublishedCourses().then(setCourses).catch(() => setError("Failed again. Please refresh.")).finally(() => setLoading(false)); }}
                className="rounded-full border border-white/10 px-5 py-2 text-[13px] text-white/40
                           hover:text-white/70 hover:border-white/20 transition-all duration-250"
              >
                Try again
              </button>
            </div>
          )}


          {/* ── COURSE GRID ── */}
          {!error && (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                : filtered.length === 0
                  ? <EmptyState onReset={resetFilters} />
                  : filtered.map((course, i) => (
                      <ScrollReveal key={course.id} animation="fade-up" delay={i * 60} duration={650}>
                        <CourseCard course={course} />
                      </ScrollReveal>
                    ))
              }
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  Briefcase,
  MapPin,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  type DBInternship,
  fetchInternshipCategories,
} from "@/lib/internshipsApi";
import { useInternships } from "@/hooks/queries/useInternships";
import { useAppSelector } from "@/store/hooks";
import { useQuery } from "@tanstack/react-query";

type EmploymentFilter = "ALL" | "FULL_TIME" | "PART_TIME" | "REMOTE";

const EMPLOYMENT_OPTIONS: { value: EmploymentFilter; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "REMOTE", label: "Remote" },
];

const EMPLOYMENT_COLOR: Record<string, string> = {
  FULL_TIME: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  PART_TIME: "bg-amber-500/15  text-amber-400  border-amber-500/25",
  REMOTE: "bg-blue-500/15    text-blue-400    border-blue-500/25",
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800 overflow-hidden animate-pulse">
      <div className="aspect-video w-full bg-ink-700" />
      <div className="p-4 space-y-3">
        <div className="h-2 w-16 rounded-full bg-white/8" />
        <div className="h-4 w-3/4 rounded-full bg-white/10" />
        <div className="h-3 w-full rounded-full bg-white/6" />
        <div className="h-3 w-2/3 rounded-full bg-white/6" />
        <div className="h-8 rounded-lg bg-white/6 mt-4" />
      </div>
    </div>
  );
}

function SkeletonDetailPanel() {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800 p-6 animate-pulse">
      <div className="aspect-video w-full bg-ink-700 rounded-lg mb-6" />
      <div className="space-y-4">
        <div className="h-6 w-3/4 rounded-full bg-white/8" />
        <div className="h-4 w-1/2 rounded-full bg-white/6" />
        <div className="space-y-3 mt-6">
          <div className="h-4 w-full rounded-full bg-white/6" />
          <div className="h-4 w-5/6 rounded-full bg-white/6" />
        </div>
      </div>
    </div>
  );
}

function InternshipCard({
  internship,
  selected,
  onClick,
}: {
  internship: DBInternship;
  selected: boolean;
  onClick: () => void;
}) {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) router.push("/login");
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={cn(
        "group relative flex flex-col rounded-xl border bg-ink-800 overflow-hidden transition-all duration-350 text-left cursor-pointer",
        selected
          ? "border-brand-500/50 shadow-[0_12px_40px_rgba(0,200,255,0.2),0_0_0_1px_rgba(0,200,255,0.2)]"
          : "border-white/8 hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-[0_6px_24px_rgba(0,0,0,0.4)]",
      )}
      style={{
        background:
          "linear-gradient(160deg, rgba(13,23,39,0.95) 0%, rgba(9,18,32,1) 100%)",
        transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/0
                      to-transparent group-hover:via-brand-500/40 transition-all duration-500 z-10"
      />

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center gap-2 mb-2">
          {internship.category && (
            <span
              className="inline-flex items-center rounded-full border border-brand-500/20
                             bg-ink-900/80 backdrop-blur-sm px-2.5 py-0.5 text-[10px]
                             font-medium text-brand-300/80"
            >
              {internship.category.name}
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
              EMPLOYMENT_COLOR[internship.employmentType] ??
                "bg-white/8 text-white/50 border-white/10",
            )}
          >
            {internship.employmentType.charAt(0) +
              internship.employmentType.slice(1).toLowerCase()}
          </span>
        </div>

        <h3
          className="text-[14px] font-semibold leading-snug text-white mb-1
                       group-hover:text-brand-300 transition-colors duration-300 line-clamp-2 text-left"
        >
          {internship.title}
        </h3>

        <p className="text-[12px] text-brand-300/70 font-medium mb-2 text-left">
          {internship.company}
        </p>

        {internship.description && (
          <p className="text-[12px] text-white/40 leading-relaxed line-clamp-1 mb-3 text-left">
            {internship.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35 mb-3">
          {internship.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-brand-500/50" />
              {internship.location}
            </span>
          )}
          {internship.stipend && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-brand-500/50" />
              {internship.stipend}
            </span>
          )}
        </div>

        <div className="h-px bg-white/5 mb-3" />

        <button
          onClick={handleApply}
          className="w-full rounded-lg py-2 text-[12px] font-semibold transition-all duration-250 bg-brand-500 text-ink-950 hover:bg-brand-400"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
}

function DetailPanel({
  internship,
  loading,
}: {
  internship: DBInternship | null;
  loading: boolean;
}) {
  if (loading) {
    return <SkeletonDetailPanel />;
  }

  if (!internship) {
    return (
      <div className="rounded-2xl border border-white/5 bg-ink-800/50 p-8 flex flex-col items-center justify-center h-96 text-center">
        <Briefcase className="h-12 w-12 text-white/20 mb-4" />
        <p className="text-white/40 text-sm">Select an internship to view details</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800 overflow-hidden">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {internship.title}
              </h2>
              <p className="text-brand-300/70 font-medium">{internship.company}</p>
            </div>
            {internship.category && (
              <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                {internship.category.name}
              </span>
            )}
          </div>

          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase",
              EMPLOYMENT_COLOR[internship.employmentType] ??
                "bg-white/8 text-white/50 border-white/10",
            )}
          >
            {internship.employmentType.replace("_", " ")}
          </span>
        </div>

        <div className="h-px bg-white/5" />

        <div className="grid grid-cols-2 gap-4">
          {internship.location && (
            <div>
              <p className="text-xs text-white/50 mb-1">Location</p>
              <p className="text-sm text-white/80 font-medium">
                {internship.location}
              </p>
            </div>
          )}
          {internship.stipend && (
            <div>
              <p className="text-xs text-white/50 mb-1">Stipend</p>
              <p className="text-sm text-white/80 font-medium">
                {internship.stipend}
              </p>
            </div>
          )}
          {internship.domain && (
            <div>
              <p className="text-xs text-white/50 mb-1">Domain</p>
              <p className="text-sm text-white/80 font-medium">
                {internship.domain}
              </p>
            </div>
          )}
          {internship.deadline && (
            <div>
              <p className="text-xs text-white/50 mb-1">Deadline</p>
              <p className="text-sm text-white/80 font-medium">
                {new Date(internship.deadline).toLocaleDateString("en-IN")}
              </p>
            </div>
          )}
        </div>

        {internship.description && (
          <>
            <div className="h-px bg-white/5" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                Full Description
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                {internship.description}
              </p>
            </div>
          </>
        )}

        <div className="h-px bg-white/5" />

        <Link
          href={`/internships/${internship.slug}`}
          className="block w-full rounded-lg bg-brand-500 text-ink-950 font-semibold py-3 text-center hover:bg-brand-400 transition-colors duration-250"
        >
          View Full Details
        </Link>
      </div>
    </div>
  );
}

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
        "rounded-full px-4 py-1.5 text-[13px] font-medium border transition-all duration-250",
        active
          ? "bg-brand-500/12 border-brand-500/40 text-brand-300"
          : "border-white/8 bg-white/3 text-white/40 hover:border-brand-500/25 hover:text-white/70",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div
        className="h-16 w-16 rounded-2xl border border-white/8 bg-white/4
                      flex items-center justify-center mb-5"
      >
        <Search className="h-7 w-7 text-white/20" />
      </div>
      <h3 className="text-[17px] font-semibold text-white/60 mb-2">
        No internships found
      </h3>
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

export default function InternshipsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employment, setEmployment] = useState<EmploymentFilter>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<DBInternship | null>(
    null,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading: loading, isError, error } = useInternships(
    currentPage,
    selectedCategory ?? undefined,
  );
  const { data: categories = [] } = useQuery({
    queryKey: ["internship-categories"],
    queryFn: fetchInternshipCategories,
  });

  const internships = data?.data ?? [];
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

  const filtered = useMemo(() => {
    let list = [...internships];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.company.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }

    if (employment !== "ALL") {
      list = list.filter((i) => i.employmentType === employment);
    }

    return list;
  }, [internships, search, employment]);

  const hasActiveFilters =
    employment !== "ALL" || search.trim().length > 0 || selectedCategory;

  const resetFilters = () => {
    setSearch("");
    setEmployment("ALL");
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-white overflow-x-hidden pt-16"
        style={{
          background:
            "linear-gradient(160deg, #060D1A 0%, #091220 25%, #060D1A 55%, #091525 80%, #060D1A 100%)",
        }}
      >
        {/* ambient layers */}
        <div
          className="pointer-events-none fixed inset-0 dot-grid-dark opacity-20"
          aria-hidden
        />
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-[0.11]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(0,200,255,0.45) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none fixed bottom-0 right-0 w-[600px] h-[500px] opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, rgba(0,80,200,0.7) 0%, transparent 65%)",
            filter: "blur(90px)",
          }}
          aria-hidden
        />

        <div className="relative container-x py-10 max-w-7xl">
          {/* ── PAGE HEADER ── */}
          <ScrollReveal animation="fade-up" duration={700}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg
                                 bg-brand-500/10 border border-brand-500/20"
                >
                  <Briefcase className="h-4 w-4 text-brand-400" />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400">
                  Career Opportunities
                </p>
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white mb-2">
              Our Programs
            </h1>
            <p className="text-white/40 text-[14px] leading-relaxed max-w-2xl mb-10">
              Explore curated internship opportunities to launch your career. Filter by employment type and find your perfect fit.
            </p>
          </ScrollReveal>

          {/* ── SECTION 1: CATEGORY FILTER ── */}
          {categories.length > 0 && (
            <ScrollReveal animation="fade-up" delay={100} duration={650}>
              <div className="mb-12">
                <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wide">
                  Browse by Category
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "rounded-full px-5 py-2.5 text-[13px] font-medium border transition-all duration-250 hover:scale-105",
                      !selectedCategory
                        ? "bg-brand-500/15 border-brand-500/50 text-brand-200 shadow-[0_0_20px_rgba(0,200,255,0.15)]"
                        : "border-white/10 bg-white/5 text-white/50 hover:border-brand-500/30 hover:text-white/70",
                    )}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "rounded-full px-5 py-2.5 text-[13px] font-medium border transition-all duration-250 hover:scale-105",
                        selectedCategory === cat.id
                          ? "bg-brand-500/15 border-brand-500/50 text-brand-200 shadow-[0_0_20px_rgba(0,200,255,0.15)]"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-brand-500/30 hover:text-white/70",
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* ── SECTION 2 & 3: FILTERS + CARDS + DETAIL PANEL ── */}
          <ScrollReveal animation="fade-up" delay={150} duration={650}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT SIDEBAR: FILTERS */}
              <div className="lg:col-span-3">
                <div
                  className={cn(
                    "rounded-2xl border border-white/5 bg-ink-800/50 p-6",
                    "lg:block",
                    "lg:sticky lg:top-24",
                    filtersOpen ? "block" : "hidden",
                  )}
                >
                  <div className="flex items-center justify-between mb-5 lg:mb-6 lg:hidden">
                    <h3 className="font-semibold text-white text-sm">Filters</h3>
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="text-white/40 hover:text-white/60"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <h3 className="hidden lg:block text-sm font-semibold text-white mb-6 uppercase tracking-wide">Filters</h3>

                  <div className="space-y-6">
                    {/* search */}
                    <div>
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 block">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Internship name..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full rounded-lg border border-white/8 bg-white/[0.04] pl-10 pr-4 py-2.5
                                     text-[13px] text-white placeholder-white/22
                                     focus:outline-none focus:border-brand-500/50 focus:bg-white/[0.06]
                                     transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* employment type */}
                    <div>
                      <label className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3 block">
                        Employment Type
                      </label>
                      <div className="space-y-2">
                        {EMPLOYMENT_OPTIONS.map((e) => (
                          <button
                            key={e.value}
                            onClick={() => setEmployment(e.value)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-250",
                              employment === e.value
                                ? "bg-brand-500/12 border border-brand-500/40 text-brand-300"
                                : "border border-white/8 text-white/60 hover:border-brand-500/25 hover:text-white/80",
                            )}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* reset */}
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/8 px-3 py-2.5
                                   text-[13px] text-white/40 hover:text-white/70 hover:border-white/20
                                   transition-all duration-250"
                      >
                        <RotateCcw className="h-4 w-4" /> Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* filter toggle button (mobile) */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden w-full flex items-center justify-center gap-2 rounded-lg border border-white/8 px-4 py-3
                             text-[13px] font-medium text-white/50 hover:text-white/70 mb-4"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {filtersOpen ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              {/* CENTER: CARD GRID */}
              <div className="lg:col-span-5">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-[12px] text-white/40 uppercase tracking-wide font-medium">
                    {loading
                      ? "Loading..."
                      : `${filtered.length} internship${filtered.length !== 1 ? "s" : ""}`}
                  </p>
                </div>

                {isError && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-8 text-center">
                    <X className="h-8 w-8 text-red-400/70 mx-auto mb-3" />
                    <h3 className="text-[14px] font-semibold text-white/50 mb-1">
                      Something went wrong
                    </h3>
                    <p className="text-[12px] text-white/30">
                      {error?.message ?? "Failed to load internships"}
                    </p>
                  </div>
                )}

                {!isError && (
                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <SkeletonCard key={i} />
                      ))
                    ) : filtered.length === 0 ? (
                      <EmptyState onReset={resetFilters} />
                    ) : (
                      filtered.map((internship) => (
                        <InternshipCard
                          key={internship.id}
                          internship={internship}
                          selected={selectedInternship?.id === internship.id}
                          onClick={() => setSelectedInternship(internship)}
                        />
                      ))
                    )}
                  </div>
                )}

                {/* pagination */}
                {!isError && !loading && filtered.length > 0 && pagination && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        pagination.hasPreviousPage
                          ? "border border-white/10 text-white/60 hover:border-brand-500/40 hover:text-brand-300"
                          : "border border-white/5 text-white/20 cursor-not-allowed",
                      )}
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(pagination.totalPages, 3) },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={cn(
                            "h-8 w-8 rounded-lg text-xs font-medium transition-all duration-200",
                            currentPage === page
                              ? "bg-brand-500 text-ink-950 font-semibold"
                              : "border border-white/8 text-white/60 hover:border-brand-500/40 hover:text-brand-300",
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
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        pagination.hasNextPage
                          ? "border border-white/10 text-white/60 hover:border-brand-500/40 hover:text-brand-300"
                          : "border border-white/5 text-white/20 cursor-not-allowed",
                      )}
                    >
                      Next
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT: DETAIL PANEL */}
              <div className="lg:col-span-4 hidden lg:block">
                <div className="sticky top-24">
                  <DetailPanel
                    internship={selectedInternship}
                    loading={loading && !selectedInternship}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </>
  );
}

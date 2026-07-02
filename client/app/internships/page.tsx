"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  Clock,
  BookOpen,
  FolderKanban,
  Gift,
  CalendarDays,
  CheckCircle2,
  Share2,
  Bookmark,
  Code,
  Megaphone,
  BarChart3,
  Database,
  Palette,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  type DBInternship,
  type DBInternshipDetail,
  fetchInternshipBySlug,
  applyInternship,
  checkApplication,
} from "@/lib/internshipsApi";
import { useInternships } from "@/hooks/queries/useInternships";
import { useInternshipCategories } from "@/hooks/queries/useInternshipCategories";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { uploadResume } from "@/store/authSlice";
import { useQuery } from "@tanstack/react-query";

type EmploymentFilter = "ALL" | "FULL_TIME" | "PART_TIME" | "REMOTE";

const EMPLOYMENT_OPTIONS: { value: EmploymentFilter; label: string }[] = [
  { value: "ALL", label: "All Worktypes" },
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "REMOTE", label: "Remote" },
];

const EMPLOYMENT_COLOR: Record<string, string> = {
  FULL_TIME: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PART_TIME: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  REMOTE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// ── CUSTOM PRETEXT HEIGHT HOOK ──
function usePretextHeight(
  text: string | undefined,
  font: string = "13px Inter",
  lineHeight: number = 20,
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].target.clientWidth);
      }
    });
    observer.observe(ref.current);
    setWidth(ref.current.clientWidth);
    return () => observer.disconnect();
  }, []);

  const height = useMemo(() => {
    if (!isClient || !text || width <= 0) return 0;
    try {
      // @ts-ignore
      const { prepare, layout } = require("@chenglou/pretext");
      const prepared = prepare(text, font);
      const res = layout(prepared, width, lineHeight);
      return res.height;
    } catch (e) {
      console.warn("Pretext layout failed", e);
      return 0;
    }
  }, [text, width, font, lineHeight, isClient]);

  return [ref, height] as const;
}

function PretextAnimatedHeight({
  text,
  font = "13px Inter",
  lineHeight = 20,
  children,
  className,
}: {
  text: string | undefined;
  font?: string;
  lineHeight?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [ref, height] = usePretextHeight(text, font, lineHeight);

  return (
    <div
      ref={ref}
      style={{
        height: height > 0 ? `${height}px` : "auto",
        transition: "height 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className={cn("overflow-hidden", className)}
    >
      {children}
    </div>
  );
}

// ── CUSTOM DROPDOWN COMPONENT ──
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg border border-white/8 bg-white/4 px-3 py-2.5 text-[12px] text-white hover:border-brand-500/30 transition-all duration-200 cursor-pointer"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : value}
        </span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-white/45 transition-transform duration-200",
            open ? "rotate-90 text-brand-400" : "rotate-0",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 z-35 max-h-48 overflow-y-auto rounded-lg border border-white/8 bg-ink-900 p-1 shadow-2xl scrollbar-thin">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-[12px] font-medium transition-colors hover:bg-white/5 cursor-pointer",
                opt.value === value
                  ? "text-brand-300 bg-brand-500/10"
                  : "text-white/60",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CATEGORY CARD COMPONENT ──
const CATEGORY_PALETTES = [
  {
    hover:
      "hover:border-blue-500/40 hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)]",
    icon: "bg-blue-500/10 text-blue-400",
  },
  {
    hover:
      "hover:border-fuchsia-500/40 hover:shadow-[0_4px_20px_rgba(217,70,239,0.15)]",
    icon: "bg-fuchsia-500/10 text-fuchsia-400",
  },
  {
    hover:
      "hover:border-emerald-500/40 hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)]",
    icon: "bg-emerald-500/10 text-emerald-400",
  },
  {
    hover:
      "hover:border-sky-500/40 hover:shadow-[0_4px_20px_rgba(56,189,248,0.15)]",
    icon: "bg-sky-500/10 text-sky-400",
  },
  {
    hover:
      "hover:border-rose-500/40 hover:shadow-[0_4px_20px_rgba(244,63,94,0.15)]",
    icon: "bg-rose-500/10 text-rose-400",
  },
];

const CATEGORY_ICONS = [Code, Megaphone, BarChart3, Database, Palette];

function CategoryCard({
  name,
  count,
  colorIndex,
  isSelected,
  onClick,
}: {
  name: string;
  count: string;
  colorIndex: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const palette = CATEGORY_PALETTES[colorIndex % CATEGORY_PALETTES.length];
  const Icon = CATEGORY_ICONS[colorIndex % CATEGORY_ICONS.length];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border p-6 text-center transition-all duration-300 w-full hover:-translate-y-1 cursor-pointer",
        isSelected
          ? "bg-brand-500 border-brand-500 text-ink-950 shadow-[0_0_25px_rgba(0,200,255,0.35)]"
          : cn("border-white/5 bg-ink-900 text-white", palette.hover),
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full mb-4 transition-colors duration-300",
          isSelected ? "bg-ink-950 text-brand-500" : palette.icon,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h4 className="text-[15px] font-bold mb-1">{name}</h4>
      <p
        className={cn(
          "text-[11px] font-medium",
          isSelected ? "text-ink-950/70" : "text-white/40",
        )}
      >
        {count}
      </p>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-900 overflow-hidden animate-pulse p-5 space-y-4">
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-full bg-white/10" />
        <div className="h-5 w-16 rounded-full bg-white/5" />
      </div>
      <div className="h-5 w-3/4 rounded bg-white/10" />
      <div className="h-3 w-1/3 rounded bg-white/5" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
      </div>
      <div className="h-4 w-1/3 rounded bg-white/10 pt-2" />
    </div>
  );
}

function SkeletonDetailPanel() {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800 p-6 animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-6 w-3/4 rounded bg-white/10" />
        <div className="h-4 w-1/2 rounded bg-white/5" />
      </div>
      <div className="flex gap-3">
        <div className="h-7 w-20 rounded bg-white/5" />
        <div className="h-7 w-20 rounded bg-white/5" />
      </div>
      <div className="space-y-3 pt-4">
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-5/6 rounded bg-white/5" />
      </div>
    </div>
  );
}

function InternshipCardComponent({
  internship,
  selected,
  onClick,
}: {
  internship: DBInternship;
  selected: boolean;
  onClick: () => void;
}) {
  const formattedDate = useMemo(() => {
    if (!internship.deadline) return "Apply by 30 June";
    try {
      const d = new Date(internship.deadline);
      return `Apply by ${d.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`;
    } catch {
      return "Apply by 30 June";
    }
  }, [internship.deadline]);

  const getModePillColor = (mode: string) => {
    switch (mode) {
      case "FULL_TIME":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "PART_TIME":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "REMOTE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-white/8 text-white/50 border-white/10";
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "FULL_TIME":
        return "On-Site";
      case "PART_TIME":
        return "Hybrid";
      case "REMOTE":
        return "Online";
      default:
        return "On-Site";
    }
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      className={cn(
        "group relative flex flex-col rounded-2xl border p-5 overflow-hidden transition-all duration-300 text-left cursor-pointer",
        selected
          ? "border-brand-500/50 bg-ink-800 shadow-[0_8px_30px_rgba(0,200,255,0.15)] animate-none"
          : "border-white/5 bg-ink-900 hover:border-brand-500/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5",
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              getModePillColor(internship.employmentType),
            )}
          >
            {getModeLabel(internship.employmentType)}
          </span>
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-white/60">
            2 Months
          </span>
        </div>
        <div
          className="flex gap-2.5 relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="text-white/40 hover:text-brand-400 transition-colors cursor-pointer"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            className="text-white/40 hover:text-brand-400 transition-colors cursor-pointer"
            aria-label="Bookmark"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Title & Company */}
      <h3 className="text-[16px] font-bold text-white group-hover:text-brand-400 transition-colors duration-250 mb-1 leading-snug line-clamp-1">
        {internship.title}
      </h3>
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">
        {internship.company}
      </p>

      {/* Description */}
      {internship.description && (
        <p className="text-[13px] text-white/60 leading-relaxed line-clamp-2 mb-4">
          {internship.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-brand-400/90 group-hover:text-brand-300 transition-colors">
          {formattedDate}
        </span>
      </div>

      {/* Diagonal Accent */}
      <div className="absolute bottom-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
        <div
          className={cn(
            "absolute bottom-[-16px] right-[-16px] w-8 h-8 rotate-45 transform origin-bottom-right transition-transform duration-300 group-hover:scale-125",
            selected
              ? "bg-brand-500/30"
              : "bg-white/10 group-hover:bg-brand-500/20",
          )}
        />
      </div>
    </div>
  );
}

function DetailPanel({
  internship,
  loading,
  onApply,
  onClose,
  applied = false,
}: {
  internship: DBInternshipDetail | null;
  loading: boolean;
  onApply: () => void;
  onClose?: () => void;
  applied?: boolean;
}) {
  if (loading) {
    return <SkeletonDetailPanel />;
  }

  if (!internship) {
    return (
      <div className="rounded-2xl border border-white/5 bg-ink-800/50 p-8 flex flex-col items-center justify-center h-96 text-center">
        <Briefcase className="h-12 w-12 text-white/20 mb-4" />
        <p className="text-white/40 text-sm">
          Select an internship to view details
        </p>
      </div>
    );
  }

  const getModePillColor = (mode: string) => {
    switch (mode) {
      case "FULL_TIME":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "PART_TIME":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "REMOTE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-white/8 text-white/50 border-white/10";
    }
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "FULL_TIME":
        return "On-Site";
      case "PART_TIME":
        return "Hybrid";
      case "REMOTE":
        return "Online";
      default:
        return "On-Site";
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-ink-800 overflow-hidden flex flex-col max-h-[calc(100vh-7rem)]">
      {/* Scrollable details container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {/* Title / Header */}
        <div className="relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-1 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="flex items-start justify-between gap-3 mb-2 pr-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-bold text-white leading-snug mb-1">
                {internship.title}
              </h2>
              <p className="text-brand-300/70 text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                {internship.company}
                {internship.category && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>{internship.category.name}</span>
                  </>
                )}
              </p>
            </div>
            {!onClose && (
              <div
                className="flex gap-2.5 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="text-white/40 hover:text-brand-400 transition-colors cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 className="h-4.5 w-4.5" />
                </button>
                <button
                  className="text-white/40 hover:text-brand-400 transition-colors cursor-pointer"
                  aria-label="Bookmark"
                >
                  <Bookmark className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 border-b border-white/5 pb-5">
            <div className="flex gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  getModePillColor(internship.employmentType),
                )}
              >
                {getModeLabel(internship.employmentType)}
              </span>
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/50">
                2 Months
              </span>
            </div>
            <button
              onClick={onApply}
              disabled={applied}
              className={cn(
                "rounded-lg font-bold px-5 py-2 text-xs transition-colors cursor-pointer",
                applied
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-not-allowed"
                  : "bg-brand-500 hover:bg-brand-400 text-ink-950"
              )}
            >
              {applied ? "Applied" : "Apply Now"}
            </button>
          </div>
        </div>

        {/* Details Checklist style */}
        <div>
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3.5">
            Internship Details
          </h3>
          <div className="space-y-3">
            {internship.stipend && (
              <div className="flex items-center gap-3 text-white/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-brand-400 font-bold text-sm">
                  ₹
                </span>
                <span className="text-[13px] font-bold">
                  ₹{internship.stipend}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-white/80">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/60">
                <Briefcase className="h-3.5 w-3.5 text-brand-400" />
              </span>
              <span className="text-[13px] font-semibold">
                {internship.employmentType === "FULL_TIME"
                  ? "Full Time"
                  : internship.employmentType === "PART_TIME"
                    ? "Part Time"
                    : "Remote"}
              </span>
            </div>
            {internship.location && (
              <div className="flex items-center gap-3 text-white/80">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-white/60">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                </span>
                <span className="text-[13px] font-semibold">
                  {internship.location}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Full Internship Description */}
        {internship.description && (
          <div>
            <h3 className="text-xs font-bold text-white/45 uppercase tracking-widest mb-3">
              Full Internship Description
            </h3>
            <PretextAnimatedHeight
              text={internship.description}
              font="13px Inter"
              lineHeight={20}
            >
              <p className="text-[13px] text-white/60 leading-relaxed">
                {internship.description}
              </p>
            </PretextAnimatedHeight>
          </div>
        )}

        {/* Key Learning Outcomes */}
        {internship.keyLearningOutcomes &&
          internship.keyLearningOutcomes.length > 0 && (
            <>
              <div className="h-px bg-white/5" />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-4 w-4 text-brand-400" />
                  <h3 className="text-xs font-bold text-white/45 uppercase tracking-widest">
                    Key Learning Outcomes
                  </h3>
                </div>
                <ul className="space-y-3.5">
                  {internship.keyLearningOutcomes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-brand-500/70 flex-shrink-0 mt-0.5" />
                      <div>
                        {item.title && (
                          <p className="text-[13px] font-bold text-white/90 leading-snug">
                            {item.title}
                          </p>
                        )}
                        {item.body && (
                          <p className="text-[12px] text-white/50 leading-relaxed mt-0.5">
                            {item.body}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

        {/* Major Project */}
        {internship.majorProject && internship.majorProject.length > 0 && (
          <>
            <div className="h-px bg-white/5" />
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FolderKanban className="h-4 w-4 text-brand-400" />
                <h3 className="text-xs font-bold text-white/45 uppercase tracking-widest">
                  Major Project
                </h3>
              </div>
              <div className="space-y-4">
                {internship.majorProject.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col md:flex-row rounded-2xl border border-brand-500/15 bg-gradient-to-r from-ink-950 to-brand-950/20 overflow-hidden"
                  >
                    <div className="flex items-center justify-center p-6 md:w-1/3 bg-brand-500/5 md:border-r border-brand-500/15">
                      <h4 className="text-[18px] font-black text-brand-300 leading-tight uppercase text-center tracking-wider">
                        Major
                        <br />
                        Project
                      </h4>
                    </div>
                    <div className="p-6 md:w-2/3 flex items-center">
                      <p className="text-[13px] text-white/70 leading-relaxed font-medium">
                        {item.body || item.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* What You'll Receive */}
        {((internship.whatYouReceive && internship.whatYouReceive.length > 0) ||
          true) && (
          <>
            <div className="h-px bg-white/5" />
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Gift className="h-4 w-4 text-brand-400" />
                <h3 className="text-xs font-bold text-white/45 uppercase tracking-widest">
                  What You&apos;ll Receive
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {internship.whatYouReceive &&
                internship.whatYouReceive.length > 0 ? (
                  internship.whatYouReceive.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-white/8 bg-white/4 px-3 py-2"
                    >
                      <p className="text-[12px] font-semibold text-white/80">
                        {item.title}
                      </p>
                      {item.body && (
                        <p className="text-[10px] text-white/40 mt-0.5">
                          {item.body}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <>
                    <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-[12px] font-semibold text-white/80">
                      Experience Letter
                    </div>
                    <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-[12px] font-semibold text-white/80">
                      Completion Certificate
                    </div>
                    <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-[12px] font-semibold text-white/80">
                      Digital Verification Certificate
                    </div>
                    <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2 text-[12px] font-semibold text-white/80">
                      Professional Portfolio
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
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
                   px-5 py-2.5 text-[13px] text-white/65 hover:text-white hover:border-white/20
                   transition-all duration-250 cursor-pointer"
      >
        <RotateCcw className="h-3.5 w-3.5" /> Reset filters
      </button>
    </div>
  );
}

export default function InternshipsPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employment, setEmployment] = useState<EmploymentFilter>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Custom dropdown filters
  const [selectedField, setSelectedField] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("ALL");

  // Application modal states
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [modalResumeFile, setModalResumeFile] = useState<File | null>(null);
  const [modalResumeErr, setModalResumeErr] = useState<string | null>(null);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [forceUploadMode, setForceUploadMode] = useState(false);

  const {
    data,
    isLoading: loading,
    isError,
    error,
  } = useInternships(currentPage, selectedCategory ?? undefined);

  const { data: categories = [] } = useInternshipCategories();

  const { data: detailData, isLoading: detailLoading } =
    useQuery<DBInternshipDetail>({
      queryKey: ["internship-detail", selectedSlug],
      queryFn: () => fetchInternshipBySlug(selectedSlug!),
      enabled: !!selectedSlug,
    });

  // Check application status using React Query
  const { data: appStatus, refetch: refetchAppStatus } = useQuery({
    queryKey: ["internship-application", detailData?.id],
    queryFn: () => checkApplication(detailData!.id),
    enabled: !!detailData?.id && !!user,
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

  // Scan internships list for fields & cities dynamically
  const fieldOptions = useMemo(() => {
    const unique = new Set<string>();
    internships.forEach((i) => {
      if (i.domain) unique.add(i.domain);
    });
    return [
      { value: "ALL", label: "All Fields" },
      ...Array.from(unique).map((f) => ({ value: f, label: f })),
    ];
  }, [internships]);

  const cityOptions = useMemo(() => {
    const unique = new Set<string>();
    internships.forEach((i) => {
      if (i.location) {
        const city = i.location.split(",")[0].trim();
        unique.add(city);
      }
    });
    return [
      { value: "ALL", label: "All Cities" },
      ...Array.from(unique).map((c) => ({ value: c, label: c })),
    ];
  }, [internships]);

  const categoryOptions = useMemo(
    () => [
      { value: "ALL", label: "All Categories" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

  const topCategories = categories.slice(0, 5);

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

    if (selectedField !== "ALL") {
      list = list.filter((i) => i.domain === selectedField);
    }

    if (selectedCity !== "ALL") {
      list = list.filter((i) =>
        i.location?.toLowerCase().includes(selectedCity.toLowerCase()),
      );
    }

    if (selectedCategory) {
      list = list.filter((i) => i.category?.id === selectedCategory);
    }

    return list;
  }, [
    internships,
    search,
    employment,
    selectedField,
    selectedCity,
    selectedCategory,
  ]);

  // Auto-select first internship on load/filter change
  useEffect(() => {
    if (filtered.length > 0) {
      const exists = filtered.some((i) => i.slug === selectedSlug);
      if (!exists) {
        setSelectedSlug(filtered[0].slug);
      }
    } else {
      setSelectedSlug(null);
    }
  }, [filtered, selectedSlug]);

  const hasActiveFilters =
    employment !== "ALL" ||
    search.trim().length > 0 ||
    selectedCategory !== null ||
    selectedField !== "ALL" ||
    selectedCity !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setEmployment("ALL");
    setSelectedCategory(null);
    setSelectedField("ALL");
    setSelectedCity("ALL");
    setCurrentPage(1);
  };

  const handleApply = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setApplyModalOpen(true);
  };

  const handleConnectAndApply = async () => {
    if (!detailData) return;
    setIsSubmitLoading(true);
    setApplyError(null);
    try {
      await applyInternship(detailData.id);
      setSubmitSuccess(true);
      await refetchAppStatus();
    } catch (err: any) {
      setApplyError(err?.response?.data?.message || "Failed to apply for internship.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleUploadAndApply = async () => {
    if (!modalResumeFile || !detailData) return;
    setIsSubmitLoading(true);
    setApplyError(null);
    setModalResumeErr(null);
    try {
      const result = await dispatch(uploadResume(modalResumeFile));
      if (!uploadResume.fulfilled.match(result)) {
        throw new Error((result.payload as string) || "Failed to upload resume.");
      }
      await applyInternship(detailData.id);
      setSubmitSuccess(true);
      setModalResumeFile(null);
      await refetchAppStatus();
    } catch (err: any) {
      setApplyError(err.message || "Failed to upload and apply.");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-white overflow-x-hidden pt-20"
        style={{
          background:
            "linear-gradient(160deg, #050B14 0%, #080F1C 35%, #050B14 70%, #0D1727 100%)",
        }}
      >
        <div
          className="pointer-events-none fixed inset-0 dot-grid-dark opacity-15"
          aria-hidden
        />
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(0,200,255,0.4) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
          aria-hidden
        />

        <div className="relative container-x py-10 max-w-[1400px]">
          {/* PAGE HERO */}
          <ScrollReveal animation="fade-up" duration={700}>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white mb-3">
              Our Programs
            </h1>
            <p className="text-white/50 text-[14px] leading-relaxed max-w-2xl mb-12">
              Explore our comprehensive curriculum designed for the next era of
              technological mastery. Filter by level, duration, and investment
              to find your optimal path.
            </p>
          </ScrollReveal>

          {/* BROWSE BY CATEGORY */}
          <ScrollReveal animation="fade-up" delay={100} duration={650}>
            <div className="mb-14">
              <h2 className="text-2xl font-bold text-white mb-1.5">
                Browse by Category
              </h2>
              <p className="text-white/40 text-sm mb-6">
                Find the right opportunity matching your skills and interests
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {topCategories.map((cat, idx) => (
                  <CategoryCard
                    key={cat.id}
                    name={cat.name}
                    count={`${cat.count} Opening${cat.count !== 1 ? "s" : ""}`}
                    colorIndex={idx}
                    isSelected={selectedCategory === cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1);
                    }}
                  />
                ))}
                <CategoryCard
                  name="View All"
                  count={`${categories.reduce((s, c) => s + c.count, 0)}+ Openings`}
                  colorIndex={5}
                  isSelected={selectedCategory === null}
                  onClick={() => {
                    setSelectedCategory(null);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </ScrollReveal>

          {/* FILTERS + CARDS + DETAIL PANEL */}
          <ScrollReveal animation="fade-up" delay={150} duration={650}>
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_460px] gap-8">
              {/* LEFT: FILTERS COLUMN */}
              <div>
                <div
                  className={cn(
                    "rounded-2xl border border-white/5 bg-ink-900/60 backdrop-blur-md p-5 sticky top-24",
                    filtersOpen ? "block" : "hidden lg:block",
                  )}
                >
                  <div className="flex items-center justify-between mb-5 lg:hidden">
                    <h3 className="font-bold text-white text-sm">Filters</h3>
                    <button
                      onClick={() => setFiltersOpen(false)}
                      className="text-white/40 hover:text-white/60 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    <h3 className="hidden lg:block text-xs font-bold text-white uppercase tracking-widest">
                      Filters
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="space-y-5">
                    {/* Search Role */}
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5 block">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search by role..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full rounded-lg border border-white/8 bg-white/4 pl-9 pr-3 py-2.5
                                     text-[12px] text-white placeholder-white/20
                                     focus:outline-none focus:border-brand-500/50
                                     transition-all duration-200"
                        />
                      </div>
                    </div>

                    {/* Field Dropdown */}
                    <FilterDropdown
                      label="Field"
                      value={selectedField}
                      options={fieldOptions}
                      onChange={setSelectedField}
                    />

                    {/* Work Type Dropdown */}
                    <FilterDropdown
                      label="Work Type"
                      value={employment}
                      options={EMPLOYMENT_OPTIONS}
                      onChange={(v) => setEmployment(v as EmploymentFilter)}
                    />

                    {/* City Dropdown */}
                    <FilterDropdown
                      label="City"
                      value={selectedCity}
                      options={cityOptions}
                      onChange={setSelectedCity}
                    />

                    {/* Category Dropdown */}
                    <FilterDropdown
                      label="Category"
                      value={selectedCategory || "ALL"}
                      options={categoryOptions}
                      onChange={(v) => {
                        setSelectedCategory(v === "ALL" ? null : v);
                      }}
                    />
                  </div>
                </div>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="lg:hidden w-full flex items-center justify-center gap-2 rounded-lg border border-white/8 px-4 py-3
                             text-[13px] font-semibold text-white/60 hover:text-white mb-4 cursor-pointer"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {filtersOpen ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              {/* CENTER: CARD LIST COLUMN */}
              <div>
                <div className="mb-4">
                  <p className="text-[11px] text-white/40 uppercase tracking-widest font-semibold">
                    {loading
                      ? "Loading..."
                      : `${filtered.length} opportunity${filtered.length !== 1 ? "ies" : ""}`}
                  </p>
                </div>

                {isError && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
                    <X className="h-8 w-8 text-red-400/60 mx-auto mb-3" />
                    <h3 className="text-[14px] font-bold text-white/50 mb-1">
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
                        <InternshipCardComponent
                          key={internship.id}
                          internship={internship}
                          selected={selectedSlug === internship.slug}
                          onClick={() => {
                            setSelectedSlug(internship.slug);
                            setMobileDetailOpen(true);
                          }}
                        />
                      ))
                    )}
                  </div>
                )}

                {!isError && !loading && filtered.length > 0 && pagination && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer",
                        pagination.hasPreviousPage
                          ? "border border-white/10 text-white/60 hover:border-brand-500/40 hover:text-brand-300 bg-white/2"
                          : "border border-white/5 text-white/20 cursor-not-allowed bg-transparent",
                      )}
                    >
                      <ChevronLeft className="h-3 w-3" /> Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "h-8 w-8 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
                            currentPage === page
                              ? "bg-brand-500 text-ink-950 font-black"
                              : "border border-white/8 text-white/60 hover:border-brand-500/40 hover:text-brand-300 bg-white/2",
                          )}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!pagination.hasNextPage}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer",
                        pagination.hasNextPage
                          ? "border border-white/10 text-white/60 hover:border-brand-500/40 hover:text-brand-300 bg-white/2"
                          : "border border-white/5 text-white/20 cursor-not-allowed bg-transparent",
                      )}
                    >
                      Next <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT: DESKTOP DETAIL PANEL */}
              <div className="hidden lg:block">
                <div className="sticky top-24">
                  <DetailPanel
                    internship={detailData ?? null}
                    loading={detailLoading && !!selectedSlug}
                    onApply={handleApply}
                    applied={appStatus?.applied ?? false}
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </main>

      {/* MOBILE DRAWER / OVERLAY PANEL */}
      {mobileDetailOpen && selectedSlug && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="relative w-full max-h-[85vh] bg-ink-950 rounded-t-3xl border-t border-white/10 overflow-hidden shadow-2xl animate-fade-up-in">
            <div className="h-1.5 w-12 bg-white/10 rounded-full mx-auto my-3 pointer-events-none" />
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              <DetailPanel
                internship={detailData ?? null}
                loading={detailLoading && !!selectedSlug}
                onApply={handleApply}
                onClose={() => setMobileDetailOpen(false)}
                applied={appStatus?.applied ?? false}
              />
            </div>
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      {applyModalOpen && detailData && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-ink-950 p-6 shadow-2xl animate-fade-in text-white">
            {/* Close Button */}
            <button
              onClick={() => {
                setApplyModalOpen(false);
                setModalResumeFile(null);
                setModalResumeErr(null);
                setApplyError(null);
                setSubmitSuccess(false);
                setForceUploadMode(false);
              }}
              className="absolute top-4 right-4 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {submitSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">Application Submitted!</h3>
                <p className="text-sm text-white/60">
                  You have successfully applied for the <span className="font-semibold text-white">{detailData.title}</span> program at <span className="font-semibold text-white">{detailData.company}</span>.
                </p>
                <button
                  onClick={() => {
                    setApplyModalOpen(false);
                    setSubmitSuccess(false);
                  }}
                  className="w-full mt-4 rounded-lg bg-brand-500 hover:bg-brand-400 text-ink-950 font-bold py-2.5 text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest block mb-1">
                    Apply for Program
                  </span>
                  <h3 className="text-lg font-bold truncate">{detailData.title}</h3>
                  <p className="text-xs text-white/50">{detailData.company}</p>
                </div>

                <div className="h-px bg-white/5 w-full" />

                {/* Main Content Area */}
                {user?.resumeUrl && !forceUploadMode ? (
                  /* Case A: User has resume, show connect options */
                  <div className="space-y-4">
                    <div className="rounded-xl border border-brand-500/20 bg-brand-500/4 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-brand-400 flex-shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-white truncate">
                            Your Resume / CV
                          </p>
                          <a
                            href={user.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1 mt-0.5"
                          >
                            View uploaded file
                          </a>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                        Connected
                      </span>
                    </div>

                    <p className="text-xs text-white/40 leading-normal">
                      We will submit the resume connected to your profile. You can also upload a different one.
                    </p>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={handleConnectAndApply}
                        disabled={isSubmitLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-ink-950 font-bold py-2.5 text-sm transition-colors cursor-pointer"
                      >
                        {isSubmitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isSubmitLoading ? "Submitting..." : "Connect & Submit Application"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setForceUploadMode(true)}
                        className="text-xs text-white/40 hover:text-white/60 transition-colors py-1 cursor-pointer"
                      >
                        Upload a different resume
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Case B: User must upload resume */
                  <div className="space-y-4">
                    <p className="text-xs text-white/60 leading-normal">
                      Please upload your resume (PDF or Word, max 5MB) to apply for this internship.
                    </p>

                    <label className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-500/20 bg-brand-500/4 hover:bg-brand-500/8 hover:border-brand-500/35 cursor-pointer transition-all duration-250 p-6 text-center">
                      <Upload className="h-7 w-7 text-brand-400/50" />
                      <div className="min-w-0 max-w-full">
                        <p className="text-[13px] font-medium text-white/60 truncate px-2">
                          {modalResumeFile ? modalResumeFile.name : "Click to select file"}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5">PDF, DOC, DOCX · Max 5 MB</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="sr-only"
                        onChange={(e) => {
                          setModalResumeErr(null);
                          setApplyError(null);
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              setModalResumeErr("File size too large. Maximum allowed size is 5 MB.");
                              setModalResumeFile(null);
                            } else {
                              setModalResumeFile(file);
                            }
                          } else {
                            setModalResumeFile(null);
                          }
                        }}
                      />
                    </label>

                    {modalResumeErr && (
                      <p className="text-[11px] text-red-400">{modalResumeErr}</p>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={handleUploadAndApply}
                        disabled={!modalResumeFile || isSubmitLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-ink-950 font-bold py-2.5 text-sm transition-colors cursor-pointer"
                      >
                        {isSubmitLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {isSubmitLoading ? "Uploading & Applying..." : "Upload & Submit Application"}
                      </button>

                      {user?.resumeUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setForceUploadMode(false);
                            setModalResumeFile(null);
                            setModalResumeErr(null);
                          }}
                          className="text-xs text-white/40 hover:text-white/60 transition-colors py-1 cursor-pointer"
                        >
                          Use my existing resume
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {applyError && (
                  <p className="text-xs text-red-400 text-center mt-2 font-medium bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                    {applyError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLearningRoutes } from "./LearningRouteContext";
import { cn } from "@/lib/utils";

export type LearningCrumb =
  | "learning"
  | "assessments"
  | "results"
  | "history"
  | "intro";

/**
 * Direct2Hire: Dashboard > Direct2Hire > AI Learning > …
 * Public LMS: Courses > {courseTitle} > …
 */
export function LearningBreadcrumbs({
  current,
  courseTitle,
  backOnly,
  className,
}: {
  current: LearningCrumb;
  courseTitle?: string;
  /** Compact single back-link (assessment pages). */
  backOnly?: boolean;
  className?: string;
}) {
  const routes = useLearningRoutes();

  if (routes.scope === "dashboard") {
    if (backOnly) {
      const parentHref =
        current === "learning" ? routes.hub : routes.assessments;
      const parentLabel =
        current === "learning" ? "AI Learning" : "Assessments";
      return (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs sm:text-sm",
            className,
          )}
        >
          <Link
            href={parentHref}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={14} />
            Back to {parentLabel}
          </Link>
        </div>
      );
    }

    const trail: { label: string; href?: string }[] = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Direct2Hire", href: "/dashboard" },
      { label: "AI Learning", href: routes.hub },
    ];

    if (current === "learning") {
      trail.push({ label: "Learning" });
    } else if (current === "assessments") {
      trail.push({ label: "Assessments" });
    } else if (current === "results") {
      trail.push({ label: "Assessments", href: routes.assessments });
      trail.push({ label: "Results" });
    } else if (current === "history") {
      trail.push({ label: "Assessments", href: routes.assessments });
      trail.push({ label: "History" });
    } else {
      trail.push({ label: "Assessments", href: routes.assessments });
      trail.push({ label: "Assessment" });
    }

    return (
      <nav
        aria-label="Breadcrumb"
        className={cn(
          "flex flex-wrap items-center gap-1.5 min-w-0 text-xs sm:text-sm",
          className,
        )}
      >
        {trail.map((item, i) => {
          const isLast = i === trail.length - 1;
          return (
            <span
              key={`${item.label}-${i}`}
              className="flex items-center gap-1.5 min-w-0"
            >
              {i > 0 && (
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
              )}
              {isLast || !item.href ? (
                <span
                  className={`truncate ${isLast ? "font-semibold text-slate-800" : "text-slate-400"}`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                >
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    );
  }

  const backHref = current === "learning" ? routes.hub : routes.assessments;
  const backLabel = current === "learning" ? "Courses" : "Assessments";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 min-w-0 text-xs sm:text-sm",
        className,
      )}
    >
      <Link
        href={backHref}
        className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
      >
        <ChevronLeft size={14} />
        {current === "learning" ? backLabel : `Back to ${backLabel}`}
      </Link>
      {courseTitle && current === "learning" && (
        <>
          <ChevronRight size={12} className="text-slate-300 shrink-0" />
          <span className="font-semibold text-slate-800 truncate">
            {courseTitle}
          </span>
        </>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPublishedCoursesPaginated,
  type DBCourse,
} from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";
import { ScrollReveal, ShinyText } from "@/components/ui";
import {
  Layers,
  ArrowRight,
  Star,
  Globe,
  Award,
  BookOpen,
} from "lucide-react";

// Mappings for course levels to badges
const LEVEL_BADGES: Record<string, string> = {
  BEGINNER: "LEARNER",
  INTERMEDIATE: "PROFESSIONAL",
  ADVANCED: "CAREER +",
};

function courseShortDescription(course: DBCourse) {
  const fromApi = course.description?.trim();
  if (!fromApi)
    return "A weekend-first live program with real projects and a certificate.";
  const firstSentence = fromApi.split(/(?<=\.)\s/)[0] ?? fromApi;
  return firstSentence.length > 110
    ? `${firstSentence.slice(0, 107).trimEnd()}…`
    : firstSentence;
}

export function D2HCoursesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["direct2hire-courses-list"],
    queryFn: () => fetchPublishedCoursesPaginated(1, 100),
  });

  const allCourses = data?.data ?? [];

  // Filter for Direct2Hire courses that are published and limit to 3
  const d2hCourses = allCourses
    .filter((c) => c.isDirect2HireCourse && c.isPublished)
    .slice(0, 3);

  if (isLoading) {
    const cachedD2HCoursesCount = allCourses.filter((c) => c.isDirect2HireCourse && c.isPublished).length;
    const skeletonCount = cachedD2HCoursesCount > 0 ? Math.min(cachedD2HCoursesCount, 3) : 2;

    const skeletonGridColsClass =
      skeletonCount === 1
        ? "grid-cols-1 max-w-md mx-auto"
        : skeletonCount === 2
          ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

    return (
      <section className="relative bg-surface-alt px-5 py-12 sm:py-16 border-t border-border">
        <div className="container-x">
          {/* Skeleton Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div className="max-w-3xl space-y-4 animate-pulse">
              <div className="h-6 w-32 bg-slate-200 rounded-full" />
              <div className="h-10 w-2/3 bg-slate-200 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
            </div>
            <div className="hidden lg:flex shrink-0 animate-pulse">
              <div className="h-12 w-40 bg-slate-200 rounded-xl" />
            </div>
          </div>

          {/* Skeleton Cards Grid */}
          <div className={`grid gap-6 sm:gap-8 ${skeletonGridColsClass}`}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="rounded-3xl border border-slate-200 bg-white overflow-hidden animate-pulse p-5 sm:p-6 space-y-4 h-full flex flex-col"
              >
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
            ))}
          </div>

          {/* View all programs button skeleton for mobile/tablet */}
          <div className="flex lg:hidden justify-center mt-10 animate-pulse">
            <div className="h-12 w-40 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (d2hCourses.length === 0) {
    return null; // Don't show the section if no direct2hire courses exist
  }

  // Determine dynamic grid columns based on number of courses
  const gridColsClass =
    d2hCourses.length === 1
      ? "grid-cols-1 max-w-md mx-auto"
      : d2hCourses.length === 2
        ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section
      id="d2h-programs"
      className="relative bg-surface-alt px-5 py-12 sm:py-16 border-t border-border"
    >
      <div className="container-x">
        {/* ── Section Label & Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <ScrollReveal animation="fade-up" className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                <ShinyText
                  text="Direct2Hire Courses"
                  color="#1d4ed8"
                  shineColor="#93c5fd"
                  speed={2.5}
                />
              </span>
            </div>
            <h2 className="h-display text-text max-w-2xl font-bold">
              Find the course that fits your plan.
            </h2>
            <p className="mt-4 text-text-muted text-[15px] sm:text-base leading-relaxed">
              Every course maps to a plan and starts from your assessment.{" "}
              <br className="hidden sm:block" />
              Self-paced and built for beginners, no coding background needed.
            </p>
          </ScrollReveal>

          <ScrollReveal
            animation="fade-up"
            delay={80}
            className="hidden lg:flex shrink-0"
          >
            <Link
              href="/courses"
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200 shadow-xs"
            >
              View all programs
              <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </ScrollReveal>
        </div>

        {/* ── Cards Grid (Responsive Columns Based on Course Count) ── */}
        <div className={`grid gap-6 sm:gap-8 ${gridColsClass}`}>
          {d2hCourses.map((course, i) => {
            const isComingSoon = course.isComingSoon;
            const levelLabel = LEVEL_BADGES[course.level] || course.level;
            const coverImage =
              course.heroImage ||
              course.bannerImage ||
              course.thumbnail ||
              "/placeholder.jpg";
            const shortDescription = courseShortDescription(course);
            const detailHref = `/courses/${course.slug}`;
            const enrollHref = `/courses/${course.slug}/enroll`;

            return (
              <ScrollReveal
                key={course.id}
                animation="fade-up"
                delay={i * 100}
                className="h-full"
              >
                <div className="group relative flex flex-col rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 h-full">
                  {/* ── Thumbnail ── */}
                  <Link
                    href={detailHref}
                    className="relative h-[220px] w-full overflow-hidden bg-slate-50 shrink-0"
                  >
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
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-700 shadow-xs">
                          COMING SOON
                        </span>
                      </div>
                    )}

                    {/* Level badge (bottom right) */}
                    <div className="absolute bottom-3 right-3 bg-[#1d4ed8] text-white text-[10px] font-bold tracking-wider px-3.5 py-1.5 rounded-full shadow-xs uppercase z-10">
                      {levelLabel}
                    </div>
                  </Link>

                  {/* ── Content ── */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <Link href={detailHref} className="block">
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
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {course.title}
                      </h3>

                      <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 mb-4">
                        {shortDescription}
                      </p>
                    </Link>

                    {/* Pills row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4 mt-auto">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-100">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        Hinglish
                      </span>
                      {course.certificate && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-100">
                          <Award className="h-3.5 w-3.5 text-slate-400" />
                          Certificate
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 my-1" />

                    {/* Footer row */}
                    <div className="flex flex-wrap items-center gap-2 pt-3">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 shrink-0">
                        <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-400" />
                        <span>
                          {course.rating ? course.rating.toFixed(1) : "4.8"}
                        </span>
                        <span className="text-slate-400 font-medium text-xs ml-0.5">
                          ({course.reviews || "840 Reviews"})
                        </span>
                      </div>
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-slate-400 hover:text-blue-600 transition-colors duration-250 ml-auto"
                      >
                        View Course
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {isComingSoon ? (
                        <span className="inline-flex items-center justify-center rounded-lg bg-slate-200 px-3.5 py-2 text-[12px] font-semibold text-slate-500 cursor-not-allowed shrink-0">
                          Coming Soon
                        </span>
                      ) : (
                        <Link
                          href={enrollHref}
                          className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-[12px] font-semibold text-white hover:brightness-110 active:scale-95 shadow-sm transition-all duration-200 shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                          }}
                        >
                          Enroll Now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* ── View all programs button for mobile/tablet ── */}
        <ScrollReveal
          animation="fade-up"
          delay={80}
          className="flex lg:hidden justify-center mt-10"
        >
          <Link
            href="/courses"
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-200 shadow-xs"
          >
            View all programs
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

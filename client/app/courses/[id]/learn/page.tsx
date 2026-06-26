"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Video,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  Clock,
  ChevronRight,
  Package,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  downloadResourceFile,
  type DBLesson,
  type DBResource,
} from "@/lib/coursesApi";
import { useLearnCourse } from "@/hooks/queries/useLearnCourse";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

function resourceIcon(category: string) {
  if (category === "VIDEO")
    return <Video size={15} className="text-brand-400 shrink-0" />;
  return <FileText size={15} className="text-white/40 shrink-0" />;
}

function formatSize(bytes?: string) {
  if (!bytes) return null;
  const mb = Number(bytes) / 1024 / 1024;
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${(Number(bytes) / 1024).toFixed(0)} KB`;
}

function ResourceCard({ res }: { res: DBResource }) {
  const isVideo = res.category === "VIDEO";
  const size = formatSize(res.size);
  const embedUrl = res.url;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const ext = isVideo
        ? "mp4"
        : res.url.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i)?.[1]?.toLowerCase();
      const fallbackName = ext ? `${res.title}.${ext}` : res.title;
      await downloadResourceFile(res.id, fallbackName);
    } catch {
      window.alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-white/6 bg-ink-900/60 px-4 py-3
                    hover:border-brand-500/25 hover:bg-ink-900/80 transition-all duration-200 group"
    >
      {/* icon */}
      <div
        className="h-9 w-9 rounded-lg bg-ink-800 border border-white/8 flex items-center justify-center shrink-0
                      group-hover:border-brand-500/20 transition-colors duration-200"
      >
        {resourceIcon(res.category)}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 truncate">
          {res.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            {isVideo
              ? "Video"
              : res.category.charAt(0) + res.category.slice(1).toLowerCase()}
          </span>
          {size && <span className="text-[10px] text-white/25">· {size}</span>}
        </div>
      </div>

      {/* action buttons */}
      <div className="shrink-0 flex items-center gap-2">
        {/* {isVideo && (
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                       border border-white/10 text-white/45
                       hover:border-brand-500/30 hover:text-brand-400
                       transition-all duration-200"
          >
            <Video size={12} /> Watch
          </a>
        )} */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold
                     bg-brand-500/10 border border-brand-500/20 text-brand-400
                     hover:bg-brand-500 hover:border-brand-500 hover:text-ink-950
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
        >
          {downloading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          {downloading ? "Downloading…" : "Download"}
        </button>
      </div>
    </div>
  );
}

export default function LearnPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const [openWeek, setOpenWeek] = useState<string | null>(null);

  // Fetch enrolled course detail using TanStack Query
  const { data: course, isLoading, error, isError } = useLearnCourse(id);

  // Redirect if not authenticated
  if (!user) {
    router.replace("/login");
    return null;
  }

  if (isLoading)
    return (
      <>
        <Navbar />
        <main
          className="min-h-screen"
          style={{
            background:
              "linear-gradient(160deg,#060D1A 0%,#091220 35%,#060D1A 100%)",
          }}
        >
          <div className="container-x py-12 space-y-4 max-w-4xl">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl bg-ink-800 animate-pulse ${i === 0 ? "h-28" : "h-20"}`}
              />
            ))}
          </div>
        </main>
        <Footer />
      </>
    );

  // Handle errors - 403 means not enrolled, redirect to course page
  if (isError) {
    const status = (error as any)?.response?.status;
    const msg =
      (error as any)?.response?.data?.message ??
      error?.message ??
      "Failed to load course.";

    if (status === 403) {
      router.replace(`/courses/${id}`);
      return null;
    }

    return (
      <>
        <Navbar />
        <main
          className="min-h-screen flex items-center justify-center"
          style={{
            background:
              "linear-gradient(160deg,#060D1A 0%,#091220 35%,#060D1A 100%)",
          }}
        >
          <div className="text-center">
            <p className="text-red-400 mb-4">{msg}</p>
            <Link
              href="/courses"
              className="text-brand-400 text-sm hover:text-brand-300"
            >
              ← Back to courses
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!course)
    return (
      <>
        <Navbar />
        <main
          className="min-h-screen flex items-center justify-center"
          style={{
            background:
              "linear-gradient(160deg,#060D1A 0%,#091220 35%,#060D1A 100%)",
          }}
        >
          <div className="text-center">
            <p className="text-red-400 mb-4">Course not found.</p>
            <Link
              href="/courses"
              className="text-brand-400 text-sm hover:text-brand-300"
            >
              ← Back to courses
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );

  // Initialize openWeek on first load
  if (openWeek === null && course.lessons.length > 0) {
    setOpenWeek(course.lessons[0].id);
  }

  const sortedLessons = [...course.lessons].sort(
    (a, b) => a.weekNumber - b.weekNumber,
  );
  const totalResources = sortedLessons.reduce(
    (acc, l) => acc + l.resources.length,
    0,
  );

  return (
    <>
      <Navbar />
      <main
        className="min-h-screen mt-8 text-white"
        style={{
          background:
            "linear-gradient(160deg,#060D1A 0%,#091220 35%,#060D1A 100%)",
        }}
      >
        <div className="container-x py-10 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/35 mb-6">
            <Link
              href="/courses"
              className="hover:text-white/60 transition-colors"
            >
              Courses
            </Link>
            <ChevronRight size={12} />
            <Link
              href={`/courses/${id}`}
              className="hover:text-white/60 transition-colors truncate max-w-48"
            >
              {course.title}
            </Link>
            <ChevronRight size={12} />
            <span className="text-white/55">My Resources</span>
          </div>

          {/* Course header card */}
          <div
            className="rounded-2xl border border-white/6 bg-ink-800 p-6 mb-8"
            style={{ boxShadow: "inset 0 1px 0 rgba(0,200,255,0.06)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle
                    size={14}
                    className="text-emerald-400 shrink-0"
                  />
                  <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                    Enrolled
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white">{course.title}</h1>
                <div className="flex flex-wrap gap-4 text-xs text-white/40 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {course.totalWeeks} weeks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package size={12} />
                    {totalResources} resources
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} />
                    {sortedLessons.length} lessons
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-white/25 uppercase tracking-wider mb-1">
                  Since
                </p>
                <p className="text-sm text-white/60">
                  {new Date(course.enrollment.enrolledAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* No resources at all */}
          {totalResources === 0 && (
            <div className="rounded-2xl border border-white/5 bg-ink-800 py-16 text-center">
              <Package size={32} className="mx-auto text-white/15 mb-3" />
              <p className="text-sm text-white/35">
                No resources have been added yet.
              </p>
              <p className="text-xs text-white/20 mt-1">
                Check back soon — new material will appear here.
              </p>
            </div>
          )}

          {/* Weeks accordion */}
          {totalResources > 0 && (
            <div className="space-y-3">
              {sortedLessons.map((lesson: DBLesson) => {
                const isOpen = openWeek === lesson.id;
                return (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border overflow-hidden transition-colors duration-200"
                    style={{
                      borderColor: isOpen
                        ? "rgba(0,200,255,0.18)"
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Week header */}
                    <button
                      onClick={() => setOpenWeek(isOpen ? null : lesson.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left
                                 hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      <div
                        className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/15
                                      flex items-center justify-center shrink-0"
                      >
                        <span className="text-xs font-bold text-brand-400">
                          {lesson.weekNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white/90 leading-snug">
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="text-xs text-white/35 mt-0.5 line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-white/30 shrink-0">
                        {lesson.resources.length} resource
                        {lesson.resources.length !== 1 ? "s" : ""}
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-white/25 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-400" : ""}`}
                      />
                    </button>

                    {/* Resources grid */}
                    {isOpen && (
                      <div
                        className="px-5 pb-5 pt-1 border-t border-white/5"
                        style={{ background: "rgba(6,13,26,0.4)" }}
                      >
                        {lesson.resources.length === 0 ? (
                          <p className="text-xs text-white/25 py-4 text-center">
                            No resources added for this week yet.
                          </p>
                        ) : (
                          <div className="space-y-2 mt-3">
                            {lesson.resources.map((res: DBResource) => (
                              <ResourceCard key={res.id} res={res} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

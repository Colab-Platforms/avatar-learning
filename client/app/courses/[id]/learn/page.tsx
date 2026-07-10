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
  Lock,
  PlayCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  downloadResourceFile,
  type DBLesson,
  type DBResource,
} from "@/lib/coursesApi";
import { useLearnCourse } from "@/hooks/queries/useLearnCourse";
import { useMarkLessonWatched } from "@/hooks/mutations/useMarkLessonWatched";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

function resourceIcon(category: string) {
  if (category === "VIDEO")
    return <Video size={15} className="text-blue-600 shrink-0" />;
  return <FileText size={15} className="text-slate-400 shrink-0" />;
}

function formatSize(bytes?: string) {
  if (!bytes) return null;
  const mb = Number(bytes) / 1024 / 1024;
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${(Number(bytes) / 1024).toFixed(0)} KB`;
}

function ResourceCard({
  res,
  onWatch,
}: {
  res: DBResource;
  onWatch?: () => void;
}) {
  const isVideo = res.category === "VIDEO";
  const size = formatSize(res.size);
  const [downloading, setDownloading] = useState(false);
  const [playing, setPlaying] = useState(false);

  const handleDownload = async () => {
    if (downloading || !res.url) return;
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

  const handlePlay = () => {
    setPlaying(true);
    onWatch?.();
  };

  return (
    <div
      className="rounded-xl border border-slate-200 px-4 py-3
                    hover:border-blue-500/30 hover:shadow-sm transition-all duration-200 group"
      style={{
        background: "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
      }}
    >
      <div className="flex items-center gap-4">
        {/* icon */}
        <div
          className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0
                        group-hover:border-blue-500/20 transition-colors duration-200"
        >
          {resourceIcon(res.category)}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-750 truncate">
            {res.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {isVideo
                ? "Video"
                : res.category.charAt(0) + res.category.slice(1).toLowerCase()}
            </span>
            {size && (
              <span className="text-[10px] text-slate-400">· {size}</span>
            )}
          </div>
        </div>

        {/* action buttons */}
        <div className="shrink-0 flex items-center gap-2">
          {isVideo && res.url && !playing && (
            <button
              type="button"
              onClick={handlePlay}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold
                         bg-blue-600 border border-blue-600 text-white
                         hover:bg-blue-700 transition-all duration-200 cursor-pointer"
            >
              <PlayCircle size={12} />
              Play
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !res.url}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold
                       bg-blue-50 border border-blue-150 text-blue-600
                       hover:bg-blue-600 hover:border-blue-600 hover:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 cursor-pointer"
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

      {isVideo && playing && res.url && (
        <div className="mt-3 rounded-lg overflow-hidden aspect-video bg-black">
          <iframe
            src={res.url}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      )}
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
  const markWatched = useMarkLessonWatched(id);

  // Redirect if not authenticated
  if (!user) {
    router.replace("/login");
    return null;
  }

  if (isLoading)
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-slate-50">
          <div className="container-x py-12 space-y-4 max-w-4xl">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`rounded-2xl bg-slate-200 animate-pulse ${i === 0 ? "h-28" : "h-20"}`}
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
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="text-red-500 mb-4">{msg}</p>
            <Link
              href="/courses"
              className="text-blue-600 text-sm hover:text-blue-500"
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
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <p className="text-red-500 mb-4">Course not found.</p>
            <Link
              href="/courses"
              className="text-blue-600 text-sm hover:text-blue-500"
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
        className="min-h-screen mt-8 text-slate-800"
        style={{
          background: "linear-gradient(160deg, #F4F8FF 0%, #FFFFFF 35%, #F0F6FF 70%, #F5F9FF 100%)",
        }}
      >
        <div className="container-x py-10 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
            <Link
              href="/courses"
              className="hover:text-slate-700 transition-colors"
            >
              Courses
            </Link>
            <ChevronRight size={12} />
            <Link
              href={`/courses/${id}`}
              className="hover:text-slate-700 transition-colors truncate max-w-48"
            >
              {course.title}
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-655 font-medium">My Resources</span>
          </div>

          {/* Course header card */}
          <div
            className="rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm"
            style={{
              background: "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle
                    size={14}
                    className="text-emerald-600 shrink-0"
                  />
                  <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">
                    Enrolled
                  </span>
                </div>
                <h1 className="text-xl font-bold text-slate-800">{course.title}</h1>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    {course.totalWeeks} weeks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package size={12} className="text-slate-400" />
                    {totalResources} resources
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileText size={12} className="text-slate-400" />
                    {sortedLessons.length} lessons
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                  Since
                </p>
                <p className="text-sm text-slate-600">
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
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <Package size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">
                No resources have been added yet.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Check back soon — new material will appear here.
              </p>
            </div>
          )}

          {/* Weeks accordion */}
          {totalResources > 0 && (
            <div className="space-y-3">
              {sortedLessons.map((lesson: DBLesson) => {
                const isOpen = openWeek === lesson.id;
                const isLocked = !!lesson.isLocked;
                const isCompleted = !!lesson.isCompleted;
                return (
                  <div
                    key={lesson.id}
                    className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${isLocked ? "opacity-60" : ""}`}
                    style={{
                      borderColor: isOpen
                        ? "rgba(37,99,235,0.25)"
                        : "rgba(226,232,240,1)",
                      background: isOpen
                        ? "linear-gradient(145deg, rgba(37,99,235,0.02) 0%, rgba(255,255,255,1) 100%)"
                        : "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                    }}
                  >
                    {/* Week header */}
                    <button
                      onClick={() => setOpenWeek(isOpen ? null : lesson.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left
                                 hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isCompleted
                            ? "bg-emerald-50 border-emerald-100"
                            : "bg-blue-50 border-blue-100"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle size={14} className="text-emerald-600" />
                        ) : (
                          <span className="text-xs font-bold text-blue-600">
                            {lesson.weekNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      {isLocked ? (
                        <Lock size={14} className="text-slate-400 shrink-0" />
                      ) : (
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {lesson.resources.length} resource
                          {lesson.resources.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      <ChevronDown
                        size={15}
                        className={`text-slate-455 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`}
                      />
                    </button>

                    {/* Resources grid */}
                    {isOpen && (
                      <div
                        className="px-5 pb-5 pt-1 border-t border-slate-100"
                        style={{ background: "rgba(248,250,252,0.4)" }}
                      >
                        {isLocked ? (
                          <p className="text-xs text-slate-400 py-4 text-center">
                            Complete the previous session to unlock this one.
                          </p>
                        ) : lesson.resources.length === 0 ? (
                          <p className="text-xs text-slate-400 py-4 text-center">
                            No resources added for this week yet.
                          </p>
                        ) : (
                          <div className="space-y-2 mt-3">
                            {lesson.resources.map((res: DBResource) => (
                              <ResourceCard
                                key={res.id}
                                res={res}
                                onWatch={
                                  isCompleted
                                    ? undefined
                                    : () => markWatched.mutate(lesson.id)
                                }
                              />
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

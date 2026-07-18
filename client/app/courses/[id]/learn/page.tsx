"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Package,
  Lock,
  PlayCircle,
  Menu,
  BookOpen,
  ListChecks,
  Target,
  ClipboardList,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  downloadResourceFile,
  type DBLesson,
  type DBTopic,
  type DBResource,
} from "@/lib/coursesApi";
import { useLearnCourse } from "@/hooks/queries/useLearnCourse";
import { useMarkTopicWatched } from "@/hooks/mutations/useMarkTopicWatched";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDuration(minutes?: number) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function sumDuration(topics: DBTopic[]) {
  const total = topics.reduce((acc, t) => acc + (t.duration ?? 0), 0);
  return total > 0 ? formatDuration(total) : null;
}

function formatSize(bytes?: string) {
  if (!bytes) return null;
  const mb = Number(bytes) / 1024 / 1024;
  return mb >= 1
    ? `${mb.toFixed(1)} MB`
    : `${(Number(bytes) / 1024).toFixed(0)} KB`;
}

function findDefaultTopic(
  lessons: DBLesson[],
): { lessonId: string; topicId: string } | null {
  for (const lesson of lessons) {
    const unlocked = lesson.topics.find((t) => !t.isLocked && !t.isCompleted);
    if (unlocked) return { lessonId: lesson.id, topicId: unlocked.id };
  }
  const first = lessons.find((l) => l.topics.length > 0);
  return first ? { lessonId: first.id, topicId: first.topics[0].id } : null;
}

function ResourceRow({ res }: { res: DBResource }) {
  const size = formatSize(res.size);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading || !res.url) return;
    setDownloading(true);
    try {
      const ext = res.url
        .match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i)?.[1]
        ?.toLowerCase();
      const fallbackName = ext ? `${res.title}.${ext}` : res.title;
      await downloadResourceFile(res.id, fallbackName);
    } catch {
      window.alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-slate-50 transition-colors">
      <FileText size={16} className="text-slate-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">{res.title}</p>
        {size && <p className="text-[11px] text-slate-400">{size}</p>}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading || !res.url}
        className="shrink-0 p-2 text-slate-400 hover:text-brand-600 disabled:opacity-40 transition-colors cursor-pointer"
        aria-label={`Download ${res.title}`}
      >
        {downloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
      </button>
    </div>
  );
}

export default function LearnPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser, hasHydrated } = useAppSelector((s) => s.auth);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Set<string>>(
    new Set(),
  );
  const [playing, setPlaying] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { data: course, isLoading, error, isError } = useLearnCourse(id, {
    enabled: hasHydrated && Boolean(authUser),
  });
  const { data: d2hStatus } = useD2HStatus({
    enabled: hasHydrated && Boolean(authUser),
  });
  const markWatched = useMarkTopicWatched(id);

  const inD2H = !!d2hStatus?.courses.some((c) => c.id === id);
  const sidebarUser = authUser
    ? {
        name:
          `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() ||
          "Student",
        email: authUser.email ?? "",
      }
    : null;

  const sortedLessons = [...(course?.lessons ?? [])]
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .map((l) => ({
      ...l,
      topics: [...l.topics].sort((a, b) => a.topicOrder - b.topicOrder),
    }));

  useEffect(() => {
    if (activeTopicId || sortedLessons.length === 0) return;
    const def = findDefaultTopic(sortedLessons);
    if (def) {
      setActiveLessonId(def.lessonId);
      setActiveTopicId(def.topicId);
      setExpandedLessonIds(new Set(sortedLessons.map((l) => l.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  useEffect(() => {
    setPlaying(false);
  }, [activeTopicId]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    inD2H ? (
      <div className="min-h-screen bg-slate-50 flex">
        <DashboardSidebar
          user={sidebarUser}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="p-1.5 -ml-1.5 text-slate-600"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-slate-700">
              Direct2Hire
            </span>
          </div>
          <main className="flex-1 min-w-0 overflow-auto bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    ) : (
      <>
        <Navbar />
        <main className="min-h-screen mt-8 bg-slate-50">{children}</main>
        <Footer />
      </>
    );

  if (isLoading)
    return (
      <Wrapper>
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 max-w-6xl">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`rounded-2xl bg-slate-200 animate-pulse ${i === 0 ? "h-64" : "h-16"}`}
            />
          ))}
        </div>
      </Wrapper>
    );

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
      <Wrapper>
        <div className="flex items-center justify-center py-24 text-center">
          <div>
            <p className="text-red-500 mb-4">{msg}</p>
            <Link
              href="/courses"
              className="text-brand-600 text-sm hover:text-brand-700"
            >
              ← Back to courses
            </Link>
          </div>
        </div>
      </Wrapper>
    );
  }

  if (!course)
    return (
      <Wrapper>
        <div className="flex items-center justify-center py-24 text-center">
          <div>
            <p className="text-red-500 mb-4">Course not found.</p>
            <Link
              href="/courses"
              className="text-brand-600 text-sm hover:text-brand-700"
            >
              ← Back to courses
            </Link>
          </div>
        </div>
      </Wrapper>
    );

  const currentLesson: DBLesson | undefined = sortedLessons.find(
    (l) => l.id === activeLessonId,
  );
  const currentTopic: DBTopic | undefined = currentLesson?.topics.find(
    (t) => t.id === activeTopicId,
  );

  const flatTopics = sortedLessons.flatMap((l) =>
    l.topics.map((t) => ({ ...t, lessonId: l.id })),
  );
  const currentFlatIndex = flatTopics.findIndex(
    (t) => t.id === currentTopic?.id,
  );
  const nextTopic = flatTopics
    .slice(currentFlatIndex + 1)
    .find((t) => !t.isLocked);
  const prevTopic =
    currentFlatIndex > 0 ? flatTopics[currentFlatIndex - 1] : null;
  const hasLockedTopics = flatTopics.some((t) => t.isLocked);

  const weekCompletedCount = currentLesson?.topics.filter(
    (t) => t.isCompleted,
  ).length ?? 0;
  const weekTotalCount = currentLesson?.topics.length ?? 0;
  const weekProgressPct =
    weekTotalCount > 0
      ? Math.round((weekCompletedCount / weekTotalCount) * 100)
      : 0;

  const mainVideo = currentTopic?.resources.find(
    (r) => r.category === "VIDEO",
  );
  const fileResources =
    currentTopic?.resources.filter((r) => r.category !== "VIDEO") ?? [];

  const backHref = inD2H ? "/dashboard/learning" : "/courses";
  const backLabel = inD2H ? "My Learning" : "Courses";

  const selectTopic = (lessonId: string, topicId: string) => {
    setActiveLessonId(lessonId);
    setActiveTopicId(topicId);
    setExpandedLessonIds((prev) => new Set(prev).add(lessonId));
  };

  const toggleLesson = (lessonId: string) => {
    setExpandedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  return (
    <Wrapper>
      <div
        className={`px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full ${inD2H ? "max-w-[1600px]" : "max-w-6xl mx-auto"}`}
      >
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-1.5 min-w-0 text-xs sm:text-sm">
            <Link
              href={backHref}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            >
              <ChevronLeft size={14} />
              {backLabel}
            </Link>
            <ChevronRight size={12} className="text-slate-300 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">
              {course.title}
            </span>
            {inD2H && (
              <span className="shrink-0 ml-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-semibold uppercase tracking-wide">
                Direct2Hire
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-400">Progress</span>
            <div className="w-24 sm:w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all"
                style={{ width: `${course.enrollment.progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-brand-700">
              {course.enrollment.progress}%
            </span>
          </div>
        </div>

        {flatTopics.length === 0 || !currentTopic || !currentLesson ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <Package size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">
              No topics have been added yet.
            </p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5 lg:gap-6 items-start xl:items-stretch ${inD2H ? "max-w-none" : ""}`}
          >
            {/* Main column — video + topic details + resources */}
            <div className="min-w-0 flex flex-col gap-5 xl:overflow-y-auto xl:overscroll-contain xl:max-h-[calc(100vh-32px)] xl:sticky xl:top-4 xl:pr-1">
              {/* Video player */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 aspect-video shadow-lg ring-1 ring-slate-900/5 shrink-0">
                {mainVideo?.url ? (
                  playing ? (
                    <iframe
                      src={mainVideo.url}
                      className="w-full h-full"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPlaying(true);
                        if (!currentTopic.isCompleted) {
                          markWatched.mutate(currentTopic.id);
                        }
                      }}
                      className="group absolute inset-0 flex flex-col items-center justify-center gap-4 text-white cursor-pointer bg-black/20"
                    >
                      <span className="w-[72px] h-[72px] rounded-full bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center group-hover:scale-105 group-hover:bg-white/25 transition-all duration-300 shadow-xl">
                        <PlayCircle size={36} className="ml-0.5" />
                      </span>
                      <span className="text-sm font-medium px-6 text-center max-w-md leading-relaxed text-white/90">
                        {currentTopic.title}
                      </span>
                    </button>
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/35">
                    <PlayCircle size={40} strokeWidth={1.25} />
                    <span className="text-sm">No video for this topic</span>
                  </div>
                )}
              </div>

              {/* Topic info card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                {/* Title + complete button */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-brand-600 mb-1.5">
                      Week {currentLesson.weekNumber} · {currentLesson.title}
                    </p>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {currentTopic.title}
                    </h1>
                  </div>
                  {currentTopic.isCompleted ? (
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle2 size={14} />
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markWatched.mutate(currentTopic.id)}
                      disabled={markWatched.isPending}
                      className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
                    >
                      {markWatched.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Mark Complete
                    </button>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 mb-4">
                  {formatDuration(currentTopic.duration) && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      {formatDuration(currentTopic.duration)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Package size={13} className="text-slate-400" />
                    {fileResources.length} resource
                    {fileResources.length !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={13} className="text-slate-400" />
                    Topic {currentTopic.topicOrder} of{" "}
                    {currentLesson.topics.length}
                  </span>
                </div>

                {/* Topic description */}
                {currentTopic.description && (
                  <p className="text-sm text-slate-600 leading-relaxed mb-5 pb-5 border-b border-slate-100">
                    {currentTopic.description}
                  </p>
                )}

                {/* Week progress */}
                <div className="mb-5 pb-5 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Week {currentLesson.weekNumber} Progress
                    </span>
                    <span className="text-xs font-semibold text-brand-600 tabular-nums">
                      {weekCompletedCount}/{weekTotalCount} topics · {weekProgressPct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
                      style={{ width: `${weekProgressPct}%` }}
                    />
                  </div>
                </div>

                {/* Lesson description */}
                {currentLesson.description && (
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <Target size={13} />
                      About this week
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {currentLesson.description}
                    </p>
                  </div>
                )}

                {/* Lesson modules / topics covered */}
                {currentLesson.modules && currentLesson.modules.length > 0 && (
                  <div className="mb-5 pb-5 border-b border-slate-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <ListChecks size={13} />
                      Topics covered this week
                    </h3>
                    <ul className="space-y-1.5">
                      {currentLesson.modules.map((mod, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle size={14} className="text-brand-500 mt-0.5 shrink-0" />
                          <span>{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* All topics in this lesson */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <BookOpen size={13} />
                    All topics in Week {currentLesson.weekNumber}
                  </h3>
                  <div className="space-y-1.5">
                    {currentLesson.topics.map((topic) => {
                      const isActive = topic.id === currentTopic.id;
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          disabled={topic.isLocked}
                          onClick={() => selectTopic(currentLesson.id, topic.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all border ${
                            isActive
                              ? "bg-brand-50 border-brand-200 text-brand-800"
                              : topic.isLocked
                                ? "opacity-40 cursor-not-allowed border-slate-100 bg-slate-50"
                                : "border-slate-100 hover:bg-slate-50 cursor-pointer"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                              isActive
                                ? "bg-brand-600 text-white"
                                : topic.isCompleted
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {topic.isLocked ? (
                              <Lock size={9} />
                            ) : topic.isCompleted ? (
                              <CheckCircle size={11} />
                            ) : (
                              topic.topicOrder
                            )}
                          </span>
                          <span className={`flex-1 min-w-0 text-xs leading-snug truncate ${isActive ? "font-semibold text-brand-700" : "text-slate-700"}`}>
                            {topic.title}
                          </span>
                          {formatDuration(topic.duration) && (
                            <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                              {formatDuration(topic.duration)}
                            </span>
                          )}
                          {topic.isCompleted && !isActive && (
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Session Resources */}
              {fileResources.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <Package size={13} />
                      Session Resources
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {fileResources.length} file{fileResources.length !== 1 ? "s" : ""} available for this topic
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {fileResources.map((res) => (
                      <ResourceRow key={res.id} res={res} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel — course outline + resources + nav */}
            <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-0 xl:sticky xl:top-4 xl:max-h-[calc(100vh-32px)] xl:h-[calc(100vh-32px)]">
              {/* Header + progress */}
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Course Content
                  </h3>
                  <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                    {flatTopics.filter((t) => t.isCompleted).length}/
                    {flatTopics.length}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${course.enrollment.progress}%` }}
                  />
                </div>
              </div>

              {/* Scrollable topic tree */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1">
                {sortedLessons.map((lesson) => {
                  const isExpanded = expandedLessonIds.has(lesson.id);
                  const completedCount = lesson.topics.filter(
                    (t) => t.isCompleted,
                  ).length;
                  const durationLabel = sumDuration(lesson.topics);
                  const weekProgress =
                    lesson.topics.length > 0
                      ? Math.round(
                          (completedCount / lesson.topics.length) * 100,
                        )
                      : 0;

                  return (
                    <div
                      key={lesson.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => toggleLesson(lesson.id)}
                        className="w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-slate-50/80 transition-colors"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-[11px] font-bold">
                          {lesson.weekNumber}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">
                            {lesson.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {completedCount}/{lesson.topics.length} topics
                            {durationLabel ? ` · ${durationLabel}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {weekProgress === 100 && (
                            <CheckCircle
                              size={14}
                              className="text-emerald-500"
                            />
                          )}
                          <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="pb-2 bg-slate-50/50">
                          {lesson.topics.length === 0 ? (
                            <p className="pl-14 pr-4 py-2 text-[11px] text-slate-400">
                              No topics yet.
                            </p>
                          ) : (
                            lesson.topics.map((topic) => {
                              const isActive = topic.id === currentTopic.id;
                              const dur = formatDuration(topic.duration);
                              return (
                                <button
                                  key={topic.id}
                                  type="button"
                                  disabled={topic.isLocked}
                                  onClick={() =>
                                    selectTopic(lesson.id, topic.id)
                                  }
                                  className={`w-full flex items-center gap-2.5 pl-14 pr-4 py-2.5 text-left transition-all duration-150 border-l-2 ${
                                    isActive
                                      ? "bg-brand-600 text-white border-brand-400 shadow-sm"
                                      : topic.isLocked
                                        ? "opacity-45 cursor-not-allowed border-transparent"
                                        : "hover:bg-white border-transparent cursor-pointer"
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                      isActive
                                        ? "bg-white/20 text-white"
                                        : topic.isCompleted
                                          ? "bg-emerald-100 text-emerald-600"
                                          : "bg-white border border-slate-200 text-slate-500"
                                    }`}
                                  >
                                    {topic.isLocked ? (
                                      <Lock size={10} />
                                    ) : topic.isCompleted ? (
                                      <CheckCircle size={11} />
                                    ) : (
                                      topic.topicOrder
                                    )}
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    <span
                                      className={`block text-xs leading-snug line-clamp-2 ${isActive ? "text-white font-medium" : "text-slate-700"}`}
                                    >
                                      {topic.title}
                                    </span>
                                  </span>
                                  {dur && (
                                    <span
                                      className={`shrink-0 text-[10px] tabular-nums ${isActive ? "text-white/75" : "text-slate-400"}`}
                                    >
                                      {dur}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer nav */}
              <div className="shrink-0 px-4 sm:px-5 py-4 border-t border-slate-100 space-y-2.5 bg-white rounded-b-2xl">
                {hasLockedTopics && (
                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    Topics unlock as you complete each one.
                  </p>
                )}
                {nextTopic ? (
                  <button
                    type="button"
                    onClick={() =>
                      selectTopic(nextTopic.lessonId, nextTopic.id)
                    }
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors cursor-pointer shadow-sm"
                  >
                    Next Topic
                    <ChevronRight size={14} />
                  </button>
                ) : course.enrollment.progress === 100 ? (
                  <Link
                    href={`/courses/${id}/assessment`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors cursor-pointer shadow-sm"
                  >
                    <ClipboardList size={14} />
                    Take Course Assessment
                  </Link>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-1">
                    {currentFlatIndex === flatTopics.length - 1
                      ? "You've reached the last topic."
                      : "Complete this topic to continue."}
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

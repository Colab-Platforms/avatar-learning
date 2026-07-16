"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  GraduationCap,
  Loader2,
  ArrowRight,
  Lock,
  Clock,
  Flame,
  BookOpen,
  Target,
  Play,
  Check,
  MessageCircleHeart,
  Briefcase,
  Trophy,
  ClipboardList,
  Gift,
  Share2,
} from "lucide-react";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useCounsellingProfile } from "@/hooks/queries/useCounsellingProfile";
import { useCounsellingBooking } from "@/hooks/queries/useCounsellingBooking";
import { useCourseSelection } from "@/hooks/queries/useCourseSelection";
import { useInternshipTasks } from "@/hooks/queries/useInternshipTasks";
import { usePlacementAssessment } from "@/hooks/queries/usePlacementAssessment";
import { useLearnCourse } from "@/hooks/queries/useLearnCourse";
import { useAppSelector } from "@/store/hooks";
import PretextAnimatedHeight, {
  AnimatedHeight,
} from "@/components/counselling/PretextAnimatedHeight";
import { cn } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const { user } = useAppSelector((s) => s.auth);

  // ─── QUERY HOOKS ────────────────────────────────────────────────────────────
  const { data: d2hStatus, isLoading: d2hLoading } = useD2HStatus();
  const { data: counsellingData, isLoading: profileLoading } =
    useCounsellingProfile();
  const { data: booking, isLoading: bookingLoading } = useCounsellingBooking();
  const { data: selection, isLoading: selectionLoading } = useCourseSelection();
  const { data: internshipDashboard, isLoading: internshipLoading } =
    useInternshipTasks();

  const courseId = selection?.selectedCourse?.id ?? "";
  const { data: placement, isLoading: placementLoading } =
    usePlacementAssessment(courseId);

  const activeCourseSummary = useMemo(() => {
    return (
      d2hStatus?.courses.find((c) => c.enrolled && !c.isCompleted) ??
      d2hStatus?.courses.find((c) => c.enrolled) ??
      d2hStatus?.courses[0]
    );
  }, [d2hStatus]);

  const { data: courseDetail, isLoading: courseLoading } = useLearnCourse(
    activeCourseSummary?.id ?? "",
  );

  // ─── LOCAL STATE FOR GREETING ───────────────────────────────────────────────
  const [timeOfDay, setTimeOfDay] = useState("evening");
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) setTimeOfDay("morning");
    else if (hr >= 12 && hr < 17) setTimeOfDay("afternoon");
    else if (hr >= 17 && hr < 22) setTimeOfDay("evening");
    else setTimeOfDay("night");
  }, []);

  const firstName = user?.firstName || "there";

  // ─── DYNAMIC PROGRESS & PILLARS CALCULATIONS ───────────────────────────────
  const profile = counsellingData?.profile ?? null;
  const recommendation = counsellingData?.recommendation ?? null;

  const hasAssessment = !!profile?.isSubmitted;
  const assessmentProgress = hasAssessment ? 100 : 0;

  const hasCounselling = !!(
    booking?.counsellingCompleted || selection?.selectedCourseId
  );
  const counsellingProgress = hasCounselling
    ? 100
    : booking?.scheduledAt
      ? 50
      : 0;

  const learningProgress = activeCourseSummary?.progress ?? 0;
  const hasLearning = !!(
    activeCourseSummary?.isCompleted || learningProgress === 100
  );

  const internshipProgressData = internshipDashboard?.progress;
  const totalInternshipTasks = internshipProgressData?.total ?? 0;
  const approvedInternshipTasks = internshipProgressData?.approved ?? 0;
  const internshipProgress =
    totalInternshipTasks > 0
      ? Math.round((approvedInternshipTasks / totalInternshipTasks) * 100)
      : 0;
  const hasInternship =
    totalInternshipTasks > 0 &&
    approvedInternshipTasks === totalInternshipTasks;

  const hasPlacement = !!placement?.hasPassed;
  const placementProgress = hasPlacement
    ? 100
    : placement?.latestAttempt
      ? 50
      : 0;

  // Overall calculations
  const overallProgress = Math.round(
    (assessmentProgress +
      counsellingProgress +
      learningProgress +
      internshipProgress +
      placementProgress) /
      5,
  );

  const completedMilestones = useMemo(() => {
    let count = 0;
    if (assessmentProgress === 100) count++;
    if (counsellingProgress === 100) count++;
    if (learningProgress === 100) count++;
    if (internshipProgress === 100) count++;
    if (placementProgress === 100) count++;
    return count;
  }, [
    assessmentProgress,
    counsellingProgress,
    learningProgress,
    internshipProgress,
    placementProgress,
  ]);

  // ─── DYNAMIC TEXTS & CONTEXTUAL CTA ──────────────────────────────────────────
  const encouragementText = useMemo(() => {
    if (!hasAssessment) {
      return "Get started by completing your AI Assessment. It takes just 5 minutes and helps us recommend the perfect Direct2Hire learning path for you!";
    }
    if (!hasCounselling) {
      if (booking?.status === "CONFIRMED") {
        const dateStr = booking.scheduledAt
          ? new Date(booking.scheduledAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "soon";
        return `Your 1-on-1 career counselling session is booked for ${dateStr}. Attend the meeting to select and unlock your course!`;
      }
      if (booking?.status === "PENDING") {
        return "Your counselling session request is pending confirmation. We will verify and confirm your slot within 24 hours.";
      }
      return "Your AI Assessment is complete! Now, book your 1-on-1 counselling session with a mentor to confirm your course selection.";
    }
    if (!hasLearning) {
      return `You're on track. Complete the sessions and modules in "${activeCourseSummary?.title || "AI Fundamentals"}" to unlock your hands-on internship!`;
    }
    if (!hasInternship) {
      return `Awesome job completing your courses! Now work on your weekly internship tasks. Get all tasks approved to earn your internship certificate.`;
    }
    if (!hasPlacement) {
      return "Fantastic! You've finished your learning and internship. Take the Placement Assessment and unlock mock interviews with industry experts.";
    }
    return "Congratulations! You have completed all the milestones of the Direct2Hire program. You are fully ready for placement opportunities!";
  }, [
    hasAssessment,
    hasCounselling,
    booking,
    hasLearning,
    activeCourseSummary,
    hasInternship,
    hasPlacement,
  ]);

  const heroPrimaryAction = useMemo(() => {
    if (!hasAssessment) {
      return { label: "Start Assessment", href: "/dashboard/assessment" };
    }
    if (!hasCounselling) {
      return { label: "Book Counselling", href: "/dashboard/counselling" };
    }
    if (!hasLearning) {
      return {
        label: "Resume Learning",
        href: activeCourseSummary
          ? `/courses/${activeCourseSummary.id}/learn`
          : "/dashboard/learning",
      };
    }
    if (!hasInternship) {
      return {
        label: "Go to Internship Tasks",
        href: "/dashboard/internships",
      };
    }
    return { label: "Start Mock Interview", href: "/dashboard/placement" };
  }, [
    hasAssessment,
    hasCounselling,
    hasLearning,
    hasInternship,
    activeCourseSummary,
  ]);

  // ─── JOURNEY TIMELINE CONFIG ────────────────────────────────────────────────
  const timelineSteps = useMemo(() => {
    return [
      {
        number: 1,
        title: "AI Assessment",
        statusText: hasAssessment
          ? `Completed - Recommended: ${recommendation?.recommendedCourseTitle || "AI Fundamentals"}`
          : "Get started with your profile mapping",
        completed: hasAssessment,
        active: !hasAssessment,
        locked: false,
        href: "/dashboard/assessment",
        icon: ClipboardList,
      },
      {
        number: 2,
        title: "1-on-1 Counselling",
        statusText: hasCounselling
          ? "Session completed & course selected"
          : booking?.status === "CONFIRMED"
            ? `Session booked - ${booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}`
            : booking?.status === "PENDING"
              ? "Session requested - Pending confirmation"
              : hasAssessment
                ? "Book your slot with a career advisor"
                : "Complete assessment first",
        completed: hasCounselling,
        active: hasAssessment && !hasCounselling,
        locked: !hasAssessment,
        href: "/dashboard/counselling",
        icon: MessageCircleHeart,
      },
      {
        number: 3,
        title: "AI Learning",
        statusText: hasLearning
          ? "Syllabus completed!"
          : hasCounselling
            ? `${learningProgress}% completed - In progress`
            : "Unlock after counselling",
        completed: hasLearning,
        active: hasCounselling && !hasLearning,
        locked: !hasCounselling,
        href: "/dashboard/learning",
        icon: GraduationCap,
      },
      {
        number: 4,
        title: "Internship",
        statusText: hasInternship
          ? "All weekly tasks approved!"
          : hasLearning
            ? `${approvedInternshipTasks} of ${totalInternshipTasks} tasks approved`
            : "Unlock after completing course",
        completed: hasInternship,
        active: hasLearning && !hasInternship,
        locked: !hasLearning,
        href: "/dashboard/internships",
        icon: Briefcase,
      },
      {
        number: 5,
        title: "Placement",
        statusText: hasPlacement
          ? "Assessment passed - Ready for placement!"
          : placement?.mockInterviewUnlocked
            ? "Mock Interview unlocked"
            : hasInternship
              ? "Placement assessment unlocked"
              : "Complete internship first",
        completed: hasPlacement,
        active: hasInternship && !hasPlacement,
        locked: !hasInternship,
        href: "/dashboard/placement",
        icon: Trophy,
      },
    ];
  }, [
    hasAssessment,
    recommendation,
    hasCounselling,
    booking,
    hasLearning,
    learningProgress,
    hasInternship,
    approvedInternshipTasks,
    totalInternshipTasks,
    hasPlacement,
    placement,
  ]);

  // ─── STATS ROW CONFIG ───────────────────────────────────────────────────────
  const lessons = useMemo(() => courseDetail?.lessons ?? [], [courseDetail]);
  const completedMinutes = useMemo(() => {
    return lessons.reduce(
      (sum, l) =>
        sum +
        l.topics.reduce(
          (s, t) => s + (t.isCompleted ? (t.duration ?? 0) : 0),
          0,
        ),
      0,
    );
  }, [lessons]);

  const timeInvestedHours = useMemo(() => {
    if (!hasCounselling) return "0.0";
    return (7.5 + completedMinutes / 60).toFixed(1);
  }, [hasCounselling, completedMinutes]);

  const totalSessions = lessons.length || 8;
  const completedSessions = useMemo(() => {
    return lessons.filter((l) => {
      const total = l.topics.length;
      const done = l.topics.filter((t) => t.isCompleted).length;
      return total > 0 && done === total;
    }).length;
  }, [lessons]);

  const statsList = useMemo(() => {
    const score = placement?.highestScore
      ? `${placement.highestScore}%`
      : hasAssessment
        ? "82%"
        : "—";
    return [
      {
        label: "Learning Streak",
        value: "12 days",
        icon: Flame,
        color: "text-orange-500 bg-orange-50",
      },
      {
        label: "Time Invested",
        value: `${timeInvestedHours} hrs`,
        icon: Clock,
        color: "text-blue-500 bg-blue-50",
      },
      {
        label: "Sessions Done",
        value: hasCounselling
          ? `${completedSessions} / ${totalSessions}`
          : "0 / 8",
        icon: BookOpen,
        color: "text-emerald-500 bg-emerald-50",
      },
      {
        label: "Assessment Score",
        value: score,
        icon: Target,
        color: "text-purple-500 bg-purple-50",
      },
    ];
  }, [
    timeInvestedHours,
    completedSessions,
    totalSessions,
    placement,
    hasAssessment,
    hasCounselling,
  ]);

  // ─── ACTIVE LESSON FOR LEARNING SECTION ─────────────────────────────────────
  const activeLesson = useMemo(() => {
    return (
      lessons.find((l) => {
        const total = l.topics.length;
        const done = l.topics.filter((t) => t.isCompleted).length;
        return total === 0 || done < total;
      }) ?? lessons[0]
    );
  }, [lessons]);

  // ─── LOADING STATE RENDER ──────────────────────────────────────────────────
  const isDashboardLoading =
    d2hLoading ||
    profileLoading ||
    bookingLoading ||
    selectionLoading ||
    internshipLoading ||
    (!!courseId && placementLoading) ||
    (!!activeCourseSummary?.id && courseLoading);

  if (isDashboardLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-44 rounded-2xl bg-slate-200/50 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-slate-200/50 animate-pulse"
            />
          ))}
        </div>
        <div className="h-32 rounded-2xl bg-slate-200/50 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 rounded-2xl bg-slate-200/50 animate-pulse" />
          <div className="lg:col-span-4 h-80 rounded-2xl bg-slate-200/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* ─── HERO BANNER CARD ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10">
        {/* Decorative Grid Overlays */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-4 text-left">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-blue-200 uppercase backdrop-blur-xs">
              Direct2Hire Programme
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good {timeOfDay},{" "}
              <span className="text-blue-200">{firstName}</span>
            </h1>

            {/* PretextAnimatedHeight wraps the encouraging progression description */}
            <PretextAnimatedHeight
              text={encouragementText}
              font="14px Inter"
              lineHeight={20}
              className="text-blue-100/90 text-sm max-w-xl"
            >
              <div>{encouragementText}</div>
            </PretextAnimatedHeight>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={heroPrimaryAction.href}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 transition-all hover:bg-blue-50 hover:scale-[1.02] shadow-sm shadow-black/10 active:scale-[0.98]"
              >
                {heroPrimaryAction.label}
                <ArrowRight size={16} className="text-blue-800" />
              </Link>
              {hasAssessment && !hasCounselling && (
                <Link
                  href="/dashboard/assessment"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/15 active:scale-[0.98]"
                >
                  View Assessment Recommendation
                </Link>
              )}
            </div>
          </div>

          {/* SVG Progress Circle Card */}
          <div className="shrink-0 flex items-center gap-5 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-white/10"
                  strokeWidth="5.5"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-white transition-all duration-700 ease-out"
                  strokeWidth="5.5"
                  fill="transparent"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * overallProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-lg font-extrabold leading-none">
                  {overallProgress}%
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                Overall Programme
              </p>
              <p className="text-xl font-extrabold mt-0.5 leading-none">
                {completedMilestones}{" "}
                <span className="text-xs text-blue-200 font-normal">
                  / 5 Milestones
                </span>
              </p>
              <p className="text-[10px] text-blue-100/70 mt-1 font-medium">
                {completedMilestones} pillars fully completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── STATS ROW ───────────────────────────────────────────────────────── */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map((stat, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5"
          >
            <div className="space-y-1.5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>
              <p className="text-2xl font-black tracking-tight text-slate-800">
                {stat.value}
              </p>
            </div>
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-350 group-hover:scale-110",
                stat.color,
              )}
            >
              <stat.icon size={18} />
            </div>
          </div>
        ))}
      </div> */}

      {/* ─── 5-PILLAR JOURNEY PROGRESS ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="text-left">
            <h2 className="text-base font-bold text-slate-900">Your Journey</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Five milestones from assessment to job placement
            </p>
          </div>
          <Link
            href="/dashboard/learning"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            View roadmap <ArrowRight size={13} />
          </Link>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {timelineSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.number}
                href={step.href}
                className={cn(
                  "relative flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 select-none group min-h-[140px]",
                  step.completed
                    ? "border-emerald-200 bg-emerald-50/15 hover:border-emerald-300 hover:shadow-xs"
                    : step.active
                      ? "border-blue-600 bg-blue-50/10 shadow-sm shadow-blue-500/5 ring-1 ring-blue-600/10 hover:border-blue-700"
                      : "border-slate-100 bg-slate-50/50 opacity-70 cursor-not-allowed pointer-events-none",
                )}
              >
                {/* Badge Tag */}
                <div className="flex items-center justify-between mb-3.5">
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md",
                      step.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : step.active
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {step.completed
                      ? "Complete"
                      : step.active
                        ? "Active"
                        : "Locked"}
                  </span>

                  {step.completed ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  ) : step.active ? (
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Icon size={12} />
                    </div>
                  ) : (
                    <Lock size={12} className="text-slate-400 shrink-0" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">
                    STEP {step.number}
                  </p>
                  <h3
                    className={cn(
                      "text-sm font-bold tracking-tight",
                      step.completed
                        ? "text-slate-800"
                        : step.active
                          ? "text-blue-950"
                          : "text-slate-500",
                    )}
                  >
                    {step.title}
                  </h3>

                  {/* AnimatedHeight measures actual DOM content, completely preventing text cutoffs */}
                  <AnimatedHeight className="pt-1">
                    <p
                      className={cn(
                        "text-[11px] leading-normal font-medium",
                        step.completed
                          ? "text-emerald-700"
                          : step.active
                            ? "text-blue-700/80"
                            : "text-slate-400",
                      )}
                    >
                      {step.statusText}
                    </p>
                  </AnimatedHeight>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── DETAILED SUBPANELS GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Continue Learning controller card (Col: 8) */}
        <div className="lg:col-span-8 space-y-3 flex flex-col text-left">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-800">
              Continue Learning
            </h2>
            {activeCourseSummary && (
              <Link
                href={`/courses/${activeCourseSummary.id}/learn`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                Go to syllabus <ArrowRight size={12} />
              </Link>
            )}
          </div>

          {activeCourseSummary && hasCounselling ? (
            <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-5 flex flex-col justify-between">
              {/* Media controller card layout */}
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Media screen */}
                <div className="relative w-full sm:w-56 h-36 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center group shadow-inner">
                  {activeCourseSummary.slug ===
                  "ai-fundamentals-chatgpt-mastery" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/landingpage-images/Avatar_logo_Light.svg"
                      alt="AI Fundamentals"
                      className="w-28 h-auto opacity-35 object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/landingpage-images/Avatar_logo_Light.svg"
                      alt="Social Media Executives"
                      className="w-28 h-auto opacity-35 object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Link
                      href={`/courses/${activeCourseSummary.id}/learn`}
                      className="w-12 h-12 rounded-full bg-white text-blue-900 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                      aria-label="Play lesson"
                    >
                      <Play size={18} fill="currentColor" className="ml-1" />
                    </Link>
                  </div>

                  <span className="absolute left-3 top-3 bg-red-600/90 text-white font-bold text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">
                    Now Playing
                  </span>

                  <span className="absolute right-3 bottom-3 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-sm font-semibold">
                    {activeLesson ? "Live/Recorded" : "Finished"}
                  </span>
                </div>

                {/* Lesson detail */}
                <div className="flex-1 space-y-3 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {learningProgress}% completed
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight line-clamp-1">
                      {activeCourseSummary.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      {activeLesson
                        ? `Session ${activeLesson.weekNumber}: ${activeLesson.title}`
                        : "All sessions completed!"}
                    </p>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1.5">
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${learningProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions checklist capsules */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Syllabus Sessions
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {lessons.slice(0, 4).map((l) => {
                    const isSessionDone =
                      l.topics.length > 0 &&
                      l.topics.filter((t) => t.isCompleted).length ===
                        l.topics.length;
                    const isSessionActive = activeLesson?.id === l.id;
                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${activeCourseSummary.id}/learn`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition border select-none",
                          isSessionDone
                            ? "bg-emerald-50/30 text-emerald-700 border-emerald-100 hover:bg-emerald-50/50"
                            : isSessionActive
                              ? "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                              : "bg-slate-50/50 text-slate-400 border-slate-100 hover:bg-slate-50",
                        )}
                      >
                        {isSessionDone ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <Check size={9} strokeWidth={3} />
                          </div>
                        ) : (
                          <span className="w-3.5 h-3.5 text-[9px] rounded-full border border-slate-300 flex items-center justify-center shrink-0 font-bold">
                            {l.weekNumber}
                          </span>
                        )}
                        <span className="truncate">Session {l.weekNumber}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center py-12">
              <GraduationCap className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">
                Course syllabus locked
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Complete your AI Assessment and 1-on-1 Counselling session to
                select and unlock your course path.
              </p>
              <Link
                href="/dashboard/counselling"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/10"
              >
                Go to Counselling <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Column 2: Refer and Earn card (Col: 4) */}
        <div className="lg:col-span-4 space-y-3 flex flex-col text-left">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-800">
              Refer & Earn
            </h2>
            <Gift size={14} className="text-slate-400" />
          </div>

          <div className="relative flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between overflow-hidden min-h-[300px] group">
            {/* Background design elements */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-xl -z-10 opacity-70 group-hover:scale-110 transition-transform duration-500" />

            {/* Top header information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 tracking-wider">
                  Coming Soon
                </span>
                <Share2
                  size={16}
                  className="text-slate-300 group-hover:text-blue-500 transition-colors"
                />
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-slate-800">
                Refer and Earn Rewards!
              </h3>
              <p className="text-xs leading-relaxed text-slate-500  font-semibold">
                Get{" "}
                <span className="text-blue-600 font-bold">
                  ₹500 cash rewards
                </span>{" "}
                for every friend who registers and joins Direct2Hire. Plus, your
                friends get a special{" "}
                <span className="text-emerald-600 font-bold">10% discount</span>{" "}
                on their enrollment.
              </p>
            </div>

            {/* Middle: Mock Referral stats */}
            {/* <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 my-4">
              <div className="text-left space-y-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Invited Friends
                </p>
                <p className="text-lg font-black text-slate-800">
                  0{" "}
                  <span className="text-[10px] font-normal text-slate-400">
                    referred
                  </span>
                </p>
              </div>
              <div className="text-left space-y-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Earned
                </p>
                <p className="text-lg font-black text-emerald-600">₹0</p>
              </div>
            </div> */}

            {/* Bottom: Apply Now button */}
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed text-xs font-bold py-2.5 transition active:scale-[0.99]"
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* ─── ROW 2 SUBPANELS GRID ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {/* Panel 1: Internship Progress */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Internship Progress
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {approvedInternshipTasks} / {totalInternshipTasks || 8} Approved
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Complete 8 weekly tasks to earn your certificate
            </p>
          </div>

          {hasCounselling ? (
            <>
              {/* Progress Line */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalInternshipTasks > 0 ? (approvedInternshipTasks / totalInternshipTasks) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5">
                <div className="rounded-xl border border-slate-100 bg-[#E8F8F2]/60 px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Approved
                  </p>
                  <p className="text-base font-black text-[#00A86B] mt-0.5">
                    {internshipProgressData?.approved ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-[#FFF9EC]/60 px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Review
                  </p>
                  <p className="text-base font-black text-[#F59E0B] mt-0.5">
                    {internshipProgressData?.underReview ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-[#EEF4FF]/60 px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Progress
                  </p>
                  <p className="text-base font-black text-[#3B82F6] mt-0.5">
                    {internshipProgressData?.available ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    Upcoming
                  </p>
                  <p className="text-base font-black text-slate-500 mt-0.5">
                    {internshipProgressData?.locked ?? 8}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/internships"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold py-2.5 transition active:scale-[0.99]"
              >
                Go to Internship Tasks
                <ArrowRight size={12} className="text-slate-600" />
              </Link>
            </>
          ) : (
            <div className="rounded-2xl bg-slate-50/50 border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
              <Lock className="w-6 h-6 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Internship tasks will unlock after completing courses
              </p>
            </div>
          )}
        </div>

        {/* Panel 2: Pre-Placement Preparation */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Pre-Placement Preparation
            </h3>
            <p className="text-xs text-slate-400">
              Pass assessment and mock interview to unlock job matches
            </p>
          </div>

          {hasInternship ? (
            <>
              <div className="flex items-center gap-4 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Target size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">
                    Placement Assessment
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {hasPlacement
                      ? "Assessment passed successfully!"
                      : "Prepare and take the final placement quiz"}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 border",
                    hasPlacement
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200",
                  )}
                >
                  {hasPlacement ? "Passed" : "Ready"}
                </span>
              </div>

              <Link
                href="/dashboard/placement"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 transition active:scale-[0.99] shadow-sm shadow-blue-500/10"
              >
                {hasPlacement
                  ? "Go to Placement Panel"
                  : "Start Mock Interview"}
                <ArrowRight size={12} />
              </Link>
            </>
          ) : (
            <div className="rounded-2xl bg-slate-50/50 border border-slate-100 p-6 flex flex-col items-center justify-center text-center">
              <Lock className="w-6 h-6 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Placement assessment unlocks after finishing internship
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

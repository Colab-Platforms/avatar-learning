"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  LayoutGrid,
  MessageCircleHeart,
  ClipboardCheck,
  GraduationCap,
  Briefcase,
  Trophy,
  ArrowLeft,
  X,
  ChevronDown,
  BookOpen,
  ClipboardList,
  Lock,
  Award,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useCounsellingProfile } from "@/hooks/queries/useCounsellingProfile";
import { useCounsellingBooking } from "@/hooks/queries/useCounsellingBooking";
import { useCourseSelection } from "@/hooks/queries/useCourseSelection";
import { useInternshipTasks } from "@/hooks/queries/useInternshipTasks";
import { useAssessments } from "@/hooks/queries/useAssessment";
import {
  useEnrollmentTier,
  useMyEnrollments,
} from "@/hooks/queries/useMyEnrollments";
import {
  courseIdFromDashboardLearningPath,
  d2hLearningRoutes,
  isAssessmentsSubpath,
  isLearningSubpath,
} from "@/lib/learningRoutes";
import {
  MY_COURSES_ROUTE,
  basicCourseRoutes,
  courseIdFromPathname,
  dashboardRoutes,
  trackFromSearchParams,
} from "@/lib/dashboardRoutes";
import type { CourseTier } from "@/lib/coursesApi";

/** Dev escape hatch: set NEXT_PUBLIC_D2H_DEV_UNLOCK=true to skip the step-lock gate entirely. */
const DEV_UNLOCK = process.env.NEXT_PUBLIC_D2H_DEV_UNLOCK === "true";

const STEP_ORDER = [
  "/dashboard/assessment",
  "/dashboard/counselling",
  "ai-learning",
  "/dashboard/internships",
  "/dashboard/placement",
] as const;

/** Steps that additionally require full ₹999 Direct2Hire access, regardless of progression. */
const FULL_ACCESS_STEPS = new Set<string>([
  "ai-learning",
  "/dashboard/internships",
  "/dashboard/placement",
]);

/** Returns, for each step id/href in STEP_ORDER, whether it is locked (previous step not yet completed, or — for learning/internship/placement — full programme not yet purchased). */
function useStepLocks(activeCourseId: string | null): Record<string, boolean> {
  const { data: counsellingData } = useCounsellingProfile();
  const profile = counsellingData?.profile ?? null;
  const { data: booking } = useCounsellingBooking();
  const { data: selection } = useCourseSelection();
  const { data: internshipDashboard } = useInternshipTasks();
  // Only used here to derive a pass/fail flag for the step-lock chain — no
  // need to hit the network on every dashboard navigation.
  const { data: assessments } = useAssessments(activeCourseId ?? "", {
    staleTime: 60_000,
  });
  const { data: d2hStatus } = useD2HStatus();

  return useMemo(() => {
    if (DEV_UNLOCK) {
      return Object.fromEntries(STEP_ORDER.map((id) => [id, false]));
    }

    const hasFullAccess = d2hStatus?.enrollment?.status === "PAID";
    const hasAssessment = !!profile?.isSubmitted;
    const hasCounselling = !!(
      booking?.counsellingCompleted || selection?.selectedCourseId
    );
    const finalAssessment = assessments?.find((a) => a.type === "FINAL");
    const hasLearning = finalAssessment?.status === "PASSED";
    const internshipProgress = internshipDashboard?.progress;
    const hasInternship =
      !!internshipProgress &&
      internshipProgress.total > 0 &&
      internshipProgress.approved === internshipProgress.total;

    const completed = [
      true, // assessment is always the entry step
      hasAssessment,
      hasCounselling,
      hasLearning,
      hasInternship,
    ];

    return Object.fromEntries(
      STEP_ORDER.map((id, i) => [
        id,
        !completed[i] || (FULL_ACCESS_STEPS.has(id) && !hasFullAccess),
      ]),
    );
  }, [
    d2hStatus?.enrollment?.status,
    profile,
    booking?.counsellingCompleted,
    selection?.selectedCourseId,
    assessments,
    internshipDashboard?.progress,
  ]);
}

type NavLeaf = {
  kind: "link";
  href: string;
  /**
   * Stable identity for the step-lock lookup. Hrefs now carry the course id,
   * so they can no longer double as lock keys — STEP_ORDER stays flat.
   */
  stepId?: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

type NavGroup = {
  kind: "group";
  id: string;
  label: string;
  icon: typeof GraduationCap;
  href: string;
  children: { href: string; label: string; icon: typeof BookOpen; match: "learn" | "assessments" }[];
};

type NavItem = NavLeaf | NavGroup;

function useActiveCourseId(pathname: string): string | null {
  // A /dashboard/<courseId>/... route names the course outright; the learning
  // subtree keeps its own scheme; only fall back to defaults when the path
  // says nothing (e.g. the My Courses grid itself).
  const fromRoute = courseIdFromPathname(pathname);
  const fromPath = fromRoute ?? courseIdFromDashboardLearningPath(pathname);
  const { data: enrollments } = useMyEnrollments();
  const { data: status } = useD2HStatus();

  return useMemo(() => {
    if (fromPath) return fromPath;
    // On the My Courses grid itself we intentionally return null so the sidebar
    // renders its "no course" variant instead of guessing.
    if (pathname === MY_COURSES_ROUTE) return null;
    const activeEnrollment =
      enrollments?.find((e) => !e.isCompleted) ?? enrollments?.[0];
    if (activeEnrollment) return activeEnrollment.course.slug;
    const active =
      status?.courses.find((c) => c.enrolled && !c.isCompleted) ??
      status?.courses.find((c) => c.enrolled) ??
      status?.courses[0];
    return active?.id ?? null;
  }, [fromPath, pathname, enrollments, status?.courses]);
}

type SidebarVariant = "my-courses" | "basic" | "d2h";

function resolveVariant(
  pathname: string,
  courseId: string | null,
  tier: CourseTier | null,
  requestedTrack: "BASIC" | "D2H" | null,
): SidebarVariant {
  if (pathname === MY_COURSES_ROUTE || !courseId) return "my-courses";
  // A student who owns both plans is wherever ?track= says; the Basic-only
  // pages under /dashboard/<course>/learn are Basic regardless.
  if (requestedTrack === "BASIC") return "basic";
  if (requestedTrack === "D2H") return "d2h";
  if (tier === "BASIC") return "basic";
  if (tier === "BOTH" && isBasicOnlyPath(pathname, courseId)) return "basic";
  return "d2h";
}

/** The two routes that exist only in the Basic track. */
function isBasicOnlyPath(pathname: string, courseId: string): boolean {
  return (
    pathname === `/dashboard/${courseId}/learn` ||
    pathname.startsWith(`/dashboard/${courseId}/learn/`) ||
    pathname === `/dashboard/${courseId}/certificate`
  );
}

export function buildDashboardNav(
  courseId: string | null,
  variant: SidebarVariant,
): NavItem[] {
  const myCoursesLink: NavItem = {
    kind: "link",
    href: MY_COURSES_ROUTE,
    label: "My Courses",
    icon: LayoutGrid,
    exact: true,
  };

  if (variant === "my-courses" || !courseId) {
    return [myCoursesLink];
  }

  if (variant === "basic") {
    const basic = basicCourseRoutes(courseId);
    return [
      myCoursesLink,
      {
        kind: "link",
        href: basic.learn,
        label: "Learning",
        icon: BookOpen,
        exact: false,
      },
      {
        kind: "link",
        href: basic.certificate,
        label: "Certification",
        icon: Award,
        exact: false,
      },
    ];
  }

  const learningRoutes = d2hLearningRoutes(courseId);
  const routes = dashboardRoutes(courseId);

  return [
    myCoursesLink,
    {
      kind: "link",
      href: routes.root,
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      kind: "link",
      href: routes.assessment,
      stepId: "/dashboard/assessment",
      label: "AI Assessment",
      icon: ClipboardCheck,
      exact: false,
    },
    {
      kind: "link",
      href: routes.counselling,
      stepId: "/dashboard/counselling",
      label: "Counselling",
      icon: MessageCircleHeart,
      exact: false,
    },
    {
      kind: "group",
      id: "ai-learning",
      label: "AI Learning",
      icon: GraduationCap,
      href: "/dashboard/learning",
      children: [
        {
          href: learningRoutes.learn,
          label: "Learning",
          icon: BookOpen,
          match: "learn",
        },
        {
          href: learningRoutes.assessments,
          label: "Assessments",
          icon: ClipboardList,
          match: "assessments",
        },
      ],
    },
    {
      kind: "link",
      href: routes.internships,
      stepId: "/dashboard/internships",
      label: "Internships",
      icon: Briefcase,
      exact: false,
    },
    {
      kind: "link",
      href: routes.placement,
      stepId: "/dashboard/placement",
      label: "Job Placement",
      icon: Trophy,
      exact: false,
    },
  ];
}

interface DashboardSidebarProps {
  user: {
    name: string;
    email: string;
    profileImage?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({
  user,
  mobileOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const courseId = useActiveCourseId(pathname);
  const { isLoading: enrollmentsLoading } = useMyEnrollments();
  const tier = useEnrollmentTier(courseId);
  const showSkeleton =
    !!courseId &&
    enrollmentsLoading &&
    tier === null &&
    pathname !== MY_COURSES_ROUTE;
  const variant = resolveVariant(
    pathname,
    courseId,
    tier,
    trackFromSearchParams(useSearchParams()),
  );
  const nav = useMemo(
    () => buildDashboardNav(courseId, variant),
    [courseId, variant],
  );
  // Step-locks are D2H-only; BASIC and the My Courses grid always render
  // everything unlocked, so skip the (expensive) query fan-out for them.
  const d2hStepLocks = useStepLocks(
    !showSkeleton && variant === "d2h" ? courseId : null,
  );
  const stepLocks = variant === "d2h" ? d2hStepLocks : {};

  const learningActive =
    pathname === "/dashboard/learning" ||
    pathname.startsWith("/dashboard/learning/");
  const learnChildActive = isLearningSubpath(pathname);
  const assessmentsChildActive = isAssessmentsSubpath(pathname);

  const [learningOpen, setLearningOpen] = useState(learningActive);

  useEffect(() => {
    if (learningActive) setLearningOpen(true);
  }, [learningActive]);

  const sectionLabel =
    variant === "basic"
      ? "Course"
      : variant === "d2h"
        ? "Direct2Hire"
        : "Dashboard";

  // Hrefs carry ?track=, which is not part of the path being matched.
  const isLinkActive = (href: string, exact?: boolean) => {
    const path = href.split("?")[0];
    return exact
      ? pathname === path
      : pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-60 shrink-0 bg-ink-900 border-r border-white/5 flex flex-col h-screen
                    fixed lg:sticky top-0 z-50 lg:z-auto transition-transform duration-250
                    ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
          <Link
            href="/"
            className="group shrink-0 flex items-center transition-opacity duration-250 hover:opacity-80"
            aria-label="Avatar India home"
          >
            <Image
              src="/landingpage-images/Avatar_logo_Light.svg"
              alt="Avatar-India Logo"
              width={119}
              height={32}
              className="h-7 w-auto transition-transform duration-350 group-hover:scale-[1.02]"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-white/40 hover:text-white/80 p-1"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
            {showSkeleton ? (
              <span className="inline-block h-2 w-16 rounded bg-white/8 animate-pulse align-middle" />
            ) : (
              sectionLabel
            )}
          </p>
          {showSkeleton && (
            <>
              <Link
                href={MY_COURSES_ROUTE}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isLinkActive(MY_COURSES_ROUTE, true)
                    ? "bg-brand-500/8 text-brand-400 border border-brand-500/18"
                    : "text-white/45 hover:text-white/80 hover:bg-white/4 border border-transparent"
                }`}
              >
                <LayoutGrid size={16} className="text-white/35" />
                My Courses
              </Link>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent"
                >
                  <div className="w-4 h-4 rounded bg-white/8 animate-pulse" />
                  <div
                    className="h-2.5 rounded bg-white/8 animate-pulse"
                    style={{ width: `${72 - i * 6}px` }}
                  />
                </div>
              ))}
            </>
          )}
          {!showSkeleton && nav.map((item) => {
            if (item.kind === "link") {
              const active = isLinkActive(item.href, item.exact);
              const locked = stepLocks[item.stepId ?? item.href] ?? false;
              const Icon = item.icon;

              if (locked) {
                return (
                  <div
                    key={item.href}
                    aria-disabled="true"
                    title={
                      FULL_ACCESS_STEPS.has(item.href)
                        ? "Upgrade to the full programme to unlock"
                        : "Complete the previous step to unlock"
                    }
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/20 border border-transparent cursor-not-allowed select-none"
                  >
                    <Icon size={16} className="text-white/15" />
                    {item.label}
                    <Lock size={13} className="ml-auto text-white/20" />
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-brand-500/8 text-brand-400 border border-brand-500/18"
                      : "text-white/45 hover:text-white/80 hover:bg-white/4 border border-transparent"
                  }`}
                >
                  <Icon
                    size={16}
                    className={active ? "text-brand-400" : "text-white/35"}
                  />
                  {item.label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                  )}
                </Link>
              );
            }

            const Icon = item.icon;
            const groupActive = learningActive;
            const groupLocked = stepLocks[item.id] ?? false;

            if (groupLocked) {
              return (
                <div
                  key={item.id}
                  aria-disabled="true"
                  title={
                    FULL_ACCESS_STEPS.has(item.id)
                      ? "Upgrade to the full programme to unlock"
                      : "Complete the previous step to unlock"
                  }
                  className="pt-0.5 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/20 border border-transparent cursor-not-allowed select-none"
                >
                  <Icon size={16} className="text-white/15" />
                  {item.label}
                  <Lock size={13} className="ml-auto text-white/20" />
                </div>
              );
            }

            return (
              <div key={item.id} className="pt-0.5">
                <div
                  className={`flex items-center rounded-xl border transition-all duration-150 ${
                    groupActive && !learnChildActive && !assessmentsChildActive
                      ? "bg-brand-500/8 text-brand-400 border-brand-500/18"
                      : groupActive
                        ? "border-transparent text-brand-400"
                        : "border-transparent text-white/45"
                  }`}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-l-xl transition-colors ${
                      groupActive
                        ? "text-brand-400"
                        : "hover:text-white/80 hover:bg-white/4"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={groupActive ? "text-brand-400" : "text-white/35"}
                    />
                    {item.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setLearningOpen((o) => !o)}
                    className="px-2.5 py-2.5 text-white/35 hover:text-white/70 rounded-r-xl"
                    aria-label={learningOpen ? "Collapse AI Learning" : "Expand AI Learning"}
                    aria-expanded={learningOpen}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${learningOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {learningOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-white/8 space-y-0.5">
                    {item.children.map((child) => {
                      const childActive =
                        child.match === "learn"
                          ? learnChildActive
                          : assessmentsChildActive;
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                            childActive
                              ? "bg-brand-500/10 text-brand-400"
                              : "text-white/40 hover:text-white/75 hover:bg-white/4"
                          }`}
                        >
                          <ChildIcon
                            size={14}
                            className={
                              childActive ? "text-brand-400" : "text-white/30"
                            }
                          />
                          {child.label}
                          {childActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          {user && (
            <Link
              href="/profile"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
                isLinkActive("/profile", false)
                  ? "bg-brand-500/8 text-brand-400 border-brand-500/18"
                  : "border-transparent text-white/45 hover:text-white/80 hover:bg-white/4 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              <UserAvatar
                profileImage={user.profileImage}
                firstName={user.firstName ?? null}
                lastName={user.lastName ?? null}
                email={user.email}
                size="xs"
                showSkeleton
              />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold truncate transition-colors duration-300 ${
                  isLinkActive("/profile", false) ? "text-brand-400" : "text-white/75"
                }`}>
                  {user.name}
                </p>
                <p className={`text-[10px] truncate transition-colors duration-300 ${
                  isLinkActive("/profile", false) ? "text-brand-400/70" : "text-white/30"
                }`}>
                  {user.email}
                </p>
              </div>
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/35 hover:text-white/60 hover:bg-white/4 transition-all"
          >
            <ArrowLeft size={13} />
            Back to site
          </Link>
        </div>
      </aside>
    </>
  );
}

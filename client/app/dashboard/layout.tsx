"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader2, Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  useEnrollmentTier,
  useEnrollmentTracks,
  useMyEnrollments,
} from "@/hooks/queries/useMyEnrollments";
import {
  MY_COURSES_ROUTE,
  basicCourseRoutes,
  courseIdFromPathname,
  dashboardRoutes,
  requiredTrackForPath,
  trackFromSearchParams,
} from "@/lib/dashboardRoutes";
import { courseIdFromDashboardLearningPath } from "@/lib/learningRoutes";
import type { RootState } from "@/store";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { user: authUser, hasHydrated } = useSelector(
    (state: RootState) => state.auth,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // The learning subtree names its course by id under a different prefix, so
  // both schemes have to be consulted or the guard below sees no course at all.
  const activeCourseId =
    pathname === MY_COURSES_ROUTE
      ? null
      : (courseIdFromPathname(pathname) ??
        courseIdFromDashboardLearningPath(pathname));
  // isFetching (not isLoading) so the guard also waits for background
  // refetches after a payment invalidation — otherwise it fires against
  // stale cache and bounces a just-enrolled user back to the course page.
  const { isFetching: enrollmentsFetching } = useMyEnrollments();
  const tier = useEnrollmentTier(activeCourseId);
  const notEnrolled =
    !!activeCourseId && !enrollmentsFetching && tier === null;
  // Only block on the *first* resolution of enrollment (tier still unknown) —
  // once we have it, keep rendering through background refetches (e.g. the
  // invalidation a "mark topic watched" mutation triggers), or the player
  // gets torn down and the video restarts.
  const enrollmentPending =
    !!activeCourseId && tier === null && enrollmentsFetching;
  // Track protection: a plan the student did not buy must not open, whichever
  // direction they came from. The server refuses the data too; this keeps them
  // out of the shell rather than dropping them on an error state.
  const requiredTrack = requiredTrackForPath(
    pathname,
    activeCourseId,
    trackFromSearchParams(searchParams),
  );
  const ownedTracks = useEnrollmentTracks(activeCourseId);
  const trackDenied =
    !!activeCourseId &&
    !!requiredTrack &&
    !enrollmentPending &&
    ownedTracks.length > 0 &&
    !ownedTracks.some((t) => t.track === requiredTrack);

  const mobileHeaderLabel =
    pathname === MY_COURSES_ROUTE
      ? "My Courses"
      : tier === "BASIC"
        ? "Course"
        : "Direct2Hire";

  useEffect(() => {
    if (!mounted || !hasHydrated) return;
    if (!authUser) {
      router.replace("/login");
      return;
    }
    if (authUser.profileCompleted === false) {
      router.replace("/complete-profile");
      return;
    }
    if (notEnrolled && activeCourseId) {
      router.replace(`/courses/${activeCourseId}`);
      return;
    }
    if (trackDenied && activeCourseId) {
      // Send them to the plan they do own rather than to a dead end.
      const owned = ownedTracks[0]?.track;
      router.replace(
        owned === "BASIC"
          ? basicCourseRoutes(activeCourseId).root
          : owned === "D2H"
            ? dashboardRoutes(activeCourseId).root
            : MY_COURSES_ROUTE,
      );
    }
  }, [
    mounted,
    hasHydrated,
    authUser,
    notEnrolled,
    trackDenied,
    ownedTracks,
    activeCourseId,
    router,
  ]);

  const authorized = mounted && hasHydrated && Boolean(authUser);
  const user = authUser
    ? {
        name:
          `${authUser.firstName ?? ""} ${authUser.lastName ?? ""}`.trim() ||
          "Student",
        email: authUser.email ?? "",
        profileImage: authUser.profileImage,
        firstName: authUser.firstName,
        lastName: authUser.lastName,
      }
    : null;

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar
        user={user}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* ── Content ─────────────────────────────────── */}
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
            {mobileHeaderLabel}
          </span>
        </div>
        <main className="flex-1 min-w-0 overflow-auto">
          {enrollmentPending || trackDenied ? (
            <div className="flex min-h-full items-center justify-center py-40">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

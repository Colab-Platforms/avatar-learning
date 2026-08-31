"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader2, Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import {
  useEnrollmentTier,
  useMyEnrollments,
} from "@/hooks/queries/useMyEnrollments";
import {
  MY_COURSES_ROUTE,
  courseIdFromPathname,
} from "@/lib/dashboardRoutes";
import type { RootState } from "@/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: authUser, hasHydrated } = useSelector(
    (state: RootState) => state.auth,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeCourseId =
    pathname === MY_COURSES_ROUTE ? null : courseIdFromPathname(pathname);
  // isFetching (not isLoading) so the guard also waits for background
  // refetches after a payment invalidation — otherwise it fires against
  // stale cache and bounces a just-enrolled user back to the course page.
  const { isFetching: enrollmentsFetching } = useMyEnrollments();
  const tier = useEnrollmentTier(activeCourseId);
  const notEnrolled =
    !!activeCourseId && !enrollmentsFetching && tier === null;
  const enrollmentPending =
    !!activeCourseId && (enrollmentsFetching || tier === null);
  const mobileHeaderLabel =
    pathname === MY_COURSES_ROUTE
      ? "My Courses"
      : tier === "BASIC"
        ? "Course"
        : "Direct2Hire";

  useEffect(() => {
    if (!hasHydrated) return;
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
    }
  }, [hasHydrated, authUser, notEnrolled, activeCourseId, router]);

  const authorized = hasHydrated && Boolean(authUser);
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
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
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
          {enrollmentPending ? (
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

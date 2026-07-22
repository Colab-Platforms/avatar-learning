"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Link from "next/link";
import { GraduationCap, Menu } from "lucide-react";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { RootState } from "@/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user: authUser, hasHydrated } = useSelector(
    (state: RootState) => state.auth,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { data: d2hStatus, isLoading: d2hLoading } = useD2HStatus({
    enabled: hasHydrated && Boolean(authUser),
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!authUser) {
      router.replace("/login");
    }
  }, [hasHydrated, authUser, router]);

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

  if (!authorized || d2hLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (d2hStatus?.enrollment?.status !== "PAID") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lime-50 px-6">
        <div className="max-w-md text-center">
          <GraduationCap size={36} className="mx-auto text-brand-400 mb-4" />
          <h1 className="text-lg font-bold text-black mb-2">
            Direct2Hire dashboard locked
          </h1>
          <p className="text-sm text-black/45 mb-6">
            This dashboard is only available to enrolled Direct2Hire students.
            Complete your enrollment to unlock AI assessment, counselling,
            learning, internship, and placement tracking.
          </p>
          <Link
            href="/direct2hire/enroll"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-ink-950 text-sm font-semibold hover:bg-brand-400 transition-colors"
          >
            Complete enrollment
          </Link>
        </div>
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
            Direct2Hire
          </span>
        </div>
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

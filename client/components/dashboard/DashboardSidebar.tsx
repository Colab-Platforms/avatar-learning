"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  UserCircle,
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
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import {
  courseIdFromDashboardLearningPath,
  d2hLearningRoutes,
  isAssessmentsSubpath,
  isLearningSubpath,
} from "@/lib/learningRoutes";

type NavLeaf = {
  kind: "link";
  href: string;
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
  const fromPath = courseIdFromDashboardLearningPath(pathname);
  const { data: status } = useD2HStatus();

  return useMemo(() => {
    if (fromPath) return fromPath;
    const active =
      status?.courses.find((c) => c.enrolled && !c.isCompleted) ??
      status?.courses.find((c) => c.enrolled) ??
      status?.courses[0];
    return active?.id ?? null;
  }, [fromPath, status?.courses]);
}

export function buildDashboardNav(courseId: string | null): NavItem[] {
  const learningRoutes = courseId ? d2hLearningRoutes(courseId) : null;

  return [
    {
      kind: "link",
      href: "/profile",
      label: "Personal Details",
      icon: UserCircle,
      exact: false,
    },
    {
      kind: "link",
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      kind: "link",
      href: "/dashboard/assessment",
      label: "AI Assessment",
      icon: ClipboardCheck,
      exact: false,
    },
    {
      kind: "link",
      href: "/dashboard/counselling",
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
          href: learningRoutes?.learn ?? "/dashboard/learning",
          label: "Learning",
          icon: BookOpen,
          match: "learn",
        },
        {
          href: learningRoutes?.assessments ?? "/dashboard/learning",
          label: "Assessments",
          icon: ClipboardList,
          match: "assessments",
        },
      ],
    },
    {
      kind: "link",
      href: "/dashboard/internships",
      label: "Internships",
      icon: Briefcase,
      exact: false,
    },
    {
      kind: "link",
      href: "/dashboard/placement",
      label: "Job Placement",
      icon: Trophy,
      exact: false,
    },
  ];
}

/** Flat list kept for any consumers that still import DASHBOARD_NAV. */
export const DASHBOARD_NAV = [
  { href: "/profile", label: "Personal Details", icon: UserCircle, exact: false },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/assessment", label: "AI Assessment", icon: ClipboardCheck, exact: false },
  { href: "/dashboard/counselling", label: "Counselling", icon: MessageCircleHeart, exact: false },
  { href: "/dashboard/learning", label: "AI Learning", icon: GraduationCap, exact: false },
  { href: "/dashboard/internships", label: "Internships", icon: Briefcase, exact: false },
  { href: "/dashboard/placement", label: "Job Placement", icon: Trophy, exact: false },
];

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
  const nav = useMemo(() => buildDashboardNav(courseId), [courseId]);

  const learningActive =
    pathname === "/dashboard/learning" ||
    pathname.startsWith("/dashboard/learning/");
  const learnChildActive = isLearningSubpath(pathname);
  const assessmentsChildActive = isAssessmentsSubpath(pathname);

  const [learningOpen, setLearningOpen] = useState(learningActive);

  useEffect(() => {
    if (learningActive) setLearningOpen(true);
  }, [learningActive]);

  const isLinkActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

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
            Direct2Hire
          </p>
          {nav.map((item) => {
            if (item.kind === "link") {
              const active = isLinkActive(item.href, item.exact);
              const Icon = item.icon;
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
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <UserAvatar
                profileImage={user.profileImage}
                firstName={user.firstName ?? null}
                lastName={user.lastName ?? null}
                email={user.email}
                size="xs"
                showSkeleton
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white/75 truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-white/30 truncate">
                  {user.email}
                </p>
              </div>
            </div>
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

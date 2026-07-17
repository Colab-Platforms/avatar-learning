"use client";

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
} from "lucide-react";

export const DASHBOARD_NAV = [
  {
    href: "/profile",
    label: "Personal Details",
    icon: UserCircle,
    exact: false,
  },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/dashboard/assessment",
    label: "AI Assessment",
    icon: ClipboardCheck,
    exact: false,
  },
  {
    href: "/dashboard/counselling",
    label: "Counselling",
    icon: MessageCircleHeart,
    exact: false,
  },
  {
    href: "/dashboard/learning",
    label: "AI Learning",
    icon: GraduationCap,
    exact: false,
  },
  {
    href: "/dashboard/internships",
    label: "Internships",
    icon: Briefcase,
    exact: false,
  },
  {
    href: "/dashboard/placement",
    label: "Job Placement",
    icon: Trophy,
    exact: false,
  },
];

interface DashboardSidebarProps {
  user: { name: string; email: string } | null;
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({
  user,
  mobileOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile scrim */}
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
        {/* Brand */}
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
            Direct2Hire
          </p>
          {DASHBOARD_NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
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
                {label}
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + back */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-brand-400 to-elec-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                {user.name[0]?.toUpperCase()}
              </div>
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

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  UserCircle,
  MessageCircleHeart,
  ClipboardCheck,
  GraduationCap,
  Briefcase,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";

const NAV = [
  {
    href: "/profile",
    label: "Personal Details",
    icon: UserCircle,
    exact: false,
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null,
  );
  const { data: d2hStatus, isLoading: d2hLoading } = useD2HStatus();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) {
        router.replace("/login");
        return;
      }
      const { user: u } = JSON.parse(raw);
      if (!u) {
        router.replace("/login");
        return;
      }
      setAuthorized(true);
      setUser({
        name: `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "Student",
        email: u?.email ?? "",
      });
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!authorized || d2hLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (d2hStatus?.enrollment.status !== "PAID") {
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

  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-ink-900 border-r border-white/5 flex flex-col h-screen sticky top-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
            Direct2Hire
          </p>
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
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

      {/* ── Content ─────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}

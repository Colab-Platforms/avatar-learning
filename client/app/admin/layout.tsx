"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  Briefcase,
  Landmark,
  GraduationCap,
  ArrowLeft,
  MessageSquare,
  Handshake,
  Users,
  ChevronDown,
  Video,
  Tag,
  CalendarClock,
} from "lucide-react";
import { fetchContactUnreadCount } from "@/lib/adminApi";
import Image from "next/image";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

type NavLink = {
  kind: "link";
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
};

type NavGroup = {
  kind: "group";
  id: string;
  label: string;
  icon: typeof GraduationCap;
  href: string;
  children: {
    href: string;
    label: string;
    icon: typeof Users;
  }[];
};

type NavItem = NavLink | NavGroup;

const NAV: NavItem[] = [
  { kind: "link", href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  {
    kind: "link",
    href: "/admin/categories",
    label: "Categories",
    icon: FolderOpen,
    exact: false,
  },
  { kind: "link", href: "/admin/courses", label: "Courses", icon: BookOpen, exact: false },
  {
    kind: "link",
    href: "/admin/internships",
    label: "Internships",
    icon: Briefcase,
    exact: false,
  },
  {
    kind: "group",
    id: "direct2hire",
    label: "Direct2Hire",
    icon: GraduationCap,
    href: "/admin/direct2hire/enrollments",
    children: [
      {
        href: "/admin/direct2hire/enrollments",
        label: "Enrollments",
        icon: Users,
      },
      {
        href: "/admin/direct2hire/assessment-counselling",
        label: "Assessment + Counselling",
        icon: Tag,
      },
      {
        href: "/admin/direct2hire/intro-video",
        label: "Intro Video",
        icon: Video,
      },
    ],
  },
  {
    kind: "link",
    href: "/admin/coupons",
    label: "Coupons",
    icon: Tag,
    exact: false,
  },
  {
    kind: "group",
    id: "webinar",
    label: "Webinar",
    icon: Video,
    href: "/admin/webinar",
    children: [
      {
        href: "/admin/webinar",
        label: "Registrations",
        icon: Users,
      },
      {
        href: "/admin/webinar/schedule",
        label: "Schedule",
        icon: CalendarClock,
      },
    ],
  },
  {
    kind: "link",
    href: "/admin/investors",
    label: "Investors",
    icon: Landmark,
    exact: false,
  },
  {
    kind: "link",
    href: "/admin/contacts",
    label: "Contacts",
    icon: MessageSquare,
    exact: false,
  },
  {
    kind: "link",
    href: "/admin/partners",
    label: "Partners",
    icon: Handshake,
    exact: false,
  },
  {
    kind: "link",
    href: "/admin/users",
    label: "Users",
    icon: Users,
    exact: false,
  },
];

export default function AdminLayout({
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
  const [contactUnread, setContactUnread] = useState(0);

  const groupItems = NAV.filter((item): item is NavGroup => item.kind === "group");
  const groupActiveMap = Object.fromEntries(
    groupItems.map((g) => [
      g.id,
      pathname === g.href ||
        pathname.startsWith(g.href + "/") ||
        g.children.some((c) => pathname === c.href || pathname.startsWith(c.href + "/")),
    ]),
  );
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(groupActiveMap);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const [id, active] of Object.entries(groupActiveMap)) {
        if (active) next[id] = true;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) {
        router.replace("/login");
        return;
      }
      const { accessToken, user: u } = JSON.parse(raw);
      const payload = accessToken ? decodeJwtPayload(accessToken) : null;
      const role = payload?.role as string | undefined;
      if (role === "ADMIN" || role === "SUPERADMIN") {
        setAuthorized(true);
        setUser({
          name: `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "Admin",
          email: u?.email ?? "",
        });
      } else {
        router.replace("/");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Poll unread contact count every 30s once authorized
  useEffect(() => {
    if (!authorized) return;
    const fetchUnread = () =>
      fetchContactUnreadCount().then(setContactUnread).catch(() => {});
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, [authorized]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string, exact: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/");

  const isChildActive = (href: string, siblingHrefs: string[]) => {
    if (pathname === href) return true;
    if (pathname.startsWith(href + "/")) {
      const hasMoreSpecificSibling = siblingHrefs.some(
        (sh) => sh !== href && (pathname === sh || pathname.startsWith(sh + "/"))
      );
      return !hasMoreSpecificSibling;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-ink-950 flex">
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
            Menu
          </p>
          {NAV.map((item) => {
            if (item.kind === "link") {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              const isContacts = item.href === "/admin/contacts";
              const badge = isContacts && contactUnread > 0 ? contactUnread : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                  {badge > 0 ? (
                    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-brand-500 text-ink-950">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : active ? (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                  ) : null}
                </Link>
              );
            }

            const Icon = item.icon;
            const groupActive = groupActiveMap[item.id];
            const groupOpen = openGroups[item.id] ?? groupActive;

            return (
              <div key={item.id} className="pt-0.5">
                <div
                  className={`flex items-center rounded-xl border transition-all duration-150 ${
                    groupActive
                      ? "border-transparent text-brand-400"
                      : "border-transparent text-white/45"
                  }`}
                >
                  <Link
                    href={item.href}
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
                    onClick={() =>
                      setOpenGroups((prev) => ({ ...prev, [item.id]: !groupOpen }))
                    }
                    className="px-2.5 py-2.5 text-white/35 hover:text-white/70 rounded-r-xl"
                    aria-label={groupOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                    aria-expanded={groupOpen}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${groupOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>

                {groupOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-white/8 space-y-0.5">
                    {item.children.map((child) => {
                      const active = isChildActive(
                        child.href,
                        item.children.map((c) => c.href)
                      );
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                            active
                              ? "bg-brand-500/8 text-brand-400"
                              : "text-white/40 hover:text-white/75 hover:bg-white/4"
                          }`}
                        >
                          <ChildIcon
                            size={14}
                            className={active ? "text-brand-400" : "text-white/30"}
                          />
                          {child.label}
                          {active && (
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

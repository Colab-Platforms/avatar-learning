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
  Clapperboard,
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

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: FolderOpen,
    exact: false,
  },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, exact: false },
  {
    href: "/admin/intro-video",
    label: "Intro Video",
    icon: Clapperboard,
    exact: false,
  },
  {
    href: "/admin/internships",
    label: "Internships",
    icon: Briefcase,
    exact: false,
  },
  {
    href: "/admin/direct2hire",
    label: "Direct2Hire",
    icon: GraduationCap,
    exact: false,
  },
  {
    href: "/admin/investors",
    label: "Investors",
    icon: Landmark,
    exact: false,
  },
  {
    href: "/admin/contacts",
    label: "Contacts",
    icon: MessageSquare,
    exact: false,
  },
  {
    href: "/admin/partners",
    label: "Partners",
    icon: Handshake,
    exact: false,
  },
  {
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
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const isContacts = href === "/admin/contacts";
            const badge = isContacts && contactUnread > 0 ? contactUnread : 0;
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
                {badge > 0 ? (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-brand-500 text-ink-950">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : active ? (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                ) : null}
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

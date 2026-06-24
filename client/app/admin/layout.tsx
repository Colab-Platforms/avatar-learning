"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FolderOpen, BookOpen, ArrowLeft } from "lucide-react";

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
    { href: "/admin/categories", label: "Categories", icon: FolderOpen, exact: false },
    { href: "/admin/courses", label: "Courses", icon: BookOpen, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("auth");
            if (!raw) { router.replace("/login"); return; }
            const { accessToken, user: u } = JSON.parse(raw);
            const payload = accessToken ? decodeJwtPayload(accessToken) : null;
            const role = payload?.role as string | undefined;
            if (role === "ADMIN" || role === "SUPERADMIN") {
                setAuthorized(true);
                setUser({ name: `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "Admin", email: u?.email ?? "" });
            } else {
                router.replace("/");
            }
        } catch {
            router.replace("/login");
        }
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ink-950">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

    return (
        <div className="min-h-screen bg-ink-950 flex">
            {/* ── Sidebar ─────────────────────────────────── */}
            <aside className="w-60 shrink-0 bg-ink-900 border-r border-white/5 flex flex-col h-screen sticky top-0">
                {/* Brand */}
                <div className="px-5 py-5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-brand-500 font-bold text-lg tracking-tight">Avatar</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 tracking-widest uppercase">
                            Admin
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <p className="px-3 pb-2 text-[10px] font-semibold text-white/25 uppercase tracking-widest">
                        Menu
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
                                <p className="text-xs font-semibold text-white/75 truncate">{user.name}</p>
                                <p className="text-[10px] text-white/30 truncate">{user.email}</p>
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
            <main className="flex-1 min-w-0 overflow-auto">
                {children}
            </main>
        </div>
    );
}

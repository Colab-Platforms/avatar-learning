"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LockKeyhole, Menu, X } from "lucide-react";
import type { BusinessAdminMe } from "@/lib/businessAdminApi";
import { BASE, BUSINESS_NAV, isNavActive, navFor } from "./nav";
import { ThemeToggle, useBusinessTheme } from "./theme";

const MeContext = createContext<{ me: BusinessAdminMe; name: string; email: string } | null>(null);

/** Current Business Admin identity. Only available inside the guarded layout. */
export function useBusinessAdmin() {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error("useBusinessAdmin must be used inside the Business Admin layout");
  return ctx;
}

const roleLabel = (me: BusinessAdminMe) => (me.isSuperAdmin ? "Super admin" : "Business admin");

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { name, me } = useBusinessAdmin();
  const items = navFor(me.modules);
  const { theme } = useBusinessTheme();
  return (
    <>
      <div className="px-5 py-5 border-b border-white/5">
        <Link href={items[0]?.href ?? BASE} onClick={onNavigate} className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Avatar Adaption Business Admin home">
          <Image
            src={theme === "light" ? "/landingpage-images/Avatar_dark_logo.png" : "/landingpage-images/Avatar_logo_Light.svg"}
            alt="Avatar India"
            width={119}
            height={32}
            className="h-7 w-auto"
            priority
          />
        </Link>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-brand-400">Adaption · Business Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Business Admin">
        {items.map((item) => {
          const active = isNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                active
                  ? "bg-brand-500/8 text-brand-400 border-brand-500/18"
                  : "text-white/45 hover:text-white/80 hover:bg-white/4 border-transparent"
              }`}
            >
              <Icon size={16} className={active ? "text-brand-400" : "text-white/35"} />
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-brand-400 to-elec-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {(name[0] ?? "A").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white/75 truncate">{name}</p>
            <p className="text-[10px] text-white/30 truncate">{roleLabel(me)}</p>
          </div>
        </div>
        <Link
          href="/learning"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/35 hover:text-white/60 hover:bg-white/4 transition-all"
        >
          <ArrowLeft size={13} />
          Back to site
        </Link>
      </div>
    </>
  );
}

/** Shown instead of a page the person has no permission for (the API refuses the same requests independently). */
function NoPermission() {
  const { me } = useBusinessAdmin();
  const first = navFor(me.modules)[0];
  return (
    <div role="alert" data-testid="no-permission" className="mx-auto mt-16 max-w-md rounded-2xl border border-white/6 bg-ink-900 p-8 text-center">
      <LockKeyhole className="mx-auto mb-4 text-amber-400" size={30} />
      <h1 className="text-lg font-semibold text-white">You don&apos;t have access to this page</h1>
      <p className="mt-2 text-sm text-white/50">Your account was not given this Business Admin module. A super admin can change that in Admin Management.</p>
      {first && (
        <Link href={first.href} className="mt-5 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
          Go to {first.label}
        </Link>
      )}
    </div>
  );
}

export function BusinessAdminShell({ me, name, email, children }: { me: BusinessAdminMe; name: string; email: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const currentItem = BUSINESS_NAV.find((i) => isNavActive(pathname, i));
  const current = currentItem?.label ?? "Business Admin";
  const allowed = !currentItem || me.modules.includes(currentItem.module);
  // The inbox manages its own scrolling inside a full-bleed area.
  const workspace = currentItem?.module === "inbox" && allowed;

  return (
    <MeContext.Provider value={{ me, name, email }}>
      <div className="bg-ink-950 lg:flex lg:h-dvh lg:overflow-hidden min-h-dvh">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 shrink-0 bg-ink-900 border-r border-white/5 flex-col h-full">
          <SidebarContents />
        </aside>

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-ink-900/95 backdrop-blur px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            className="rounded-lg p-2 text-white/70 hover:bg-white/5"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-400">Adaption · Business Admin</p>
            <p className="text-sm font-semibold text-white truncate">{current}</p>
          </div>
          <ThemeToggle />
        </header>

        {/* Mobile drawer */}
        {open && (
          <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
            <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-ink-900 border-r border-white/5 flex flex-col">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3 rounded-lg p-2 text-white/60 hover:bg-white/5">
                <X size={18} />
              </button>
              <SidebarContents onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
          {/* Desktop top header: section title, theme toggle, who is signed in */}
          <header className="z-20 hidden h-14 shrink-0 items-center justify-between gap-4 border-b border-white/5 bg-ink-900/95 px-6 backdrop-blur lg:flex" data-testid="top-header">
            <p className="truncate text-sm font-semibold text-white/80">{current}</p>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-white/40 xl:inline">{name} · {roleLabel(me)}</span>
              <ThemeToggle />
            </div>
          </header>
          <main className={`min-w-0 flex-1 lg:min-h-0 ${workspace ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`} data-workspace={workspace ? "true" : undefined}>
            {/* Full width: pages use the whole viewport. The inbox is a full-bleed workspace; other pages get one level of padding. */}
            <div className={workspace ? "h-full" : "w-full px-4 py-5 sm:px-6 lg:px-6 lg:py-6 2xl:px-8"}>{allowed ? children : <NoPermission />}</div>
          </main>
        </div>
      </div>
    </MeContext.Provider>
  );
}

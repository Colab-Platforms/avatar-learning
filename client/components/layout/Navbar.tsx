"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/data/navigation";
import { buttonVariants } from "@/components/ui";
import { Menu, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/authSlice";

export function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutThunk());
    router.push("/");
  };

  const avatarInitials = user
    ? user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user.firstName?.[0] ?? user.email[0]).toUpperCase()
    : "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 anim-slide-down",
          "transition-all duration-400 ease-out",
          scrolled
            ? "bg-ink-950/90 backdrop-blur-2xl border-b border-white/5 shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
            : "bg-transparent"
        )}
      >
        {/* Steel-blue top accent line on scroll */}
        {scrolled && (
          <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-500/25 to-transparent" />
        )}

        <div className="container-x flex items-center justify-between h-16">

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

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-[13px] font-medium text-white/55 hover:text-white
                           transition-colors duration-250 rounded-lg hover:bg-white/4 group"
              >
                {item.label}
                <span className="absolute bottom-1 left-4 right-4 h-px bg-brand-300/60
                                 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user ? (
              /* ── Avatar dropdown ── */
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-1.5 border transition-all duration-250",
                    userMenuOpen
                      ? "border-brand-500/35 bg-brand-500/8"
                      : "border-white/8 bg-white/4 hover:border-brand-500/25 hover:bg-brand-500/6"
                  )}
                >
                  {/* avatar circle */}
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-ink-950 shrink-0"
                    style={{ background: "linear-gradient(135deg, #00C8FF 0%, #0080FF 100%)" }}
                  >
                    {avatarInitials}
                  </div>
                  <span className="text-[13px] text-white/70 max-w-[100px] truncate">
                    {user.firstName ?? user.email}
                  </span>
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 text-white/40 transition-transform duration-250",
                    userMenuOpen ? "rotate-180" : ""
                  )} />
                </button>

                {/* dropdown panel */}
                <div className={cn(
                  "absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/8 shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
                  "overflow-hidden z-50 transition-all duration-250 origin-top-right",
                  userMenuOpen
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                )}
                  style={{ background: "linear-gradient(145deg, rgba(9,21,37,0.98) 0%, rgba(6,13,26,0.99) 100%)" }}
                >
                  {/* user info header */}
                  <div className="px-4 py-3 border-b border-white/6">
                    <p className="text-[13px] font-semibold text-white truncate">
                      {[user.firstName, user.lastName].filter(Boolean).join(" ") || "User"}
                    </p>
                    <p className="text-[11px] text-white/35 truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="py-1.5">
                    <Link href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-white/60
                                 hover:text-white hover:bg-white/5 transition-all duration-150"
                    >
                      <User className="h-3.5 w-3.5 text-brand-400/70" />
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                 text-red-400/70 hover:text-red-400 hover:bg-red-500/5
                                 transition-all duration-150"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>

                {/* click-outside overlay */}
                {userMenuOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-block text-[13px] font-medium text-white/45 hover:text-white
                           transition-colors duration-250 px-3 py-2"
              >
                Log in / Register
              </Link>
            )}
            <Link
              href="#demo"
              className={cn(buttonVariants({ variant: "primary", size: "sm" }), "text-[13px]")}
            >
              Book a Demo
            </Link>
            <Link
              href="/quiz"
              className="hidden md:inline-flex items-center text-[13px] font-medium px-4 py-2 rounded-full
                         border border-brand-500/40 text-brand-300 hover:bg-brand-500/10 hover:border-brand-500/70
                         transition-all duration-250"
            >
              Take Career Quiz
            </Link>
            <button
              className="md:hidden ml-1 flex items-center justify-center h-9 w-9 rounded-lg
                         border border-white/8 bg-white/4 text-white
                         hover:bg-white/8 hover:border-white/15 transition-all duration-250"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 z-40 md:hidden",
          "bg-ink-950/96 backdrop-blur-2xl border-b border-white/6",
          "transition-all duration-350 ease-out",
          mobileOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <nav className="container-x py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 text-[14px] font-medium text-white/60 hover:text-white
                         hover:bg-white/4 rounded-xl transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-white/6 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-[14px] text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-brand-400/70" />
                  View Profile ({user.firstName ?? user.email})
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="px-4 py-2.5 text-[14px] text-left text-red-400/80 hover:text-red-400 transition-colors duration-200 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-[14px] text-white/60 hover:text-white transition-colors duration-200"
              >
                Log in / Register
              </Link>
            )}
            <Link href="#demo" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "w-full justify-center")}>
              Book a Demo
            </Link>
            <Link
              href="/quiz"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3 rounded-xl border border-brand-500/40 text-brand-300 text-[14px] font-medium
                         text-center hover:bg-brand-500/10 hover:border-brand-500/60 transition-all duration-200"
            >
              Take Career Quiz
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

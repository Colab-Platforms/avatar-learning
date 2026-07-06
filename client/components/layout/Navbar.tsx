"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/data/navigation";
import { buttonVariants } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/authSlice";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
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

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 anim-slide-down bg-white border-b border-border">
        <div className="container-x flex items-center justify-between h-16">
          <Link
            href="/"
            className="shrink-0 flex items-center transition-opacity duration-250 hover:opacity-80"
            aria-label="Avatar India home"
          >
            <Image
              src="/landingpage-images/Avatar_dark_logo.png"
              alt="Avatar India"
              width={160}
              height={44}
              className="h-11 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-[13px] font-medium text-text-muted hover:text-text
                           transition-colors duration-200 rounded-lg hover:bg-surface-alt group"
              >
                {item.label}
                <span
                  className="absolute bottom-1 left-4 right-4 h-px bg-brand-500
                                 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"
                />
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
                    "flex items-center gap-2 rounded-xl px-2.5 py-1.5 border transition-all duration-200",
                    userMenuOpen
                      ? "border-brand-300 bg-brand-50"
                      : "border-border bg-white hover:border-brand-200 hover:bg-brand-50",
                  )}
                >
                  {/* avatar circle */}
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-brand-500) 0%, var(--color-brand-600) 100%)",
                    }}
                  >
                    {avatarInitials}
                  </div>
                  <span className="text-[13px] text-text-muted max-w-[100px] truncate">
                    {user.firstName ?? user.email}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-text-subtle transition-transform duration-200",
                      userMenuOpen ? "rotate-180" : "",
                    )}
                  />
                </button>

                {/* dropdown panel */}
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-white shadow-lg",
                    "overflow-hidden z-50 transition-all duration-200 origin-top-right",
                    userMenuOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none",
                  )}
                >
                  {/* user info header */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-[13px] font-semibold text-text truncate">
                      {[user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(" ") || "User"}
                    </p>
                    <p className="text-[11px] text-text-subtle truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1.5">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-muted
                                 hover:text-text hover:bg-surface-alt transition-all duration-150"
                    >
                      <User className="h-3.5 w-3.5 text-brand-500" />
                      View Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px]
                                 text-red-600 hover:bg-red-50
                                 transition-all duration-150"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>

                {/* click-outside overlay */}
                {userMenuOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-block text-[13px] font-medium text-text-muted hover:text-text
                           transition-colors duration-200 px-3 py-2"
              >
                Log in / Register
              </Link>
            )}
            <Link
              href="/quiz"
              className="hidden md:inline-flex items-center text-[13px] font-medium px-4 py-2 rounded-full
                         border border-brand-300 text-brand-600 hover:bg-brand-50 hover:border-brand-500
                         transition-all duration-200"
            >
              Take Career Quiz
            </Link>
            <button
              className="md:hidden ml-1 flex items-center justify-center h-9 w-9 rounded-lg
                         border border-border bg-white text-text
                         hover:bg-surface-alt transition-all duration-200"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 z-40 md:hidden",
          "bg-white border-b border-border shadow-sm",
          "transition-all duration-300 ease-out",
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
      >
        <nav className="container-x py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 text-[14px] font-medium text-text-muted hover:text-text
                         hover:bg-surface-alt rounded-xl transition-all duration-150"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-[14px] text-text-muted hover:text-text transition-colors duration-150 flex items-center gap-2"
                >
                  <User className="h-4 w-4 text-brand-500" />
                  View Profile ({user.firstName ?? user.email})
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="px-4 py-2.5 text-[14px] text-left text-red-600 hover:bg-red-50 transition-colors duration-150 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-[14px] text-text-muted hover:text-text transition-colors duration-150"
              >
                Log in / Register
              </Link>
            )}
            <Link
              href="/quiz"
              onClick={() => setMobileOpen(false)}
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "w-full justify-center",
              )}
            >
              Take Career Quiz
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

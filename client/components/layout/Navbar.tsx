"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Handshake,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/data/navigation";
import { buttonVariants, ConfirmationDialog } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/authSlice";
import { getMyPartner } from "@/lib/partnersApi";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
// import { OfferTimerBar, OFFER_BAR_HEIGHT } from "@/app/direct2hire/OfferTimerBar";
const OFFER_BAR_HEIGHT = 0;

/* Routes where the site-wide offer bar should NOT appear —
   student dashboard, admin, partner dashboard, and in-course learning/assessment. */
const OFFER_BAR_EXCLUDED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/partner-dashboard",
  "/login",
  "/register",
  "/checkout",
  "/payment",
  "/onboarded",
];

function isOfferBarExcluded(pathname: string | null): boolean {
  if (!pathname) return false;
  if (/\/(learn|assessment)(\/|$)/.test(pathname)) return true;
  return OFFER_BAR_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function Navbar({
  offsetTop,
  hideOfferBar = false,
}: {
  offsetTop?: number;
  hideOfferBar?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isApprovedPartner, setIsApprovedPartner] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [corporateOpen, setCorporateOpen] = useState(false);
  const [mobileCorporateOpen, setMobileCorporateOpen] = useState(false);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const { user, hasHydrated } = useAppSelector((s) => s.auth);
  const { data: d2hStatus } = useD2HStatus({
    enabled: hasHydrated && Boolean(user),
  });
  const isD2HEnrolled = d2hStatus?.enrollment?.status === "PAID";

  const showOfferBar = false && !hideOfferBar && !isOfferBarExcluded(pathname);
  const effectiveOffsetTop = offsetTop ?? (showOfferBar ? OFFER_BAR_HEIGHT : 0);

  /* Silently check partner status once user is known — used to show/hide
     the Partner Dashboard link in the dropdown. Fails silently if not a partner. */
  useEffect(() => {
    if (!user) {
      setIsApprovedPartner(false);
      return;
    }
    getMyPartner()
      .then((p) => setIsApprovedPartner(p?.status === "APPROVED"))
      .catch(() => setIsApprovedPartner(false));
  }, [user?.id]);

  const handleLogoutClick = () => {
    setUserMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await dispatch(logoutThunk());
      setShowLogoutConfirm(false);
      router.push("/");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActiveRoute = (href: string) => {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isItemActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.href) return isActiveRoute(item.href);
    if (item.children) {
      return item.children.some((child) => isActiveRoute(child.href));
    }
    return false;
  };

  return (
    <>
      {/* {showOfferBar && (
        <>
          <OfferTimerBar />
          <div style={{ height: OFFER_BAR_HEIGHT }} aria-hidden />
        </>
      )} */}
      <header
        className="fixed inset-x-0 z-50 anim-slide-down bg-white/95 backdrop-blur-md border-b border-border shadow-xs"
        style={{ top: effectiveOffsetTop }}
      >
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
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              if (item.children) {
                return (
                  <div
                    key={item.label}
                    className="relative group"
                    onMouseEnter={() => setCorporateOpen(true)}
                    onMouseLeave={() => setCorporateOpen(false)}
                  >
                    <button
                      className={cn(
                        "relative inline-flex items-center gap-1 px-3 py-2 text-[13.5px] rounded-lg transition-all duration-200 cursor-pointer group font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                        active && "text-brand-600 font-bold bg-brand-50/50",
                      )}
                    >
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse shrink-0" />
                      )}
                      <span>{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                          corporateOpen && "rotate-180",
                        )}
                      />

                      {/* Bottom underline accent */}
                      <span
                        className={cn(
                          "absolute bottom-0 left-2.5 right-2.5 h-[2.5px] rounded-full transition-all duration-300 origin-left",
                          active
                            ? "bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 scale-x-100 opacity-100"
                            : "bg-brand-500 scale-x-0 group-hover:scale-x-100 opacity-0 group-hover:opacity-100",
                        )}
                      />
                    </button>

                    <AnimatePresence>
                      {corporateOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute left-0 top-full mt-1.5 w-44 rounded-xl border border-border bg-white p-1.5 shadow-lg z-50"
                        >
                          {item.children.map((child) => {
                            const childActive = isActiveRoute(child.href);
                            return (
                              <Link
                                key={child.label}
                                href={child.href}
                                onClick={() => setCorporateOpen(false)}
                                className={cn(
                                  "flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-colors duration-150",
                                  childActive
                                    ? "text-brand-600 bg-brand-50/70"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                                )}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href || "#"}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2 text-[13.5px] rounded-lg transition-all duration-200 group",
                    active
                      ? "text-brand-600 font-bold bg-brand-50/50"
                      : "font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                  )}
                >
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse shrink-0" />
                  )}
                  <span>{item.label}</span>

                  {/* Bottom underline accent */}
                  <span
                    className={cn(
                      "absolute bottom-0 left-2.5 right-2.5 h-[2.5px] rounded-full transition-all duration-300 origin-left",
                      active
                        ? "bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-500 scale-x-100 opacity-100"
                        : "bg-brand-500 scale-x-0 group-hover:scale-x-100 opacity-0 group-hover:opacity-100",
                    )}
                  />
                </Link>
              );
            })}
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
                  <UserAvatar
                    profileImage={user.profileImage}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    email={user.email}
                    size="xs"
                    rounded="2xl"
                    className="!rounded-lg"
                    showSkeleton
                  />
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
                    {isD2HEnrolled && (
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-muted
                                   hover:text-text hover:bg-surface-alt transition-all duration-150"
                      >
                        <GraduationCap className="h-3.5 w-3.5 text-brand-500" />
                        Direct2Hire Dashboard
                      </Link>
                    )}
                    {isApprovedPartner && (
                      <Link
                        href="/partner-dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-text-muted
                                   hover:text-text hover:bg-surface-alt transition-all duration-150"
                      >
                        <Handshake className="h-3.5 w-3.5 text-brand-500" />
                        Partner Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogoutClick}
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
                className="hidden md:inline-flex items-center text-[13px] font-medium px-4 py-2 rounded-full
                         border border-brand-300 text-brand-600 hover:bg-brand-50 hover:border-brand-500
                         transition-all duration-200"
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
          "fixed inset-x-0 z-40 md:hidden",
          "bg-white border-b border-border shadow-sm",
          "transition-all duration-300 ease-out",
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none",
        )}
        style={{ top: 64 + effectiveOffsetTop }}
      >
        <nav className="container-x py-4 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            if (item.children) {
              return (
                <div key={item.label} className="flex flex-col">
                  <button
                    onClick={() => setMobileCorporateOpen(!mobileCorporateOpen)}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 text-[14px] rounded-xl transition-all duration-150 font-medium text-text-muted hover:text-text hover:bg-surface-alt w-full cursor-pointer",
                      active &&
                        "text-brand-600 font-bold bg-brand-50/60 pl-3.5 border-l-3 border-brand-600",
                    )}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-400 transition-transform duration-200",
                        mobileCorporateOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileCorporateOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden pl-4 flex flex-col gap-1 mt-1 border-l border-slate-100 ml-4"
                      >
                        {item.children.map((child) => {
                          const childActive = isActiveRoute(child.href);
                          return (
                            <Link
                              key={child.label}
                              href={child.href}
                              onClick={() => {
                                setMobileOpen(false);
                                setMobileCorporateOpen(false);
                              }}
                              className={cn(
                                "flex items-center px-4 py-2.5 text-[13.5px] rounded-lg transition-all duration-150 font-medium",
                                childActive
                                  ? "text-brand-600 bg-brand-50/40"
                                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                              )}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href || "#"}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-[14px] rounded-xl transition-all duration-150",
                  active
                    ? "text-brand-600 font-bold bg-brand-50/60 border-l-3 border-brand-600 pl-3.5"
                    : "font-medium text-text-muted hover:text-text hover:bg-surface-alt",
                )}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
                )}
              </Link>
            );
          })}
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
                {isD2HEnrolled && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 text-[14px] text-text-muted hover:text-text transition-colors duration-150 flex items-center gap-2"
                  >
                    <GraduationCap className="h-4 w-4 text-brand-500" />
                    Direct2Hire Dashboard
                  </Link>
                )}
                {isApprovedPartner && (
                  <Link
                    href="/partner-dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 text-[14px] text-text-muted hover:text-text transition-colors duration-150 flex items-center gap-2"
                  >
                    <Handshake className="h-4 w-4 text-brand-500" />
                    Partner Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogoutClick();
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
                className={cn(
                  buttonVariants({ variant: "primary", size: "sm" }),
                  "w-full justify-center",
                )}
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

      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of your account? You will need to log back in to access your profile."
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="brand"
        isLoading={isLoggingOut}
      />
    </>
  );
}

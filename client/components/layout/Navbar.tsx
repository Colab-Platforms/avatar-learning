"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/data/navigation";
import { buttonVariants } from "@/components/ui";
import { Menu, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logoutThunk } from "@/store/authSlice";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    router.push("/");
  };

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
              <>
                <span className="hidden sm:inline-block text-[13px] text-white/50 px-3 py-2">
                  <User className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  {user.firstName ?? user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-white/45 hover:text-red-400
                             transition-colors duration-250 px-3 py-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-block text-[13px] font-medium text-white/45 hover:text-white
                           transition-colors duration-250 px-3 py-2"
              >
                Log in
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
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="px-4 py-2.5 text-[14px] text-left text-red-400/80 hover:text-red-400 transition-colors duration-200 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign out ({user.firstName ?? user.email})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-[14px] text-white/60 hover:text-white transition-colors duration-200"
              >
                Log in
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

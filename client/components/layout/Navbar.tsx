"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/data/navigation";
import { SITE } from "@/data/site";
import { buttonVariants } from "@/components/ui";
import { Menu, X } from "lucide-react";

function AvatarLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} fill="none" aria-hidden="true">
      <path d="M16 3 L29 27 H3 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11 22 H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
            ? "bg-ink-950/88 backdrop-blur-2xl border-b border-white/[0.055] shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
            : "bg-transparent"
        )}
      >
        {/* Subtle top glow line */}
        {scrolled && (
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        )}

        <div className="container-x flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-white group shrink-0">
            <span className="transition-all duration-350 group-hover:scale-110 group-hover:rotate-3 text-white">
              <AvatarLogo />
            </span>
            <span className="font-bold tracking-[0.2em] text-[13px] text-white/90 group-hover:text-white transition-colors duration-250">
              {SITE.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors duration-250 rounded-lg hover:bg-white/[0.05] group"
              >
                {item.label}
                {/* Underline sweep */}
                <span className="absolute bottom-1 left-4 right-4 h-px bg-brand-400/70 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link
              href="#login"
              className="hidden sm:inline-block text-[13px] font-medium text-white/55 hover:text-white transition-colors duration-250 px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="#demo"
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "text-[13px]"
              )}
            >
              Book a Demo
            </Link>
            {/* Mobile burger */}
            <button
              className="md:hidden ml-1 flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] transition-all duration-250"
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
          "bg-ink-950/96 backdrop-blur-2xl border-b border-white/[0.08]",
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
              className="px-4 py-2.5 text-[14px] font-medium text-white/65 hover:text-white hover:bg-white/[0.04] rounded-xl transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-white/[0.07] flex flex-col gap-2">
            <Link href="#login" className="px-4 py-2.5 text-[14px] text-white/65 hover:text-white transition-colors duration-200">Log in</Link>
            <Link href="#demo" className={cn(buttonVariants({ variant: "primary", size: "sm" }), "w-full justify-center")}>
              Book a Demo
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Why Avatar", href: "#why-avatar" },
  { label: "Services", href: "#services" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const SECTION_IDS = LINKS.map((l) => l.href.slice(1));

/**
 * Native compositor-driven smooth scroll — deliberately not a hand-rolled
 * requestAnimationFrame loop. With this many `whileInView` animations now
 * triggering across the page as sections scroll past, a main-thread rAF loop
 * competes with all of them for frame time and can stall or land short of the
 * target; native smooth scroll runs off the main thread and isn't affected.
 */
function scrollTo(targetY: number) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: targetY, behavior: prefersReducedMotion ? "auto" : "smooth" });
}

/** Tracks which nav section is currently centered in the viewport, for the active-link indicator. */
function useActiveSection(ids: string[], onIntersect: (id: string) => void) {
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) onIntersect(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids, onIntersect]);
}

export function EcosystemHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [showCta, setShowCta] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  // While a nav-triggered scroll is in flight, ignore the IntersectionObserver
  // so it can't fight the click-driven active-link update or force extra
  // layout reflows (via the underline's layoutId) mid-animation.
  const suppressObserverUntilRef = useRef(0);

  const handleIntersect = useCallback((id: string) => {
    if (Date.now() < suppressObserverUntilRef.current) return;
    setActiveSection(id);
  }, []);

  useActiveSection(SECTION_IDS, handleIntersect);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setShowCta(window.scrollY <= window.innerHeight * 2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const openBookDemo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.dispatchEvent(new Event("aie:open-book-demo"));
  };

  // JS-driven scroll with a measured (not hardcoded) header offset — more robust
  // than relying on CSS scroll-margin-top alone, especially on mobile where
  // closing the menu must finish (and the layout settle) before we measure.
  const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    setActiveSection(id);
    suppressObserverUntilRef.current = Date.now() + 1200;

    const performScroll = () => {
      const target = document.getElementById(id);
      const header = headerRef.current;
      if (!target || !header) return;
      const offset = header.getBoundingClientRect().height + 16;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      scrollTo(Math.max(top, 0));
    };

    if (mobileOpen) {
      setMobileOpen(false);
      // wait a frame for the mobile menu to unmount and the header to shrink
      // back down before measuring, so we scroll to the settled position.
      requestAnimationFrame(() => requestAnimationFrame(performScroll));
    } else {
      performScroll();
    }
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || mobileOpen
          ? "bg-[#07070c]/80 backdrop-blur-xl border-b border-white/[0.08]"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/landingpage-images/Avatar_logo_Light.svg"
            alt="Avatar"
            width={120}
            height={32}
            className="h-7 w-auto sm:h-8"
            priority
          />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => {
            const isActive = l.href.slice(1) === activeSection;
            return (
              <a
                key={l.label}
                href={l.href}
                onClick={scrollToSection(l.href.slice(1))}
                className={cn(
                  "relative pb-1 text-[15px] font-medium tracking-wide transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-white/95 after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-white/40 after:transition-transform after:duration-300 after:content-[''] hover:text-white hover:after:scale-x-100",
                )}
              >
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="aie-nav-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: "linear-gradient(135deg, #C4B5FD 0%, #93C5FD 100%)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div
          className={cn(
            "hidden items-center gap-3 transition-all duration-500 md:flex",
            showCta
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-1 pointer-events-none",
          )}
          aria-hidden={!showCta}
        >
          <a
            href="#book-demo"
            onClick={openBookDemo}
            tabIndex={showCta ? undefined : -1}
            aria-label="Call to book a demo"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/90 transition-colors duration-200 hover:border-white/40 hover:text-white"
          >
            <Phone className="h-4 w-4" />
          </a>

          <a
            href="#book-demo"
            onClick={openBookDemo}
            tabIndex={showCta ? undefined : -1}
            className="relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px -4px rgba(124,58,237,0.5)",
            }}
          >
            <span className="relative z-10">Book a Demo</span>
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </a>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <a
            href="#book-demo"
            onClick={openBookDemo}
            className="relative inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold text-white whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 6px 18px -4px rgba(124,58,237,0.5)",
            }}
          >
            Book a Demo
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/[0.08] bg-[#07070c]/95 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={scrollToSection(l.href.slice(1))}
                className="rounded-lg px-3 py-3 text-[15px] font-medium text-white/95 tracking-wide hover:bg-white/5 hover:text-white transition-colors duration-200"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#book-demo"
              onClick={(e) => {
                openBookDemo(e);
                setMobileOpen(false);
              }}
              className="relative mt-2 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold text-white overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px -4px rgba(124,58,237,0.5)",
              }}
            >
              <span className="relative z-10">Book a Demo</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

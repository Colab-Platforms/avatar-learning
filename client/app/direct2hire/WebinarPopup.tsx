"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";

/** Same-site webinar registration page (https://www.avatarindia.com/webinar in production). */
const WEBINAR_URL = "/webinar";

/**
 * The Avatar Learning pages the promo opens on: Learning, the Direct2Hire
 * landing page (the webinar ads link here) and the course list. Not the
 * AI Adoption pages or the rest of the site.
 */
const SHOW_ON = [/^\/learning\/?$/, /^\/direct2hire\/?$/, /^\/courses\/?$/];

/**
 * True when this page load came from clicking a plain <a> link on our own site
 * (a full reload that is really in-site navigation). Refreshes, typed URLs and
 * visitors arriving from ads or other sites return false.
 */
function cameFromOwnSite() {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav?.type === "reload") return false;
    return !!document.referrer && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Webinar promo popup (rendered from the root layout). Opens once per visit:
 * every time someone opens or refreshes one of the SHOW_ON pages. Moving
 * between pages inside the site doesn't reopen it.
 * Closes with ×, a click outside, or Escape. The button sends the visitor
 * to the webinar page to register there.
 */
export function WebinarPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (shown.current || !pathname || !SHOW_ON.some((re) => re.test(pathname))) return;
    if (cameFromOwnSite()) return;
    const t = window.setTimeout(() => {
      shown.current = true;
      setOpen(true);
    }, 300);
    return () => window.clearTimeout(t);
  }, [pathname]);

  const close = useCallback(() => setOpen(false), []);

  // Escape to close, lock page scroll while open, focus the register button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const f = window.setTimeout(() => ctaRef.current?.focus({ preventScroll: true }), 220);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(f);
    };
  }, [open, close]);

  const register = () => {
    setOpen(false);
    router.push(WEBINAR_URL);
  };

  if (!open) return null;

  // Styling follows the Direct2Hire page: its dark section (#0b1220, white/60
  // body text, white/5 + white/10 badge), its modal overlay (slate-900/60 +
  // backdrop-blur-sm, rounded-3xl card) and its primary button (brand-500 →
  // brand-600). Inter comes from the site font.
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-[d2hFade_.15s_ease-out]"
        onMouseDown={close}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="d2h-webinar-title"
        aria-describedby="d2h-webinar-desc"
        className="relative w-[90vw] max-w-[420px] max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl border border-white/10 bg-[#0b1220] px-6 pb-6 pt-7 text-center text-white shadow-[0_30px_80px_rgba(2,6,23,0.55)] sm:max-w-[440px] sm:px-8 sm:pb-7 sm:pt-8 animate-[d2hPop_.2s_cubic-bezier(.2,.8,.2,1)]"
      >
        {/* faint brand glow at the top, as on the site's dark cards */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl"
        />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="relative">
          {/* LIVE badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-semibold tracking-wide text-white">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            LIVE
          </span>

          <h2
            id="d2h-webinar-title"
            className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-white sm:text-[27px]"
          >
            Hey, don&rsquo;t miss our AI Webinar!
          </h2>

          <p id="d2h-webinar-desc" className="mx-auto mt-2.5 max-w-[340px] text-[14px] leading-relaxed text-white/60 sm:text-[15px]">
            Discover AI, explore exciting opportunities, and take your first step towards an AI-powered future.
          </p>

          <p className="mt-3.5 text-[14px] font-medium text-white/80 sm:text-[15px]">
            Join our AI Webinar for just <strong className="font-bold text-brand-300">₹7!</strong>
          </p>

          <button
            ref={ctaRef}
            type="button"
            onClick={register}
            className="mt-6 h-[50px] w-full rounded-full bg-brand-500 px-6 text-[14px] font-semibold uppercase tracking-wide text-white transition-colors hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1220]"
          >
            Register now for ₹7
          </button>
        </div>
      </div>

      <style>{`
        @keyframes d2hFade { from { opacity: 0 } }
        @keyframes d2hPop { from { opacity: 0; transform: translateY(12px) scale(.97) } }
      `}</style>
    </div>
  );
}

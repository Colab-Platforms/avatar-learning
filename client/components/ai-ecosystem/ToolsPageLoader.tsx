"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState } from "react";
import { GeistSans } from "geist/font/sans";

/**
 * Full-screen "AVATAR AI" intro shown only on /tools (rendered by app/tools/page.tsx
 * through <ToolsLoaderGate>). Based on the Uiverse.io text loader by dexter-st,
 * recoloured to the site's black / white / cyan palette. All CSS is scoped to
 * ".tpl-" classes inside this component, so no other page is affected.
 *
 * Timing: letters reveal one by one with a cyan sweep (~1.55s), then the overlay
 * fades (0.4s). Later visits in the same tab use a shorter version (~0.95s).
 * Reduced motion: the overlay is hidden by CSS and skipped entirely.
 */

const TEXT = "AVATAR AI";
const FULL_MS = 1550;
const QUICK_MS = 950;
const FADE_MS = 400;
const MAX_MS = 5000; // hard cap: never leave the overlay up longer than this
const SEEN_KEY = "avatar-tools-intro-seen";

/** True once the loader starts fading, i.e. the Tools page may start its entrance animations. */
const RevealContext = createContext(true);
export const useToolsReveal = () => useContext(RevealContext);

/** Wraps the /tools page content: renders the loader above it and tells the page when to animate in. */
export function ToolsLoaderGate({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <RevealContext.Provider value={revealed}>
      {children}
      {!done && <ToolsPageLoader onReveal={() => setRevealed(true)} onDone={() => setDone(true)} />}
    </RevealContext.Provider>
  );
}

export function ToolsPageLoader({ onReveal, onDone }: { onReveal: () => void; onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [quick, setQuick] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onReveal();
      onDone();
      return;
    }

    // Shorter intro on repeat visits in this tab (only if it hasn't started playing yet).
    const anim = root.getAnimations?.({ subtree: true }).find((a) => (a as CSSAnimation).animationName === "tplLetter");
    const elapsed = typeof anim?.currentTime === "number" ? anim.currentTime : 0;
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    const isQuick = seen && elapsed < 60;
    if (isQuick) setQuick(true); // layout effect: applied before the first paint
    const remaining = Math.max(0, (isQuick ? QUICK_MS : FULL_MS) - elapsed);

    // Block the page underneath (pointer is blocked by the overlay; inert covers keyboard/AT).
    const content = document.querySelector<HTMLElement>("[data-tools-content]");
    content?.setAttribute("inert", "");
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    let cancelled = false;
    const timers: number[] = [];
    const release = () => {
      content?.removeAttribute("inert");
      html.style.overflow = prevOverflow;
    };
    let started = false;
    const leave = () => {
      if (cancelled || started) return;
      started = true;
      try {
        sessionStorage.setItem(SEEN_KEY, "1"); // only once the full intro has actually played
      } catch {}
      release();
      setLeaving(true);
      onReveal();
      timers.push(window.setTimeout(() => !cancelled && onDone(), FADE_MS));
    };

    // Reveal only when the animation has played AND the fonts are ready (so the page isn't shown half-styled).
    const minTime = new Promise<void>((r) => timers.push(window.setTimeout(r, remaining)));
    const fonts = Promise.race([
      document.fonts?.ready.then(() => undefined) ?? Promise.resolve(),
      new Promise<void>((r) => timers.push(window.setTimeout(r, 2500))),
    ]).catch(() => undefined);
    Promise.all([minTime, fonts]).then(leave, leave);
    timers.push(window.setTimeout(leave, MAX_MS));

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className={`tpl-root ${GeistSans.variable}${quick ? " tpl-quick" : ""}${leaving ? " tpl-leaving" : ""}`} role="status" aria-live="polite">
      <style>{TPL_CSS}</style>
      {/* No JavaScript: never cover the (fully server-rendered) page. */}
      <noscript dangerouslySetInnerHTML={{ __html: "<style>.tpl-root{display:none!important}</style>" }} />
      <span className="tpl-sr">Loading Avatar AI tools…</span>
      <div className="tpl-wrapper" aria-hidden="true">
        {[...TEXT].map((ch, i) => (
          <span key={i} className={ch === " " ? "tpl-letter tpl-space" : "tpl-letter"} style={{ animationDelay: `calc(${50 + i * 65}ms * var(--tpl-k))` }}>
            {ch === " " ? " " : ch}
          </span>
        ))}
        <div className="tpl-loader" />
      </div>
    </div>
  );
}

// Uiverse.io loader (dexter-st): same structure — striped mask, sweeping radial
// glow, sequential letters — with site colours (COLORS in data.ts) and responsive
// sizing instead of `scale: 2`.
const TPL_CSS = `
.tpl-root { --tpl-k: 1; position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center;
  background: #07080b; overflow: hidden; opacity: 1; transition: opacity ${FADE_MS}ms ease;
  animation: tplFailsafe 0s 6s forwards }
.tpl-root.tpl-quick { --tpl-k: .6 }
.tpl-root.tpl-leaving { opacity: 0; pointer-events: none }
@keyframes tplFailsafe { to { opacity: 0; visibility: hidden; pointer-events: none } }
.tpl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }

.tpl-wrapper { position: relative; display: flex; align-items: center; justify-content: center; height: 2.6em; width: auto; max-width: calc(100vw - 32px);
  font-family: var(--font-geist-sans), system-ui, sans-serif; font-size: clamp(30px, 8.5vw, 64px); font-weight: 700; letter-spacing: .06em;
  user-select: none; color: #f4f6f8 }

.tpl-loader { position: absolute; top: 0; left: 0; height: 100%; width: 100%; z-index: 1; background-color: transparent;
  -webkit-mask: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px);
  mask: repeating-linear-gradient(90deg, transparent 0, transparent 6px, black 7px, black 8px) }
.tpl-loader::after { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background-image:
    radial-gradient(circle at 50% 50%, #e9fdff 0%, transparent 50%),
    radial-gradient(circle at 45% 45%, #8fe9f2 0%, transparent 45%),
    radial-gradient(circle at 55% 55%, #6fe3ef 0%, transparent 45%),
    radial-gradient(circle at 45% 55%, rgba(60,140,160,.9) 0%, transparent 45%),
    radial-gradient(circle at 55% 45%, #a3abb5 0%, transparent 45%);
  -webkit-mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
  mask: radial-gradient(circle at 50% 50%, transparent 0%, transparent 10%, black 25%);
  opacity: 0;
  animation: tplSweep calc(1.5s * var(--tpl-k)) 1 forwards, tplGlow calc(1.6s * var(--tpl-k)) 1 forwards;
  animation-timing-function: cubic-bezier(0.6, 0.8, 0.5, 1) }
@keyframes tplSweep { 0% { transform: translate(-55%) } 100% { transform: translate(55%) } }
@keyframes tplGlow { 0%, 100% { opacity: 0 } 15% { opacity: .85 } 65% { opacity: 0 } }

.tpl-letter { position: relative; z-index: 2; display: inline-block; opacity: 0; animation: tplLetter calc(1s * var(--tpl-k)) linear both }
.tpl-space { width: .38em }
/* Same reveal as the original (fade in with a lift + glow, dim), but ending on the
   fully visible word so the text is complete before the overlay fades. */
@keyframes tplLetter {
  0% { opacity: 0 }
  18% { opacity: 1; text-shadow: 0 0 6px rgba(111,227,239,.85), 0 0 18px rgba(111,227,239,.35); transform: scale(1.1) translateY(-2px) }
  55% { opacity: .35; text-shadow: none; transform: none }
  100% { opacity: 1; text-shadow: 0 0 10px rgba(111,227,239,.18) }
}

@media (prefers-reduced-motion: reduce) { .tpl-root { display: none !important } }
`;

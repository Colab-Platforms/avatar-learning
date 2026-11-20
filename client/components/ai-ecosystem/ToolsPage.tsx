"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { PRODUCTS } from "./data";
import { ProductDetailPanel } from "./ProductShowcase";
import { useToolsReveal } from "./ToolsPageLoader";

/**
 * Dedicated /tools showcase. Every animation here is scoped to this component
 * (".tp-" classes in the <style> below, rendered only on /tools); nothing is
 * global, and observers/listeners are cleaned up on unmount.
 */

// Card subtitles per the brief; overview + capabilities come from the existing PRODUCTS data.
const SUBTITLES: Record<string, string> = {
  crm: "Sales & Customer Management",
  orders: "Order Management",
  script: "Business Workflow Automation",
  learning: "Learning Management",
  recruitment: "Hiring & Candidate Management",
  hrms: "Human Resource Management",
  inventory: "Inventory Management",
  custom: "Tailored Business Solutions",
};
const DISPLAY_NAME: Record<string, string> = { custom: "Custom Tools" };

const sv = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const ICONS: Record<string, React.ReactNode> = {
  crm: (<svg {...sv}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" /><path d="M16 5.5a3 3 0 0 1 0 5.6M18 14.6c1.3.6 2.2 1.9 2.6 3.9" /></svg>),
  orders: (<svg {...sv}><path d="M4 7.5 12 3.5l8 4v9l-8 4-8-4v-9Z" /><path d="m4 7.5 8 4 8-4M12 11.5v9" /></svg>),
  script: (<svg {...sv}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" /></svg>),
  learning: (<svg {...sv}><path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" /><path d="M6 11.5v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" /></svg>),
  recruitment: (<svg {...sv}><circle cx="11" cy="11" r="6" /><path d="m20 20-4.2-4.2" /><path d="M8.6 13.4c.5-1.3 1.3-2 2.4-2s1.9.7 2.4 2M11 9.7a1.2 1.2 0 1 0 0-.01" /></svg>),
  hrms: (<svg {...sv}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4M8 14h3M8 17h6" /></svg>),
  inventory: (<svg {...sv}><path d="M3 8.5 12 4l9 4.5M5 10v9h14v-9" /><path d="M9.5 19v-5h5v5" /></svg>),
  custom: (<svg {...sv}><path d="M14.5 5.5a4 4 0 0 0-5.3 5.3L4 16l4 4 5.2-5.2a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z" /></svg>),
};

const mono: React.CSSProperties = { fontFamily: "var(--font-geist-mono),ui-monospace,monospace" };

/** Accessible animated dialog: focus trap, Escape, backdrop click, scroll lock, focus restore. */
function ToolDialog({ index, onClose }: { index: number; onClose: () => void }) {
  const p = PRODUCTS[index];
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const close = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return onClose();
    setClosing(true);
    window.setTimeout(onClose, 220);
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // no background scrolling while open
    const panel = panelRef.current;
    const focusables = () => [...(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Portal to <body>: the page wrapper creates its own stacking context, which
  // would otherwise leave the site-wide floating widgets above the popup.
  return createPortal(
    <div className={`tp-backdrop ${GeistSans.variable} ${GeistMono.variable}${closing ? " tp-out" : ""}`} onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="tp-dialog-title" className={`tp-dialog${closing ? " tp-out" : ""}`}>
        <button type="button" onClick={close} aria-label="Close" className="tp-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        {/* The original homepage product panel: number, category, heading, description,
            feature badges, "Ask about …" CTA and the dashboard preview. */}
        <div className="tp-scroll">
          <ProductDetailPanel product={p} index={index} titleId="tp-dialog-title" />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ToolsPage() {
  const gridRef = useRef<HTMLUListElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const lastTrigger = useRef<number | null>(null);

  // False while the /tools intro loader covers the page; entrance animations wait for it.
  const revealed = useToolsReveal();

  // Cards are visible in the server HTML; only once JS runs do we "arm" them and
  // reveal each as it enters the viewport (once). No JS → no hidden content.
  const motionOk = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window;
  useLayoutEffect(() => {
    if (motionOk()) gridRef.current?.classList.add("tp-armed");
  }, []);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !revealed || !motionOk()) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("tp-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    grid.querySelectorAll(".tp-card-wrap").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [revealed]);

  const openTool = (i: number) => {
    lastTrigger.current = i;
    setOpen(i);
  };
  const closeTool = () => {
    setOpen(null);
    const i = lastTrigger.current;
    if (i !== null) requestAnimationFrame(() => cardRefs.current[i]?.focus()); // restore focus to the card
  };

  return (
    <section className={revealed ? "tp-root" : "tp-root tp-hold"} aria-labelledby="tp-title">
      <style>{TP_CSS}</style>
      <div aria-hidden="true" className="tp-grid-bg" />
      <div aria-hidden="true" className="tp-glow tp-glow-a" />
      <div aria-hidden="true" className="tp-glow tp-glow-b" />

      <div className="tp-container">
        <header className="tp-hero">
          <p className="tp-label tp-enter" style={{ animationDelay: "0ms" }}>
            <span aria-hidden="true" className="tp-dash" />
            Our AI ecosystem
          </p>
          <h1 id="tp-title" className="tp-title">
            <span className="tp-enter" style={{ animationDelay: "80ms" }}>One Ecosystem. </span>
            <span className="tp-enter tp-title-grad" style={{ animationDelay: "160ms" }}>Endless Powerful Solutions.</span>
          </h1>
          <p className="tp-sub tp-enter" style={{ animationDelay: "240ms" }}>
            Discover intelligent business AI tools designed to simplify operations, automate workflows, and help your organization grow.
          </p>
        </header>

        <ul ref={gridRef} className="tp-cards" aria-label="Avatar AI Adoption tools">
          {PRODUCTS.map((p, i) => (
            <li key={p.slug} className="tp-card-wrap" style={{ transitionDelay: `${(i % 4) * 80 + Math.floor(i / 4) * 80}ms` }}>
              <button
                ref={(el) => { cardRefs.current[i] = el; }}
                type="button"
                className="tp-card"
                onClick={() => openTool(i)}
                aria-haspopup="dialog"
              >
                <span className="tp-card-top">
                  <span className="tp-icon">{ICONS[p.slug]}</span>
                  <span style={{ ...mono, fontSize: 12, color: "#8a939e" }}>{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="tp-card-name">{DISPLAY_NAME[p.slug] ?? p.name}</span>
                <span className="tp-card-sub">{SUBTITLES[p.slug]}</span>
                <span className="tp-card-desc">{p.desc}</span>
                <span className="tp-card-cta">
                  Explore
                  <span aria-hidden="true" className="tp-arrow">→</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open !== null && <ToolDialog index={open} onClose={closeTool} />}
    </section>
  );
}

const TP_CSS = `
.tp-root { position: relative; overflow: hidden; padding: var(--ad-page-top) var(--ad-gutter) var(--ad-section-y) }
.tp-container { position: relative; max-width: 1200px; margin: 0 auto }
.tp-grid-bg { position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);
  background-size: 64px 64px;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 20%,#000 30%,transparent 80%); mask-image: radial-gradient(ellipse 70% 60% at 50% 20%,#000 30%,transparent 80%) }
.tp-glow { position: absolute; pointer-events: none; border-radius: 50%; filter: blur(10px) }
.tp-glow-a { left: 50%; top: -260px; width: 900px; height: 600px; margin-left: -450px; background: radial-gradient(closest-side,rgba(111,227,239,.12),transparent); animation: tpBreathe 9s ease-in-out infinite }
.tp-glow-b { right: -200px; top: 35%; width: 600px; height: 600px; background: radial-gradient(closest-side,rgba(60,140,160,.10),transparent) }
@keyframes tpBreathe { 0%,100% { opacity: .75 } 50% { opacity: 1 } }

.tp-hero { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; max-width: 820px; margin: 0 auto }
.tp-label { margin: 0; display: inline-flex; align-items: center; gap: 12px; font-family: var(--font-geist-mono),ui-monospace,monospace; font-size: 12.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: #6fe3ef }
.tp-dash { width: 24px; height: 1.5px; background: #6fe3ef }
.tp-title { margin: 0; font-size: clamp(34px,5.4vw,64px); line-height: 1.06; letter-spacing: -0.035em; font-weight: 600; color: #f4f6f8; text-wrap: balance }
.tp-title > span { display: inline-block }
.tp-title-grad { background: linear-gradient(180deg,#e6eaee 0%,#a9b1ba 100%); -webkit-background-clip: text; background-clip: text; color: transparent; padding-bottom: .06em }
.tp-sub { margin: 0; max-width: 620px; font-size: clamp(16px,1.35vw,18.5px); line-height: 1.65; color: #a3abb5 }
@keyframes tpEnter { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
.tp-enter { animation: tpEnter .55s cubic-bezier(.2,.7,.1,1) both }
.tp-hold .tp-enter { animation: none } /* held (static, visible) under the intro loader; plays once it fades */

.tp-cards { list-style: none; margin: clamp(40px,5vw,64px) 0 0; padding: 0; display: grid; gap: 16px; grid-template-columns: repeat(4,minmax(0,1fr)) }
@media (max-width: 1023px) { .tp-cards { grid-template-columns: repeat(2,minmax(0,1fr)) } }
@media (max-width: 599px) { .tp-cards { grid-template-columns: minmax(0,1fr) } }
.tp-card-wrap { display: flex }
.tp-cards.tp-armed .tp-card-wrap { opacity: 0; transform: translateY(18px); transition: opacity .45s cubic-bezier(.2,.7,.1,1), transform .45s cubic-bezier(.2,.7,.1,1) }
.tp-cards.tp-armed .tp-card-wrap.tp-in { opacity: 1; transform: none }

.tp-card { width: 100%; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; text-align: left; cursor: pointer;
  padding: 22px; border-radius: 18px; border: 1px solid rgba(255,255,255,.08); background: linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)); color: inherit;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease, background .25s ease }
.tp-card:focus-visible { outline: 2px solid #6fe3ef; outline-offset: 3px }
@media (hover: hover) and (pointer: fine) {
  .tp-card:hover { transform: translateY(-5px); border-color: rgba(111,227,239,.4); box-shadow: 0 18px 40px -18px rgba(111,227,239,.35); background: linear-gradient(180deg,rgba(111,227,239,.06),rgba(255,255,255,.015)) }
  .tp-card:hover .tp-arrow { transform: translateX(4px) }
  .tp-card:hover .tp-icon { background: #6fe3ef; color: #07131a }
}
.tp-card-top { width: 100%; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px }
.tp-icon { width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: rgba(111,227,239,.1); color: #8fe9f2; transition: background .25s ease, color .25s ease }
.tp-icon-lg { width: 52px; height: 52px; background: #6fe3ef; color: #07131a }
.tp-card-name { font-size: 19px; font-weight: 600; letter-spacing: -0.015em; color: #f4f6f8 }
.tp-card-sub { font-size: 13px; color: #8fe9f2 }
.tp-card-desc { font-size: 14px; line-height: 1.55; color: #a3abb5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden }
.tp-card-cta { margin-top: auto; padding-top: 10px; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #f4f6f8 }
.tp-arrow { display: inline-block; transition: transform .25s ease; color: #6fe3ef }

.tp-backdrop { position: fixed; inset: 0; z-index: 1000; font-family: var(--font-geist-sans), system-ui, sans-serif; color: #f4f6f8; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(3,4,6,.72); backdrop-filter: blur(4px); animation: tpFade .25s ease both }
.tp-dialog { position: relative; display: flex; flex-direction: column; width: 86vw; max-width: 1320px; max-height: calc(100vh - 48px); overflow: hidden; border-radius: 24px; border: 1px solid rgba(143,190,200,.2);
  background: #0b0d12; box-shadow: 0 40px 100px -20px rgba(0,0,0,.9); animation: tpPop .25s cubic-bezier(.2,.7,.1,1) both }
.tp-scroll { overflow: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; min-height: 0 }
.tp-backdrop.tp-out { animation: tpFadeOut .22s ease both }
.tp-dialog.tp-out { animation: tpPopOut .22s ease both }
@keyframes tpFade { from { opacity: 0 } to { opacity: 1 } }
@keyframes tpFadeOut { to { opacity: 0 } }
@keyframes tpPop { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } }
@keyframes tpPopOut { to { opacity: 0; transform: scale(.96) } }
.tp-close { position: absolute; top: 14px; right: 14px; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
  border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.04); color: #e6eaee; transition: background .2s, border-color .2s; z-index: 1 }
.tp-close:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.3) }
.tp-close:focus-visible { outline: 2px solid #6fe3ef; outline-offset: 2px }

/* Phones: bottom sheet */
@media (max-width: 599px) {
  .tp-backdrop { align-items: flex-end; padding: 0 }
  .tp-dialog { width: 100%; max-width: none; max-height: 92vh; border-radius: 22px 22px 0 0; padding-bottom: env(safe-area-inset-bottom); animation-name: tpSheet }
  .tp-dialog.tp-out { animation-name: tpSheetOut }
}
@keyframes tpSheet { from { opacity: .6; transform: translateY(40px) } to { opacity: 1; transform: none } }
@keyframes tpSheetOut { to { opacity: 0; transform: translateY(40px) } }

@media (prefers-reduced-motion: reduce) {
  .tp-enter, .tp-glow-a, .tp-backdrop, .tp-dialog { animation: none !important }
  .tp-cards.tp-armed .tp-card-wrap { opacity: 1; transform: none; transition: none }
  .tp-card, .tp-arrow { transition: none }
}
`;

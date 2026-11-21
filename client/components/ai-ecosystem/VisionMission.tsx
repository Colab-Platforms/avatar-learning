"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const ROTATE_MS = 6000;

const ico = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

// Texts for 01–03 follow the site's existing "Learn / Talent / Solutions / Implementation" copy;
// 04 is from the design reference.
const PILLARS = [
  {
    name: "Teach",
    text: "Practical AI training for your whole team, so everyone can use AI confidently in their daily work.",
    icon: (
      <svg {...ico}>
        <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" />
        <path d="M6 11.5v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" />
      </svg>
    ),
  },
  {
    name: "Automate",
    text: "Ready-made and custom tools that take repetitive work off your team, across sales, HR, orders and inventory.",
    icon: (
      <svg {...ico}>
        <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />
      </svg>
    ),
  },
  {
    name: "Connect",
    text: "Skilled AI talent on demand, and new tools connected to the systems your business already uses.",
    icon: (
      <svg {...ico}>
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </svg>
    ),
  },
  {
    name: "Research",
    text: "Advancing research in local, multilingual and enterprise AI systems.",
    icon: (
      <svg {...ico}>
        <path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3L14 9.5V3" />
        <path d="M7.5 14h9" />
      </svg>
    ),
  },
];

const mono: React.CSSProperties = { fontFamily: "var(--font-geist-mono),ui-monospace,monospace" };
const pad2 = (n: number) => String(n).padStart(2, "0");

/** Vision, mission and the four pillars (auto-advancing tabs, like the reference). */
export function VisionMission() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    const t = window.setTimeout(() => {
      setActive((i) => (i + 1) % PILLARS.length);
      setCycle((c) => c + 1);
    }, ROTATE_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, reduced, cycle]);

  const go = (i: number, focus = false) => {
    const n = (i + PILLARS.length) % PILLARS.length;
    setActive(n);
    setCycle((c) => c + 1);
    if (focus) tabRefs.current[n]?.focus();
  };
  const p = PILLARS[active];

  return (
    <motion.div
      {...reveal(0)}
      data-vision-mission=""
      style={{
        position: "relative",
        marginTop: "clamp(96px,11vw,150px)",
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,.09)",
        background: "linear-gradient(180deg,rgba(16,22,32,.95),rgba(10,13,19,.95))",
        padding: "clamp(28px,4.6vw,56px)",
        overflow: "hidden",
      }}
    >
      <div aria-hidden="true" style={{ position: "absolute", right: "-10%", top: "-30%", width: "45%", height: "70%", pointerEvents: "none", background: "radial-gradient(closest-side,rgba(80,120,150,.10),transparent)" }} />

      <div className="relative grid grid-cols-1 gap-8 min-[860px]:grid-cols-2 min-[860px]:gap-[clamp(32px,4vw,56px)]">
        {[
          { label: "Our vision", text: "A single, trusted AI platform where anyone can learn, build, deploy and scale AI, responsibly.", cyan: true },
          { label: "Our mission", text: "Make AI tools, automation and training practical, affordable and easy to scale for every business.", cyan: false },
        ].map((b) => (
          <div key={b.label} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ ...mono, fontSize: 12.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: b.cyan ? "#6fe3ef" : "#c3cad3" }}>{b.label}</span>
            <h3 style={{ margin: 0, fontSize: "clamp(24px,2.2vw,32px)", lineHeight: 1.25, letterSpacing: "-0.025em", fontWeight: 600, color: "#f4f6f8", textWrap: "balance" }}>{b.text}</h3>
          </div>
        ))}
      </div>

      <div
        className="relative mt-[clamp(32px,4vw,52px)] grid grid-cols-1 gap-4 min-[1024px]:grid-cols-[minmax(0,390px)_1fr]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        <div role="tablist" aria-label="What we do" aria-orientation="vertical" className="flex flex-col gap-[9px]">
          {PILLARS.map((x, i) => {
            const on = i === active;
            return (
              <button
                key={x.name}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`vm-tab-${i}`}
                aria-selected={on}
                aria-controls="vm-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => go(i)}
                onKeyDown={(e) => {
                  if (["ArrowDown", "ArrowRight"].includes(e.key)) { e.preventDefault(); go(i + 1, true); }
                  if (["ArrowUp", "ArrowLeft"].includes(e.key)) { e.preventDefault(); go(i - 1, true); }
                }}
                className={`relative overflow-hidden text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef] ${on ? "" : "hover:border-white/[0.16] hover:bg-white/[0.04]"}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  minHeight: 74,
                  padding: "0 20px",
                  borderRadius: 12,
                  border: `1px solid ${on ? "rgba(111,227,239,.45)" : "rgba(255,255,255,.08)"}`,
                  background: on ? "rgba(111,227,239,.06)" : "rgba(255,255,255,.025)",
                  cursor: "pointer",
                }}
              >
                <span style={{ ...mono, fontSize: 12, fontWeight: on ? 700 : 500, color: on ? "#6fe3ef" : "#8a939e" }}>{pad2(i + 1)}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: on ? "#f4f6f8" : "#c3cad3" }}>{x.name}</span>
                {on && (
                  <span
                    key={`${cycle}-${paused}-${reduced}`}
                    aria-hidden="true"
                    className={paused || reduced ? undefined : "vm-progress"}
                    style={{ position: "absolute", left: 0, bottom: 0, height: 2, width: paused || reduced ? "100%" : undefined, background: "#6fe3ef", boxShadow: "0 0 10px rgba(111,227,239,.6)", animationDuration: `${ROTATE_MS}ms` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          id="vm-panel"
          role="tabpanel"
          aria-labelledby={`vm-tab-${active}`}
          aria-live="polite"
          style={{
            position: "relative",
            borderRadius: 18,
            border: "1px solid rgba(143,190,200,.18)",
            background: "radial-gradient(60% 70% at 92% 18%,rgba(70,160,175,.20),transparent 60%),rgba(12,16,22,.9)",
            padding: "clamp(24px,2.6vw,32px)",
            display: "flex",
            flexDirection: "column",
            minHeight: 320,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#6fe3ef", color: "#07131a", boxShadow: "0 8px 30px -8px rgba(111,227,239,.6)" }}>
              {p.icon}
            </span>
            <span style={{ ...mono, marginTop: 20, fontSize: 12.5, letterSpacing: ".1em", color: "#8a939e" }}>
              {pad2(active + 1)} / {pad2(PILLARS.length)}
            </span>
          </div>
          <h4 key={p.name} className="vm-fade" style={{ margin: "18px 0 0", fontSize: "clamp(26px,2.3vw,32px)", lineHeight: 1.2, letterSpacing: "-0.025em", fontWeight: 600, color: "#f4f6f8" }}>
            {p.name}
          </h4>
          <p key={`${p.name}-t`} className="vm-fade" style={{ margin: "14px 0 0", maxWidth: 460, fontSize: 16, lineHeight: 1.65, color: "#c3cad3" }}>
            {p.text}
          </p>
          <div style={{ marginTop: "auto", paddingTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.08)" }}>
              {[
                { d: -1, label: "Previous", ch: "←" },
                { d: 1, label: "Next", ch: "→" },
              ].map((b) => (
                <button
                  key={b.label}
                  type="button"
                  aria-label={b.label}
                  onClick={() => go(active + b.d)}
                  className="border border-white/[0.16] bg-transparent text-[#f4f6f8] transition-colors hover:border-white/35 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]"
                  style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" }}
                >
                  {b.ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vmProgress { from { width: 0% } to { width: 100% } }
        .vm-progress { width: 0%; animation-name: vmProgress; animation-timing-function: linear; animation-fill-mode: forwards; }
        @keyframes vmFade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .vm-fade { animation: vmFade .35s ease both; }
        @media (prefers-reduced-motion: reduce) { .vm-fade { animation: none } }
      `}</style>
    </motion.div>
  );
}

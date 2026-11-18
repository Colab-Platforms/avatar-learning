"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { STEPS } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const glass: React.CSSProperties = { borderRadius: 12, border: "1px solid rgba(255,255,255,.1)", background: "rgba(12,14,19,.92)" };
const mono: React.CSSProperties = { fontFamily: "var(--font-geist-mono),monospace", fontSize: 11, letterSpacing: ".08em" };

function Chip({ t, d, hot }: { t: string; d: number; hot?: boolean }) {
  return (
    <span
      className={styles.fadeIn}
      style={{
        padding: "7px 12px",
        borderRadius: 999,
        background: hot ? "rgba(111,227,239,.12)" : "rgba(12,14,19,.92)",
        border: `1px solid ${hot ? "rgba(111,227,239,.35)" : "rgba(255,255,255,.12)"}`,
        color: hot ? "#bff5fa" : "#dfe4ea",
        fontSize: 12,
        whiteSpace: "nowrap",
        animationDelay: `${d}s`,
      }}
    >
      {t}
    </span>
  );
}

/** Faithful port of the reference's `howStage()` — the large visualization
 * shown next to the step list, one distinct scene per step. */
function StepViz({ index, scale }: { index: number; scale: number }) {
  let content: React.ReactNode;

  if (index === 0) {
    const items = ["Leads", "Follow-ups", "Orders", "Stock", "Content", "Reports"];
    const hot = [1, 3];
    content = (
      <div style={{ width: 444, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ ...glass, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#dfe4ea" }}>Reviewing your business</span>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
            <div className={styles.fill} style={{ height: "100%", background: "linear-gradient(90deg,#6b7cff,#6fe3ef)", transformOrigin: "0 50%", animationDuration: "3s" }} />
          </div>
          <span style={{ ...mono, color: "#8fe9f2" }}>SCANNING</span>
        </div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
          {items.map((l, j) => {
            const on = hot.includes(j);
            return (
              <div key={l} style={{ ...glass, position: "relative", height: 84, boxSizing: "border-box", padding: 12, display: "flex", flexDirection: "column", gap: 8, borderColor: "rgba(255,255,255,.08)" }}>
                {on && (
                  <span
                    className={styles.fadeIn}
                    style={{ position: "absolute", inset: -1, borderRadius: 12, border: "1px solid rgba(111,227,239,.6)", background: "rgba(111,227,239,.08)", boxShadow: "0 0 24px rgba(111,227,239,.2)", animationDelay: `${1.1 + j * 0.25}s` }}
                  />
                )}
                <span style={{ position: "relative", fontSize: 13, color: on ? "#e9fdff" : "#a3abb5" }}>{l}</span>
                <div style={{ position: "relative", height: 5, width: "80%", borderRadius: 3, background: "rgba(255,255,255,.08)" }} />
                <div style={{ position: "relative", height: 5, width: "55%", borderRadius: 3, background: "rgba(255,255,255,.06)" }} />
                {on && (
                  <span className={styles.fadeIn} style={{ position: "absolute", right: 12, top: 14, width: 8, height: 8, borderRadius: "50%", background: "#6fe3ef", boxShadow: "0 0 10px #6fe3ef", animationDelay: `${1.1 + j * 0.25}s` }}>
                    <span className={styles.ping} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid #6fe3ef" }} />
                  </span>
                )}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: -8, right: -8, top: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div className={styles.scan} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 40, background: "linear-gradient(180deg,transparent,rgba(111,227,239,.16))", borderBottom: "1px solid #6fe3ef", boxShadow: "0 6px 16px rgba(111,227,239,.25)" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className={styles.fadeIn} style={{ ...mono, color: "#98a1ac", marginRight: 4, animationDelay: "1.8s" }}>
            WHERE AI HELPS
          </span>
          <Chip t="Automate follow-ups" d={2} hot />
          <Chip t="Track stock live" d={2.2} hot />
        </div>
      </div>
    );
  } else if (index === 1) {
    const W = 460;
    const H = 350;
    const cx = 230;
    const cy = 165;
    const nodes = ["CRM", "OMS", "AI Content", "LMS", "Your systems"];
    const pos = nodes.map((_, j) => {
      const a = -Math.PI / 2 + (j * 2 * Math.PI) / 5;
      return [cx + Math.cos(a) * 170, cy + Math.sin(a) * 128] as const;
    });
    content = (
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {pos.map(([x, y], j) => (
            <g key={nodes[j]}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(111,227,239,.35)" strokeWidth={1.2} strokeDasharray="4 6" className={styles.dash} />
              <circle r={3} fill="#e9fdff" style={{ filter: "drop-shadow(0 0 4px #6fe3ef)" }}>
                <animateMotion dur="2.4s" begin={`${j * 0.45}s`} repeatCount="indefinite" path={`M${cx},${cy} L${x.toFixed(1)},${y.toFixed(1)}`} />
              </circle>
            </g>
          ))}
        </svg>
        <div className={styles.glow} style={{ position: "absolute", left: cx - 36, top: cy - 36, width: 72, height: 72, borderRadius: 20, background: "radial-gradient(circle,#8fe9f2,#3b4fd6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #07080b" }} />
        </div>
        {pos.map(([x, y], j) => (
          <div key={nodes[j]} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)" }}>
            <span className={styles.fadeIn} style={{ display: "block", ...glass, padding: "9px 14px", whiteSpace: "nowrap", fontSize: 13, color: "#e9fdff", borderColor: j === 4 ? "rgba(255,255,255,.18)" : "rgba(111,227,239,.35)", animationDelay: `${0.2 + j * 0.15}s` }}>
              {nodes[j]}
            </span>
          </div>
        ))}
        <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)" }}>
          <span className={styles.fadeIn} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(111,227,239,.12)", border: "1px solid rgba(111,227,239,.35)", color: "#bff5fa", fontSize: 12, whiteSpace: "nowrap", animationDelay: "1.2s" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#6fe3ef", color: "#07080b", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>✓</span>
            Team trained on every tool
          </span>
        </div>
      </div>
    );
  } else {
    const pts: [number, number][] = [[0, 170], [70, 150], [140, 156], [210, 112], [280, 96], [350, 56], [420, 28]];
    const d = "M" + pts.map((p) => p.join(",")).join(" L");
    const area = d + " L420,200 L0,200 Z";
    content = (
      <div style={{ width: 444, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ ...glass, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#dfe4ea" }}>Monthly review</span>
          <span style={{ ...mono, padding: "4px 10px", borderRadius: 999, background: "rgba(111,227,239,.12)", color: "#8fe9f2" }}>ON TRACK</span>
        </div>
        <div style={{ ...glass, position: "relative", padding: "40px 12px 12px" }}>
          <svg width={420} height={200} viewBox="0 0 420 200" style={{ display: "block", overflow: "visible" }}>
            <defs>
              <linearGradient id="howArea" x1={0} y1={0} x2={0} y2={1}>
                <stop offset={0} stopColor="#6fe3ef" stopOpacity={0.3} />
                <stop offset={1} stopColor="#6fe3ef" stopOpacity={0} />
              </linearGradient>
            </defs>
            {[50, 100, 150].map((y) => (
              <line key={y} x1={0} x2={420} y1={y} y2={y} stroke="rgba(255,255,255,.06)" />
            ))}
            <path d={area} fill="url(#howArea)" className={styles.fadeIn} style={{ animationDelay: "0.8s" }} />
            <path d={d} fill="none" stroke="#8fe9f2" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={600} className={styles.draw} style={{ filter: "drop-shadow(0 0 6px rgba(111,227,239,.6))" }} />
            {[1, 3, 5, 6].map((pi, j) => (
              <circle
                key={pi}
                cx={pts[pi][0]}
                cy={pts[pi][1]}
                r={pi === 6 ? 6 : 4}
                fill={pi === 6 ? "#e9fdff" : "#0c0e13"}
                stroke="#8fe9f2"
                strokeWidth={2}
                className={styles.fadeIn}
                style={{ animationDelay: `${0.4 + j * 0.4}s`, filter: pi === 6 ? "drop-shadow(0 0 8px #6fe3ef)" : "none" }}
              />
            ))}
          </svg>
          {([[1, "+ CRM"], [3, "+ OMS"], [5, "+ LMS"]] as const).map(([pi, t], j) => (
            <div key={t} style={{ position: "absolute", left: 12 + pts[pi][0], top: 40 + pts[pi][1] - 22, transform: "translate(-50%,-100%)" }}>
              <Chip t={t} d={0.6 + j * 0.4} hot={j === 2} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }} className={styles.fadeIn}>
      <div style={{ flex: "none", transform: `scale(${scale})`, transformOrigin: "50% 50%" }}>{content}</div>
    </div>
  );
}

export function PathToAdoptionSection() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const [width, setWidth] = useState(1440);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive((i) => (i + 1) % STEPS.length), 4500);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const wide = width >= 1000;
  const vizScale = wide ? 1 : Math.min(1, (width - 72) / 460);

  return (
    <section id="how" data-screen-label="04 How it works" style={{ scrollMarginTop: 68, position: "relative", padding: "clamp(56px,7vw,96px) 24px" }}>
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(28px,5vw,56px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            How it works
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, textWrap: "balance", background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Three steps. We guide every one.
          </motion.h2>
        </div>

        <motion.div
          {...reveal(0)}
          style={{
            position: "relative",
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,.08)",
            background: "linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.008))",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
          }}
        >
          <div style={{ order: 0, padding: "20px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {STEPS.map((s, i) => {
              const on = i === active;
              const done = active > i;
              return (
                <button
                  key={s.n}
                  onClick={() => {
                    setActive(i);
                    setAuto(false);
                  }}
                  onMouseEnter={() => {
                    setActive(i);
                    setAuto(false);
                  }}
                  style={{
                    textAlign: "left",
                    cursor: "pointer",
                    border: 0,
                    background: "none",
                    display: "grid",
                    gridTemplateColumns: "minmax(0,1fr)",
                    gap: 16,
                    padding: "24px 0",
                    borderBottom: i < 2 ? "1px solid rgba(255,255,255,.08)" : 0,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span
                      style={{
                        flex: "none",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontFamily: "var(--font-geist-mono),monospace",
                        border: `1px solid ${on || done ? "rgba(111,227,239,.6)" : "rgba(255,255,255,.14)"}`,
                        background: on ? "#6fe3ef" : done ? "rgba(111,227,239,.12)" : "#0b0d12",
                        color: on ? "#07080b" : done ? "#8fe9f2" : "#98a1ac",
                        boxShadow: on ? "0 0 0 6px rgba(111,227,239,.12),0 0 24px rgba(111,227,239,.6)" : "none",
                        transition: "all .4s",
                      }}
                    >
                      {s.n}
                    </span>
                    <strong style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: on ? "#ffffff" : "#c9cfd6" }}>{s.t}</strong>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: on ? "1fr" : "0fr",
                      opacity: on ? 1 : 0,
                      overflow: "hidden",
                      transition: "grid-template-rows .5s cubic-bezier(.2,.7,.1,1), opacity .4s",
                      paddingLeft: 46,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#a3abb5", minHeight: 0 }}>{s.d}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div
            style={{
              order: 1,
              position: "relative",
              height: "clamp(320px,40vw,500px)",
              overflow: "hidden",
              boxShadow: "inset 1px 0 0 rgba(255,255,255,.08)",
              background: "radial-gradient(ellipse 60% 55% at 50% 50%,rgba(111,227,239,.09),transparent 70%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px)",
                backgroundSize: "22px 22px",
                WebkitMaskImage: "radial-gradient(ellipse at 50% 50%,#000,transparent 75%)",
                maskImage: "radial-gradient(ellipse at 50% 50%,#000,transparent 75%)",
              }}
            />
            {STEPS.map((_, i) =>
              i === active ? <StepViz key={i} index={i} scale={vizScale} /> : null,
            )}
            <span style={{ position: "absolute", left: 20, top: 18, fontFamily: "var(--font-geist-mono),monospace", fontSize: 11, letterSpacing: ".1em", color: "#98a1ac" }}>
              STEP 0{active + 1} / 03
            </span>
          </div>
          <div
            style={{
              order: 2,
              gridColumn: "1 / -1",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "left",
              gap: 20,
              flexWrap: "wrap",
              padding: "clamp(20px,2.6vw,26px) clamp(20px,3vw,36px)",
              borderTop: "1px solid rgba(255,255,255,.08)",
              background: "linear-gradient(90deg,rgba(111,227,239,.05),rgba(255,255,255,0) 70%)",
            }}
          >
            <div style={{ flex: 1, minWidth: "min(100%,280px)", display: "flex", flexDirection: "column", gap: 6 }}>
              <strong style={{ fontSize: "clamp(18px,1.8vw,20px)", fontWeight: 500, letterSpacing: "-0.01em" }}>
                Not sure where to start? We&apos;ll help you decide.
              </strong>
              <span style={{ fontSize: 15, lineHeight: 1.5, color: "#a3abb5" }}>Book a free consultation and we&apos;ll suggest the right first step for your business.</span>
            </div>
            <a
              href="#contact"
              style={{
                flex: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
                boxSizing: "border-box",
                background: "#f4f6f8",
                color: "#07080b",
                padding: "0 24px",
                borderRadius: 999,
                fontWeight: 500,
                fontSize: 15,
              }}
            >
              Help me choose
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

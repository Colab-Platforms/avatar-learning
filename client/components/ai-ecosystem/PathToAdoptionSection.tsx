"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { STEPS } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

function StepViz({ index }: { index: number }) {
  const wrap = (children: React.ReactNode) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 250,
          height: 150,
          borderRadius: 16,
          border: "1px solid #22262e",
          background: "#0c0e13",
          boxShadow: "0 20px 50px rgba(0,0,0,.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (index === 0) {
    return wrap(
      <div style={{ position: "relative", width: 200, height: 110, borderRadius: 10, border: "1px solid #262a33", background: "#11141a", overflow: "hidden", padding: 14, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 9 }}>
        {[80, 60, 90, 45, 70].map((w, k) => (
          <div key={k} style={{ height: 7, width: `${w}%`, borderRadius: 4, background: k === 2 ? "#3f8f99" : "#252931" }} />
        ))}
        <div className={styles.scan} style={{ position: "absolute", left: 0, right: 0, top: 0, height: 36, background: "linear-gradient(180deg,transparent,rgba(111,227,239,.18))", borderBottom: "1px solid #6fe3ef" }} />
      </div>,
    );
  }
  if (index === 1) {
    const lines: [number, number, number, number][] = [
      [30, 30, 110, 60],
      [30, 90, 110, 60],
      [110, 60, 190, 60],
    ];
    const nodes: [number, number][] = [[30, 30], [30, 90], [190, 60]];
    return wrap(
      <div style={{ position: "relative", width: 220, height: 120 }}>
        <svg width={220} height={120} style={{ position: "absolute", inset: 0 }}>
          {lines.map((l, k) => (
            <line key={k} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#6fe3ef" strokeWidth={1.5} strokeDasharray="6 6" className={styles.dash} />
          ))}
        </svg>
        {nodes.map((p, k) => (
          <div key={k} style={{ position: "absolute", left: p[0] - 14, top: p[1] - 14, width: 28, height: 28, borderRadius: 8, border: "1px solid #353a44", background: "#161a21" }} />
        ))}
        <div className={styles.glow} style={{ position: "absolute", left: 90, top: 40, width: 40, height: 40, borderRadius: 12, background: "radial-gradient(circle,#8fe9f2,#3b4fd6)" }} />
      </div>,
    );
  }
  return wrap(
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
      {[40, 55, 70, 85, 100].map((v, k) => (
        <div
          key={k}
          className={styles.grow}
          style={{
            width: 22,
            height: `${v}%`,
            borderRadius: "6px 6px 2px 2px",
            background: k === 4 ? "linear-gradient(180deg,#8fe9f2,#2c6a73)" : "#272b33",
            transformOrigin: "50% 100%",
            animationDelay: `${k * 0.2}s`,
            boxShadow: k === 4 ? "0 0 20px rgba(111,227,239,.4)" : "none",
          }}
        />
      ))}
    </div>,
  );
}

export function PathToAdoptionSection() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive((i) => (i + 1) % STEPS.length), 4500);
    return () => clearInterval(id);
  }, [auto]);

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
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
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
              i === active ? <div key={i} className={styles.fadeIn} style={{ position: "absolute", inset: 0 }}><StepViz index={i} /></div> : null,
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

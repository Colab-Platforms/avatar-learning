"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BARRIER_STATS, GAP_CARDS, type GapCard } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

function Waffle({ lit }: { lit: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "repeat(10,minmax(0,1fr))",
        gap: "1.8%",
        width: "min(400px, 80vw)",
      }}
    >
      {Array.from({ length: 100 }, (_, i) => {
        const on = i < lit;
        return (
          <span
            key={i}
            style={{
              width: "100%",
              aspectRatio: "1",
              borderRadius: "50%",
              background: on ? "#bff5fa" : "rgba(255,255,255,.07)",
              boxShadow: on ? "0 0 10px rgba(111,227,239,.7)" : "none",
              transform: on ? "scale(1)" : "scale(.82)",
              transition: `background .45s ease ${i * 7}ms, box-shadow .45s ease ${i * 7}ms, transform .45s ease ${i * 7}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

function GapViz({ theme, on }: { theme: GapCard["theme"]; on: boolean }) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "52%",
    pointerEvents: "none",
    overflow: "hidden",
    WebkitMaskImage: "linear-gradient(180deg,transparent 0%,#000 40%)",
    maskImage: "linear-gradient(180deg,transparent 0%,#000 40%)",
    transition: "transform .7s cubic-bezier(.2,.7,.1,1), opacity .5s",
    transform: on ? "translateY(28px) scale(.96)" : "none",
    opacity: on ? 0.6 : 1,
  };

  if (theme === "violet") {
    return (
      <div style={base}>
        <div
          className={styles.breathe}
          style={{
            position: "absolute",
            left: "50%",
            bottom: -180,
            width: 360,
            height: 360,
            marginLeft: -180,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(143,233,242,.5),rgba(107,124,255,.35) 40%,transparent 70%)",
            filter: "blur(6px)",
          }}
        />
        {[300, 220, 140].map((d, k) => (
          <div
            key={k}
            className={k % 2 ? styles.spinr : styles.spin}
            style={{
              position: "absolute",
              left: "50%",
              bottom: -d / 2,
              width: d,
              height: d,
              marginLeft: -d / 2,
              borderRadius: "50%",
              border: `1px solid rgba(255,255,255,${0.16 + k * 0.06})`,
              animationDuration: `${26 - k * 6}s`,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "calc(50% - 3px)",
                top: -3,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#e9fdff",
                boxShadow: "0 0 10px #8fe9f2",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (theme === "dark") {
    return (
      <div style={{ ...base, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(9,10px)", gap: 12 }}>
          {Array.from({ length: 45 }, (_, k) => {
            const lit = (k * 7) % 9 < (on ? 7 : 3);
            return (
              <span
                key={k}
                className={lit ? styles.breathe : undefined}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: lit ? "#bff5fa" : "rgba(255,255,255,.1)",
                  boxShadow: lit ? "0 0 10px rgba(111,227,239,.8)" : "none",
                  transition: `background .4s ease ${k * 12}ms, box-shadow .4s ease ${k * 12}ms`,
                  animationDuration: `${2.4 + (k % 4) * 0.5}s`,
                  animationDelay: `${(k % 5) * 0.3}s`,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (theme === "light") {
    const items: [string, number, number][] = [
      ["CRM", 12, 18],
      ["OMS", 54, 6],
      ["AI Content", 8, 60],
      ["LMS", 60, 52],
    ];
    return (
      <div style={{ ...base, backgroundImage: "radial-gradient(rgba(11,13,18,.12) 1px,transparent 1px)", backgroundSize: "16px 16px" }}>
        {items.map(([l, x, y], k) => (
          <span
            key={k}
            className={styles.floaty}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              padding: "10px 16px",
              borderRadius: 12,
              background: k === 1 ? "#0b0d12" : "#fff",
              color: k === 1 ? "#8fe9f2" : "#0b0d12",
              border: `1px solid ${k === 1 ? "#0b0d12" : "rgba(11,13,18,.1)"}`,
              fontSize: 14,
              fontWeight: 500,
              boxShadow: "0 10px 30px rgba(11,13,18,.12)",
              whiteSpace: "nowrap",
              animationDuration: `${4 + k * 0.7}s`,
              animationDelay: `${k * 0.4}s`,
            }}
          >
            {l}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div style={base}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(111,227,239,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(111,227,239,.09) 1px,transparent 1px)",
          backgroundSize: "28px 28px",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 60%,#000,transparent 70%)",
          maskImage: "radial-gradient(ellipse at 50% 60%,#000,transparent 70%)",
        }}
      />
      <div style={{ position: "absolute", left: "50%", top: "55%", width: 0, height: 0 }}>
        {[0, 1, 2].map((k) => (
          <span
            key={k}
            className={styles.ping}
            style={{
              position: "absolute",
              left: -50,
              top: -50,
              width: 100,
              height: 100,
              boxSizing: "border-box",
              borderRadius: "50%",
              border: "1px solid rgba(111,227,239,.6)",
              animationDelay: `${k * 1.2}s`,
              animationDuration: "3.6s",
            }}
          />
        ))}
        <span
          style={{
            position: "absolute",
            left: -18,
            top: -18,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "radial-gradient(circle,#e9fdff,#6fe3ef 45%,#3b4fd6)",
            boxShadow: "0 0 40px rgba(111,227,239,.7)",
          }}
        />
      </div>
    </div>
  );
}

export function EcosystemOverviewSection() {
  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);
  const [seen, setSeen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(-1);
  const wafRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wafRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !seen) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % BARRIER_STATS.length), 4200);
    return () => clearInterval(id);
  }, [auto, seen]);

  const stat = BARRIER_STATS[current];

  return (
    <section
      id="why"
      data-screen-label="02 Why Avatar"
      style={{ scrollMarginTop: 68, position: "relative", padding: "clamp(56px,7vw,96px) 24px" }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 1,
          height: "clamp(36px,7vw,96px)",
          background: "linear-gradient(180deg,transparent,rgba(111,227,239,.5),transparent)",
        }}
      />
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(40px,6vw,56px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 18px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.03)",
              fontSize: 15,
              color: "#a3abb5",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Why Avatar
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{
              margin: 0,
              maxWidth: 760,
              fontSize: "clamp(34px,4.8vw,58px)",
              lineHeight: 1.04,
              letterSpacing: "-0.04em",
              fontWeight: 600,
              background: "linear-gradient(180deg,#fff 40%,#8e98a4)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Businesses want to adopt AI, but face real barriers.
          </motion.h2>
          <motion.p {...reveal(160)} style={{ margin: 0, maxWidth: 560, fontSize: 18, lineHeight: 1.5, color: "#a3abb5" }}>
            High potential, but adoption remains slow due to complexity, cost and lack of the right talent and support.
          </motion.p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
            gap: "clamp(40px,6vw,88px)",
            alignItems: "center",
          }}
        >
          <motion.div {...reveal(0)} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div
              style={{
                position: "absolute",
                inset: "-10%",
                borderRadius: "50%",
                background: "radial-gradient(circle,rgba(111,227,239,.12),transparent 65%)",
                pointerEvents: "none",
              }}
            />
            <div ref={wafRef}>
              <Waffle lit={seen ? stat.v : 0} />
            </div>
            <span style={{ position: "relative", fontSize: 14, color: "#a3abb5" }}>
              {stat.v} out of 100 &middot; {stat.t.toLowerCase()}
            </span>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, letterSpacing: ".1em", color: "#98a1ac", paddingBottom: 14 }}>
              OUT OF EVERY 100 BUSINESSES
            </span>
            <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255,255,255,.08)" }}>
              {BARRIER_STATS.map((s, i) => {
                const on = i === current;
                return (
                  <button
                    key={s.t}
                    onClick={() => {
                      setCurrent(i);
                      setAuto(false);
                    }}
                    onMouseEnter={() => {
                      setCurrent(i);
                      setAuto(false);
                    }}
                    style={{
                      position: "relative",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "grid",
                      gridTemplateColumns: "120px minmax(0,1fr)",
                      gap: 18,
                      alignItems: "center",
                      padding: "18px 4px 18px 18px",
                      border: 0,
                      borderBottom: "1px solid rgba(255,255,255,.08)",
                      background: on ? "linear-gradient(90deg,rgba(111,227,239,.07),transparent)" : "transparent",
                      color: "#f4f6f8",
                      transition: "background .4s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 14,
                        bottom: 14,
                        width: 2,
                        borderRadius: 2,
                        background: "#6fe3ef",
                        boxShadow: "0 0 10px #6fe3ef",
                        opacity: on ? 1 : 0,
                        transition: "opacity .4s",
                      }}
                    />
                    <strong style={{ fontSize: "clamp(34px,4.4vw,52px)", fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 1, color: on ? "#bff5fa" : "#5d6570", transition: "color .4s" }}>
                      {s.v}%
                    </strong>
                    <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 17, fontWeight: 500, color: on ? "#f4f6f8" : "#a3abb5", transition: "color .4s" }}>{s.t}</span>
                      <span style={{ fontSize: 14, lineHeight: 1.45, color: "#8a939e" }}>{s.d}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div {...reveal(0)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
          <span style={{ width: 1, height: 48, background: "linear-gradient(180deg,transparent,#6fe3ef)", boxShadow: "0 0 10px rgba(111,227,239,.6)" }} />
          <p
            style={{
              margin: 0,
              maxWidth: 640,
              fontSize: "clamp(24px,3vw,34px)",
              lineHeight: 1.2,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              background: "linear-gradient(90deg,#f4f6f8 20%,#8fe9f2 60%,#b5bdff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            These barriers are where Avatar comes in.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <motion.div {...reveal(0)} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
            <span style={{ fontSize: "clamp(22px,2.2vw,26px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#f4f6f8" }}>
              How Avatar closes the gap
            </span>
            <span className="hidden max-[999px]:inline" style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, letterSpacing: ".08em", color: "#98a1ac" }}>
              SWIPE →
            </span>
          </motion.div>
          <motion.div
            {...reveal(0)}
            className={styles.noScrollbar}
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "300px",
              gap: 16,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              margin: "0 -24px",
              padding: "0 24px",
            }}
          >
            {GAP_CARDS.map((c, i) => {
              const on = hoveredCard === i;
              const theme = {
                violet: { bg: "linear-gradient(165deg,#2c3196,#171a52)", border: "rgba(181,189,255,.18)", ink: "#ffffff", labelC: "#c9ceff", descC: "#e3e6ff" },
                dark: { bg: "linear-gradient(180deg,#10141b,#0a0c11)", border: "rgba(255,255,255,.08)", ink: "#f4f6f8", labelC: "#8fe9f2", descC: "#a3abb5" },
                light: { bg: "#eef1f4", border: "#eef1f4", ink: "#0b0d12", labelC: "#3a4699", descC: "#3c434c" },
                teal: { bg: "linear-gradient(180deg,#0b1a20,#081117)", border: "rgba(111,227,239,.14)", ink: "#f4f6f8", labelC: "#8fe9f2", descC: "#a3abb5" },
              }[c.theme];
              return (
                <div
                  key={c.n}
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(-1)}
                  style={{
                    scrollSnapAlign: "start",
                    position: "relative",
                    overflow: "hidden",
                    height: 380,
                    boxSizing: "border-box",
                    borderRadius: 18,
                    border: `1px solid ${theme.border}`,
                    background: theme.bg,
                    color: theme.ink,
                    transform: on ? "translateY(-6px)" : "none",
                    boxShadow: on ? "0 30px 60px -20px rgba(0,0,0,.7),0 0 40px -10px rgba(111,227,239,.3)" : "none",
                    transition: "transform .5s cubic-bezier(.2,.7,.1,1),box-shadow .5s",
                  }}
                >
                  <GapViz theme={c.theme} on={on} />
                  <div style={{ position: "relative", zIndex: 1, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 14 }}>
                    <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, lineHeight: 1.4, letterSpacing: ".08em", textTransform: "uppercase", color: theme.labelC }}>
                      {c.p}
                    </span>
                    <strong style={{ fontSize: "clamp(22px,2vw,26px)", lineHeight: 1.15, fontWeight: 600, letterSpacing: "-0.025em" }}>{c.t}</strong>
                    <span style={{ fontSize: 15, lineHeight: 1.5, color: theme.descC }}>{c.d}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

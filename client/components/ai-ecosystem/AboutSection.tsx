"use client";

import { motion } from "framer-motion";
import { ABOUT_TEXT, PILLARS } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

function Ring({ size, duration, reverse, dot }: { size: number; duration: number; reverse?: boolean; dot: string }) {
  const offset = (900 - size) / 2;
  return (
    <div
      className={reverse ? styles.spinr : styles.spin}
      style={{
        position: "absolute",
        left: offset,
        top: offset,
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,.07)",
        animationDuration: `${duration}s`,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: "calc(50% - 4px)",
          top: -4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          boxShadow: `0 0 16px 4px ${dot}`,
        }}
      />
    </div>
  );
}

function OrbitBg() {
  return (
    <div style={{ position: "relative", width: 900, height: 900 }}>
      <div style={{ position: "absolute", inset: "25%", borderRadius: "50%", background: "radial-gradient(circle,rgba(111,227,239,.16),transparent 65%)" }} />
      <Ring size={880} duration={50} dot="#6fe3ef" />
      <Ring size={640} duration={34} reverse dot="#6b7cff" />
      <Ring size={400} duration={22} dot="#8fe9f2" />
    </div>
  );
}

export function AboutSection() {
  const words = ABOUT_TEXT.split(" ");

  return (
    <section
      id="about"
      data-screen-label="06 About Avatar"
      style={{ scrollMarginTop: 68, position: "relative", overflowX: "clip", overflowY: "visible", padding: "clamp(64px,8vw,112px) 24px" }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 900,
          height: 900,
          margin: "-450px 0 0 -450px",
          opacity: 0.5,
          pointerEvents: "none",
          WebkitMaskImage: "radial-gradient(circle,#000 35%,transparent 68%)",
          maskImage: "radial-gradient(circle,#000 35%,transparent 68%)",
        }}
      >
        <OrbitBg />
      </div>

      <div style={{ position: "relative", maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 40 }}>
        <motion.div
          {...reveal(0)}
          style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
          About Avatar
        </motion.div>

        <p
          data-words
          style={{ margin: 0, maxWidth: 760, fontSize: "clamp(26px,3.6vw,42px)", lineHeight: 1.3, letterSpacing: "-0.02em", fontWeight: 500, color: "#f4f6f8" }}
        >
          {words.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0.18 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 0.4, delay: i * 0.035 }}
              style={{ display: "inline-block", marginRight: "0.28em" }}
            >
              {w}
            </motion.span>
          ))}
        </p>

        <motion.div {...reveal(0)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 24, width: "100%" }}>
          {PILLARS.map((p) => (
            <div key={p.n} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "20px 16px", borderRadius: 16, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}>
              <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#6fe3ef" }}>{p.n}</span>
              <strong style={{ fontSize: 17, fontWeight: 600, color: "#f4f6f8" }}>{p.t}</strong>
              <span style={{ fontSize: 13, lineHeight: 1.4, color: "#a3abb5" }}>{p.d}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

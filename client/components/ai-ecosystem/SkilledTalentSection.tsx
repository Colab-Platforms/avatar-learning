"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PRODUCTS, ROLES } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const glass: React.CSSProperties = { borderRadius: 14, border: "1px solid rgba(255,255,255,.1)", background: "rgba(10,12,16,.85)" };

function RoleViz({ index }: { index: number }) {
  const box: React.CSSProperties = { position: "relative", height: 300, display: "flex", alignItems: "center", justifyContent: "center" };

  if (index === 0) {
    return (
      <div className={styles.fadeIn} style={{ ...box, gap: 18 }}>
        <div style={{ ...glass, flex: "none", padding: 12, display: "grid", gridTemplateColumns: "repeat(4,22px)", gap: 5, opacity: 0.8 }}>
          {Array.from({ length: 24 }, (_, k) => (
            <span key={k} className={styles.breathe} style={{ height: 14, borderRadius: 3, background: "rgba(255,255,255,.1)", animationDuration: `${2 + (k % 5) * 0.4}s` }} />
          ))}
        </div>
        <div style={{ flex: "none", position: "relative", width: 60, height: 2, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
          <span className={styles.streakX} style={{ position: "absolute", top: 0, left: 0, width: "40%", height: 2, background: "#6fe3ef", boxShadow: "0 0 8px #6fe3ef" }} />
        </div>
        <div style={{ ...glass, flex: "none", padding: 16, width: 190, maxWidth: 260, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 12, borderColor: "rgba(111,227,239,.3)" }}>
          <span style={{ fontSize: 12, color: "#8fe9f2" }}>One system</span>
          {([["Orders", 72], ["Customers", 58], ["Sales", 86]] as const).map(([l, v], k) => (
            <div key={l} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 12, color: "#a3abb5" }}>{l}</span>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div className={styles.fill} style={{ width: `${v}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#6b7cff,#6fe3ef)", transformOrigin: "0 50%", animationDelay: `${k * 0.15}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={styles.fadeIn} style={{ ...box, flexDirection: "column", gap: 12, alignItems: "stretch", padding: "0 8px" }}>
        {["New", "Contacted", "Demo", "Won"].map((l, k) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 76, fontSize: 12, color: "#8a939e", flex: "none" }}>{l}</span>
            <div style={{ position: "relative", flex: 1, height: 34, borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
              <div
                className={styles.fill}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${95 - k * 20}%`,
                  background: k === 3 ? "linear-gradient(90deg,rgba(111,227,239,.35),rgba(111,227,239,.12))" : "rgba(255,255,255,.05)",
                  transformOrigin: "0 50%",
                  animationDelay: `${k * 0.15}s`,
                }}
              />
              <span className={styles.slideDot} style={{ position: "absolute", top: 12, left: 0, width: 10, height: 10, borderRadius: "50%", background: "#e9fdff", boxShadow: "0 0 10px #6fe3ef", animationDuration: `${3 + k * 0.5}s`, animationDelay: `${k * 0.4}s` }} />
            </div>
          </div>
        ))}
        <span style={{ alignSelf: "flex-end", fontSize: 12, color: "#8fe9f2" }}>Follow-up reminder sent</span>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={styles.fadeIn} style={{ ...box, height: 340 }}>
        <div style={{ position: "relative", width: 420, height: 340, flex: "none" }}>
          <div style={{ ...glass, position: "absolute", left: 0, top: 0, width: 250, padding: 0, overflow: "hidden", borderColor: "rgba(111,227,239,.35)", boxShadow: "0 30px 80px rgba(0,0,0,.6),0 0 60px -10px rgba(111,227,239,.35)", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <span style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#6b7cff,#6fe3ef)" }} />
              <span style={{ fontSize: 12, color: "#dfe4ea" }}>yourbrand</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#8fe9f2" }}>Instagram</span>
            </div>
            <div style={{ position: "relative", height: 130, background: "radial-gradient(circle at 30% 30%,rgba(111,227,239,.45),transparent 55%),radial-gradient(circle at 75% 70%,rgba(107,124,255,.5),transparent 55%),#0c0e13", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em", color: "#fff" }}>Festive Sale</span>
              <span style={{ position: "absolute", right: 10, top: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(7,8,11,.7)", fontSize: 11, color: "#bff5fa" }}>Up to 30% off</span>
            </div>
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
              {[96, 84, 62].map((v, j) => (
                <div key={j} className={styles.fill} style={{ height: 6, width: `${v}%`, borderRadius: 3, background: j === 0 ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.12)", transformOrigin: "0 50%", animationDelay: `${0.3 + j * 0.2}s` }} />
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {["Warm tone", "English", "Hindi"].map((t, j) => (
                  <span key={t} style={{ padding: "3px 8px", borderRadius: 999, fontSize: 10, border: `1px solid ${j === 0 ? "rgba(111,227,239,.4)" : "rgba(255,255,255,.12)"}`, color: j === 0 ? "#8fe9f2" : "#a3abb5" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.floaty} style={{ ...glass, position: "absolute", left: 262, top: 24, width: 158, padding: 12, display: "flex", flexDirection: "column", gap: 7, zIndex: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "#dfe4ea" }}>Blog post</span>
              <span style={{ color: "#8fe9f2" }}>Drafted</span>
            </div>
            {[90, 72, 80].map((v, j) => (
              <div key={j} className={styles.fill} style={{ height: 5, width: `${v}%`, borderRadius: 3, background: "rgba(255,255,255,.1)", transformOrigin: "0 50%", animationDelay: `${0.5 + j * 0.15}s` }} />
            ))}
          </div>
          <div className={styles.floaty} style={{ ...glass, position: "absolute", left: 262, top: 150, width: 158, padding: 12, display: "flex", flexDirection: "column", gap: 8, zIndex: 3 }}>
            <span style={{ fontSize: 11, color: "#8a939e" }}>This week</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <strong style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}>14</strong>
              <span style={{ fontSize: 12, color: "#a3abb5" }}>posts ready</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 28 }}>
              {[30, 50, 40, 70, 60, 90, 75].map((v, j) => (
                <span key={j} className={styles.grow} style={{ flex: 1, height: `${v}%`, borderRadius: 2, background: j === 5 ? "#6fe3ef" : "rgba(255,255,255,.12)", transformOrigin: "50% 100%", animationDelay: `${j * 0.15}s` }} />
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, top: 262, display: "flex", gap: 6, flexWrap: "wrap", width: 250, zIndex: 3 }}>
            {["Instagram", "LinkedIn", "Blog"].map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 999, background: "rgba(12,14,19,.92)", border: "1px solid rgba(255,255,255,.12)", fontSize: 11, color: "#dfe4ea" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef", boxShadow: "0 0 6px #6fe3ef" }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fadeIn} style={{ ...box, height: 300 }}>
      <div style={{ position: "relative", width: 330, height: 300, flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(111,227,239,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(111,227,239,.07) 1px,transparent 1px)",
            backgroundSize: "28px 28px",
            WebkitMaskImage: "radial-gradient(circle,#000,transparent 70%)",
            maskImage: "radial-gradient(circle,#000,transparent 70%)",
          }}
        />
        <svg width={320} height={220} style={{ position: "absolute", zIndex: 0 }}>
          {([[60, 50, 160, 110], [60, 170, 160, 110], [160, 110, 260, 110]] as const).map((l, k) => (
            <line key={k} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#6fe3ef" strokeWidth={1.5} strokeDasharray="6 6" className={styles.dash} />
          ))}
        </svg>
        {([["Your process", -100, -60], ["Your data", -100, 60], ["Custom tool", 100, 0]] as const).map(([l, x, y], k) => (
          <span
            key={l}
            className={k === 2 ? styles.glow : undefined}
            style={{
              position: "absolute",
              transform: `translate(${x}px,${y}px)`,
              padding: "8px 14px",
              borderRadius: 10,
              border: `1px solid ${k === 2 ? "rgba(111,227,239,.5)" : "rgba(255,255,255,.14)"}`,
              background: k === 2 ? "#0f2329" : "#0c0e13",
              zIndex: 2,
              color: k === 2 ? "#bff5fa" : "#dfe4ea",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </span>
        ))}
        <div className={styles.glow} style={{ position: "absolute", width: 44, height: 44, borderRadius: 12, background: "radial-gradient(circle,#8fe9f2,#3b4fd6)" }} />
      </div>
    </div>
  );
}

export function SkilledTalentSection() {
  const [role, setRole] = useState(0);
  const current = ROLES[role];
  const goTo = (i: number) => setRole((i + ROLES.length) % ROLES.length);

  return (
    <section id="who" data-screen-label="05 Who it's for" style={{ scrollMarginTop: 68, padding: "clamp(56px,7vw,96px) 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(22px,4vw,48px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Who it&apos;s for
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Built for businesses like yours
          </motion.h2>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {ROLES.map((r, i) => {
            const on = i === role;
            return (
              <button
                key={r.name}
                onClick={() => goTo(i)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "rgba(111,227,239,.5)" : "rgba(255,255,255,.1)"}`,
                  background: on ? "rgba(111,227,239,.1)" : "rgba(255,255,255,.02)",
                  color: on ? "#f4f6f8" : "#a3abb5",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {r.name}
              </button>
            );
          })}
        </div>

        <motion.div {...reveal(0)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "clamp(28px,5vw,64px)", alignItems: "center", padding: "clamp(28px,5vw,64px) 24px", borderRadius: 24, border: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h3 style={{ margin: 0, fontSize: "clamp(28px,3.4vw,42px)", lineHeight: 1.1, fontWeight: 600, letterSpacing: "-0.035em", color: "#f4f6f8" }}>{current.q}</h3>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: "#a3abb5" }}>{current.d}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#98a1ac", marginRight: 4 }}>Suggested</span>
              {current.products.map((x) => {
                const p = PRODUCTS.find((pp) => pp.name === x);
                return (
                  <span key={x} style={{ padding: "5px 12px", borderRadius: 999, background: "rgba(111,227,239,.12)", color: "#8fe9f2", fontSize: 13 }}>
                    {p?.plain || x}
                  </span>
                );
              })}
            </div>
            <a href="#contact" style={{ alignSelf: "flex-start", marginTop: 6, background: "#f4f6f8", color: "#07080b", padding: "15px 24px", borderRadius: 999, fontWeight: 500, fontSize: 15 }}>
              {current.cta}
            </a>
          </div>
          <div style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RoleViz index={role} />
          </div>
        </motion.div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {ROLES.map((r, i) => (
            <button
              key={r.name}
              aria-label={`Go to ${r.name}`}
              onClick={() => goTo(i)}
              style={{ width: i === role ? 20 : 6, height: 6, borderRadius: 999, border: 0, background: i === role ? "#6fe3ef" : "rgba(255,255,255,.2)", transition: "width .3s,background .3s", cursor: "pointer" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

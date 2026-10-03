"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FAQS } from "./data";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

export function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" data-screen-label="08 FAQ" style={{ scrollMarginTop: 68, padding: "clamp(56px,7vw,96px) 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(24px,4vw,40px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            FAQ
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Questions, answered
          </motion.h2>
        </div>

        <motion.div {...reveal(0)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((f, i) => {
            const isOpen = i === open;
            return (
              <div
                key={f.q}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${isOpen ? "rgba(111,227,239,.3)" : "rgba(255,255,255,.08)"}`,
                  background: isOpen ? "rgba(111,227,239,.04)" : "rgba(255,255,255,.02)",
                  transition: "border-color .3s, background .3s",
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    textAlign: "left",
                    border: 0,
                    background: "none",
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0,1fr) 36px",
                    alignItems: "center",
                    gap: 12,
                    padding: "22px 24px",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 13, color: isOpen ? "#6fe3ef" : "#5d6570" }}>0{i + 1}</span>
                  <strong style={{ fontSize: 17, fontWeight: 500, color: isOpen ? "#f4f6f8" : "#c9cfd6" }}>{f.q}</strong>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      border: `1px solid ${isOpen ? "#6fe3ef" : "rgba(255,255,255,.16)"}`,
                      background: isOpen ? "#6fe3ef" : "transparent",
                      color: isOpen ? "#07080b" : "#8fe9f2",
                      boxShadow: isOpen ? "0 0 18px rgba(111,227,239,.5)" : "none",
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "all .3s",
                    }}
                  >
                    ⌄
                  </span>
                </button>
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    opacity: isOpen ? 1 : 0,
                    overflow: "hidden",
                    transition: "grid-template-rows .4s cubic-bezier(.2,.7,.1,1), opacity .3s",
                  }}
                >
                  <p style={{ margin: 0, minHeight: 0, padding: "0 56px 26px 64px", fontSize: 15, lineHeight: 1.6, color: "#a3abb5" }}>{f.a}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

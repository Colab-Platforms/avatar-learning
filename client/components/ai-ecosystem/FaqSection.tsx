"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FAQS } from "./data";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

export function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" data-screen-label="08 FAQ" style={{ scrollMarginTop: 68, padding: "clamp(32px,4vw,56px) 24px clamp(56px,7vw,96px)" }}>
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
            style={{ margin: 0, fontSize: "clamp(32px,4.2vw,48px)", lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 600, background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Questions, answered
          </motion.h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          {FAQS.map((f, i) => {
            const isOpen = i === open;
            return (
              <motion.div key={f.q} {...reveal(i * 80)} style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    textAlign: "left",
                    border: 0,
                    background: "transparent",
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0,1fr) 36px",
                    alignItems: "center",
                    gap: 16,
                    padding: "22px 4px",
                    fontSize: 17,
                    fontWeight: 500,
                    transition: "color .3s",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 13, color: isOpen ? "#6fe3ef" : "#5d6570", transition: "color .3s" }}>0{i + 1}</span>
                  <span style={{ color: isOpen ? "#f4f6f8" : "#c9cfd6", transition: "color .3s" }}>{f.q}</span>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      boxSizing: "border-box",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${isOpen ? "#6fe3ef" : "rgba(255,255,255,.16)"}`,
                      background: isOpen ? "#6fe3ef" : "transparent",
                      color: isOpen ? "#07080b" : "#8fe9f2",
                      boxShadow: isOpen ? "0 0 18px rgba(111,227,239,.5)" : "none",
                      transition: "background .35s,border-color .35s,color .35s,box-shadow .35s",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .45s cubic-bezier(.2,.7,.1,1)" }}>
                      <path d="M3 5.25L7 9.25L11 5.25" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: "grid-template-rows .45s cubic-bezier(.2,.7,.1,1)",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <p style={{ margin: 0, padding: "0 56px 26px 64px", fontSize: 15, lineHeight: 1.6, color: "#a3abb5", opacity: isOpen ? 1 : 0, transition: "opacity .4s ease" }}>{f.a}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

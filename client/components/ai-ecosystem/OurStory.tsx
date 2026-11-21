"use client";

import { motion } from "framer-motion";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const PANELS = [
  {
    n: "01",
    label: "The belief",
    title: "AI shouldn't be just for big tech.",
    text: "Avatar AI began with one belief: AI should not be limited to large tech companies or people with deep technical skills.",
    chips: ["Open to everyone", "No deep tech skills", "Built for any budget"],
    accent: false,
  },
  {
    n: "02",
    label: "Today",
    title: "One AI ecosystem for every team.",
    text: "That belief has grown into a complete AI ecosystem, so businesses can go from learning about AI to using it every day.",
    chips: ["AI education", "AI agent marketplace", "Business automation"],
    accent: true,
  },
];

/** "Our story" block shown below the About hero: the question, then belief → today. */
export function OurStory() {
  return (
    <div style={{ position: "relative", maxWidth: 1080, margin: "clamp(72px,9vw,120px) auto 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(28px,3.4vw,40px)" }}>
      <motion.div
        {...reveal(0)}
        style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
        Our story
      </motion.div>

      <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
        {/* big faint quotation mark behind the question */}
        <span
          aria-hidden="true"
          style={{ position: "absolute", left: "50%", top: "clamp(-78px,-6vw,-48px)", transform: "translateX(-50%)", fontSize: "clamp(140px,14vw,210px)", lineHeight: 1, fontWeight: 800, fontFamily: "Georgia, 'Times New Roman', serif", color: "rgba(255,255,255,.05)", pointerEvents: "none", userSelect: "none" }}
        >
          &ldquo;
        </span>
        <motion.h2
          {...reveal(80)}
          style={{ position: "relative", margin: 0, maxWidth: 830, textAlign: "center", fontSize: "clamp(28px,3.4vw,48px)", lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 500, color: "#f4f6f8", textWrap: "balance" }}
        >
          We started with one question: what if AI were open to anyone, whatever their background, budget or technical skill?
        </motion.h2>
      </div>

      <motion.div
        {...reveal(160)}
        className="grid grid-cols-1 min-[860px]:grid-cols-2"
        style={{
          position: "relative",
          width: "100%",
          borderRadius: 24,
          border: "1px solid rgba(143,190,200,.2)",
          background: "#0b0c10",
          overflow: "hidden",
          boxShadow: "0 40px 90px -40px rgba(111,227,239,.18)",
        }}
      >
        {PANELS.map((p, i) => (
          <div
            key={p.n}
            className={i === 0 ? "border-b border-white/[0.07] min-[860px]:border-b-0 min-[860px]:border-r" : ""}
            style={{
              position: "relative",
              padding: "clamp(28px,4vw,48px)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: p.accent ? "radial-gradient(120% 90% at 70% 10%,rgba(70,160,175,.16),transparent 60%),linear-gradient(180deg,rgba(111,227,239,.03),transparent)" : undefined,
            }}
          >
            {/* outlined number */}
            <span
              aria-hidden="true"
              style={{
                fontSize: "clamp(64px,7vw,96px)",
                lineHeight: 0.9,
                fontWeight: 500,
                letterSpacing: "-0.04em",
                color: "transparent",
                WebkitTextStroke: `1.5px ${p.accent ? "rgba(111,227,239,.45)" : "rgba(255,255,255,.16)"}`,
              }}
            >
              {p.n}
            </span>
            <span style={{ marginTop: 8, fontFamily: "var(--font-geist-mono),ui-monospace,monospace", fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: p.accent ? "#6fe3ef" : "#8a939e" }}>
              {p.label}
            </span>
            <h3 style={{ margin: 0, fontSize: "clamp(22px,2vw,27px)", lineHeight: 1.25, letterSpacing: "-0.02em", fontWeight: 600, color: "#f4f6f8" }}>{p.title}</h3>
            <p style={{ margin: 0, maxWidth: 440, fontSize: 16, lineHeight: 1.75, color: p.accent ? "#c3cad3" : "#a3abb5" }}>{p.text}</p>
            {p.accent && (
              // Arrow on the divider: on the left edge when side by side (→), on the top edge when stacked (↓).
              <span
                aria-hidden="true"
                className="left-1/2 top-0 rotate-90 min-[860px]:left-0 min-[860px]:top-1/2 min-[860px]:rotate-0"
                style={{
                  position: "absolute",
                  zIndex: 2,
                  width: 44,
                  height: 44,
                  translate: "-50% -50%",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(111,227,239,.45)",
                  background: "#0b0d12",
                  color: "#c3f4f8",
                  fontSize: 16,
                  boxShadow: "0 0 24px rgba(111,227,239,.25)",
                }}
              >
                →
              </span>
            )}
            <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {p.chips.map((c) => (
                <li
                  key={c}
                  style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${p.accent ? "rgba(111,227,239,.22)" : "rgba(255,255,255,.12)"}`, background: p.accent ? "rgba(111,227,239,.04)" : "rgba(255,255,255,.02)", fontSize: 13.5, color: "#e6eaee", whiteSpace: "nowrap" }}
                >
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}

      </motion.div>
    </div>
  );
}

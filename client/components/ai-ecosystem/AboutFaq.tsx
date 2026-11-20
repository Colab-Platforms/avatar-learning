"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

// Q1 is from the design reference; Q2–Q5 restate facts already on the site
// (pillars, tools, the "How it works" steps, investor filings, the main FAQ).
const QA = [
  {
    q: "Who owns Avatar AI?",
    a: "Avatar AI is a brand of Avatar Industries Limited (formerly ASL Industries Limited), a company listed on the NSE under the symbol AVATAR, with its registered office in Mumbai.",
  },
  {
    q: "What is the Avatar AI ecosystem?",
    a: "It brings together everything a business needs to adopt AI: ready-made and custom tools, AI training for your whole team, skilled AI talent on demand, and setup with ongoing support.",
  },
  {
    q: "How does Avatar AI help businesses with automation?",
    a: "Tools like CRM, OMS, IMS, HRMS, Recruitment CRM and Script Automation take repetitive work off your team. We set up the right tools, connect them to your existing systems and train your team to use them.",
  },
  {
    q: "Is Avatar Industries a listed company?",
    a: "Yes. Avatar Industries Limited is listed on the National Stock Exchange's SME platform under the symbol AVATAR.",
  },
  {
    q: "Can my team learn AI with Avatar AI?",
    a: "Yes. Every setup includes hands-on training, so your team knows how to use the tools in their daily work, and our LMS offers ongoing learning as your needs grow.",
  },
];

const mono: React.CSSProperties = { fontFamily: "var(--font-geist-mono),ui-monospace,monospace" };

function Chevron({ up }: { up: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: up ? "rotate(180deg)" : undefined, transition: "transform .25s" }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** "About Avatar AI, answered": accordion of company questions (one open at a time). */
export function AboutFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="relative mt-[clamp(96px,11vw,150px)] grid grid-cols-1 gap-10 min-[960px]:grid-cols-[1fr_minmax(0,654px)] min-[960px]:gap-[clamp(48px,7vw,120px)]">
      <div aria-hidden="true" style={{ position: "absolute", left: "45%", top: "10%", width: "40%", height: "70%", pointerEvents: "none", background: "radial-gradient(closest-side,rgba(60,140,150,.10),transparent)" }} />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
        <motion.div
          {...reveal(0)}
          style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
          FAQ
        </motion.div>
        <motion.h2
          {...reveal(80)}
          style={{
            margin: "clamp(18px,2vw,24px) 0 0",
            fontSize: "clamp(36px,3.6vw,52px)",
            lineHeight: 1.06,
            letterSpacing: "-0.035em",
            fontWeight: 600,
            background: "linear-gradient(180deg,#ffffff 0%,#f4f6f8 42%,#a9b1ba 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          <span className="min-[640px]:block">About Avatar </span>
          <span className="min-[640px]:block">AI, answered</span>
        </motion.h2>
        <motion.p {...reveal(160)} style={{ margin: "clamp(16px,2vw,24px) 0 0", maxWidth: 430, fontSize: "clamp(15px,1.15vw,17px)", lineHeight: 1.65, color: "#a3abb5" }}>
          The essentials about who we are, who&apos;s behind us and how the Avatar AI ecosystem works.
        </motion.p>
        <motion.a
          {...reveal(240)}
          href="/adoption/book-demo"
          className="transition-colors hover:border-[#6fe3ef]/45 hover:bg-[#6fe3ef]/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]"
          style={{ marginTop: "clamp(22px,2.4vw,28px)", display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 20px 14px 16px", borderRadius: 14, border: "1px solid rgba(111,227,239,.22)", background: "rgba(111,227,239,.03)", textDecoration: "none" }}
        >
          <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#6fe3ef", color: "#07131a", fontWeight: 700, fontSize: 17 }}>?</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <strong style={{ fontSize: 15, fontWeight: 600, color: "#f4f6f8" }}>Still have a question?</strong>
            <span style={{ fontSize: 13.5, color: "#a3abb5" }}>Ask the Avatar AI team →</span>
          </span>
        </motion.a>
      </div>

      <motion.ul {...reveal(120)} style={{ position: "relative", margin: 0, padding: 0, listStyle: "none", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        {QA.map((item, i) => {
          const isOpen = open === i;
          return (
            <li key={item.q} style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
              <h3 style={{ margin: 0 }}>
                <button
                  type="button"
                  id={`about-faq-q${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`about-faq-a${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]"
                  style={{ width: "100%", display: "grid", gridTemplateColumns: "clamp(40px,4vw,60px) 1fr auto", alignItems: "center", gap: 0, padding: "22px 4px", background: "transparent", border: 0, textAlign: "left", cursor: "pointer" }}
                >
                  <span style={{ ...mono, fontSize: 12.5, fontWeight: isOpen ? 700 : 500, color: isOpen ? "#6fe3ef" : "#8a939e" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="transition-colors group-hover:text-white" style={{ fontSize: "clamp(16px,1.2vw,17px)", lineHeight: 1.4, fontWeight: 500, color: isOpen ? "#f4f6f8" : "#e6eaee", paddingRight: 16 }}>{item.q}</span>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${isOpen ? "transparent" : "rgba(255,255,255,.22)"}`,
                      background: isOpen ? "#6fe3ef" : "transparent",
                      color: isOpen ? "#07131a" : "#e6eaee",
                      boxShadow: isOpen ? "0 0 18px rgba(111,227,239,.45)" : undefined,
                      transition: "background .25s, border-color .25s",
                    }}
                  >
                    <Chevron up={isOpen} />
                  </span>
                </button>
              </h3>
              <div
                id={`about-faq-a${i}`}
                role="region"
                aria-labelledby={`about-faq-q${i}`}
                hidden={!isOpen}
                style={{ padding: "0 clamp(44px,5vw,60px) 26px clamp(40px,4vw,60px)" }}
              >
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "#a3abb5" }}>{item.a}</p>
              </div>
            </li>
          );
        })}
      </motion.ul>
    </div>
  );
}

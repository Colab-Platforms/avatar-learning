"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { INSIGHT_POSTS } from "./data";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const TABS = ["All", "Blogs", "Case studies"] as const;
const FILTER_KEY = ["all", "blog", "case"] as const;

export function InsightsSection() {
  const [tab, setTab] = useState(0);
  const filtered = INSIGHT_POSTS.filter((p) => FILTER_KEY[tab] === "all" || p.k === FILTER_KEY[tab]);
  const featured = filtered[0];
  const rest = filtered.slice(1, 5);

  return (
    <section id="insights" data-screen-label="07 Insights" style={{ scrollMarginTop: 68, position: "relative", padding: "clamp(56px,7vw,96px) 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(24px,4vw,36px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Insights
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
          >
            Blogs and case studies
          </motion.h2>
          <motion.p {...reveal(160)} style={{ margin: 0, maxWidth: 520, fontSize: 18, lineHeight: 1.5, color: "#a3abb5" }}>
            Guides and stories from businesses putting AI to work.
          </motion.p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {TABS.map((t, i) => {
            const on = i === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(i)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "rgba(111,227,239,.5)" : "rgba(255,255,255,.1)"}`,
                  background: on ? "rgba(111,227,239,.1)" : "rgba(255,255,255,.02)",
                  color: on ? "#f4f6f8" : "#a3abb5",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {featured && (
          <motion.a
            {...reveal(0)}
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
              gap: 24,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,.08)",
              overflow: "hidden",
              background: "rgba(255,255,255,.02)",
            }}
          >
            <div style={{ height: 260, background: featured.art }} />
            <div style={{ padding: "clamp(24px,3vw,36px)", display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, letterSpacing: ".08em", color: "#6fe3ef" }}>FEATURED &middot; {featured.type}</span>
              <h3 style={{ margin: 0, fontSize: "clamp(22px,2.4vw,30px)", lineHeight: 1.2, fontWeight: 600, letterSpacing: "-0.02em", color: "#f4f6f8" }}>{featured.t}</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "#a3abb5" }}>{featured.ex}</p>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "#8fe9f2" }}>
                {featured.meta} &middot; Read more →
              </span>
            </div>
          </motion.a>
        )}

        <motion.div {...reveal(0)} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {rest.map((p) => (
            <a
              key={p.t}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                display: "grid",
                gridTemplateColumns: "112px minmax(0,1fr) 32px",
                gap: 16,
                alignItems: "center",
                padding: "20px 0",
                borderBottom: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <span style={{ height: 84, borderRadius: 12, background: p.art, display: "block" }} />
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 12, color: "#6fe3ef" }}>{p.type}</span>
                <strong style={{ fontSize: 17, fontWeight: 500, color: "#f4f6f8" }}>{p.t}</strong>
                <span style={{ fontSize: 13, color: "#8a939e" }}>{p.meta}</span>
              </span>
              <span style={{ color: "#8fe9f2" }}>→</span>
            </a>
          ))}
        </motion.div>

        <a href="#insights" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 500, color: "#8fe9f2" }}>
          View all insights →
        </a>
      </div>
    </section>
  );
}

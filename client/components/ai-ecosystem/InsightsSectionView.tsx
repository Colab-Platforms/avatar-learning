"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { InsightPost } from "./data";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const TABS = ["All", "Blogs", "Case studies"] as const;
const FILTER_KEY = ["all", "blog", "case"] as const;

const EMPTY_LABEL = ["articles", "blogs", "case studies"] as const;

/** The right-hand list starts with this many articles. The homepage links to /insights; /insights reveals more on demand. */
const PREVIEW_LIST_SIZE = 4;

export function InsightsSectionView({ posts, showAll = false }: { posts: InsightPost[]; showAll?: boolean }) {
  const [tab, setTab] = useState(0);
  const [visible, setVisible] = useState(PREVIEW_LIST_SIZE);
  const filtered = posts.filter((p) => FILTER_KEY[tab] === "all" || p.k === FILTER_KEY[tab]);
  const featured = filtered.find((p) => p.featured) ?? filtered[0];
  const others = filtered.filter((p) => p !== featured);
  const rest = others.slice(0, visible);
  const hasMore = showAll && others.length > visible;
  const canCollapse = showAll && visible > PREVIEW_LIST_SIZE;
  const collapse = () => {
    setVisible(PREVIEW_LIST_SIZE);
    document.getElementById("insights")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="insights" data-screen-label="07 Insights" style={{ scrollMarginTop: 68, position: "relative", padding: showAll ? "var(--ad-page-top) var(--ad-gutter) var(--ad-section-y)" : "var(--ad-section-y) var(--ad-gutter)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(24px,4vw,36px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Blogs
          </motion.div>
          <motion.h2
            {...reveal(80)}
            style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, textWrap: "balance", background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
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
                onClick={() => {
                  setTab(i);
                  setVisible(PREVIEW_LIST_SIZE);
                }}
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

        <motion.div {...reveal(0)} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: "clamp(20px,3vw,40px)", alignItems: "stretch" }}>
          {!featured && (
            <p style={{ gridColumn: "1 / -1", margin: 0, textAlign: "center", fontSize: 16, color: "#a3abb5" }}>
              No {EMPTY_LABEL[tab]} published yet.
            </p>
          )}
          {featured && (
            <Link
              href={`/insights/${featured.slug}`}
              style={{ display: "flex", flexDirection: "column", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)", color: "#f4f6f8", ...(showAll ? { alignSelf: "start", position: "sticky", top: 88 } : {}) }}
            >
              <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
                {featured.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featured.image} alt={featured.t} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <div style={{ position: "absolute", inset: 0, background: featured.art }} />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)",
                        backgroundSize: "32px 32px",
                      }}
                    />
                  </>
                )}
                {/* Cover images already carry their own "FEATURED" badge; only label the fallback art. */}
                {!featured.image && (
                  <span style={{ position: "absolute", left: 18, top: 18, padding: "5px 10px", borderRadius: 999, background: "rgba(7,8,11,.72)", fontFamily: "var(--font-geist-mono),monospace", fontSize: 11, letterSpacing: ".08em", color: "#bff5fa" }}>
                    FEATURED
                  </span>
                )}
              </div>
              <div style={{ flex: 1, padding: "clamp(22px,3vw,30px)", display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#8fe9f2" }}>{featured.type}</span>
                <strong style={{ fontSize: "clamp(22px,2.4vw,30px)", lineHeight: 1.15, fontWeight: 600, letterSpacing: "-0.03em" }}>{featured.t}</strong>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: "#a3abb5" }}>{featured.ex}</span>
                <span style={{ marginTop: "auto", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 13, color: "#98a1ac" }}>
                  {featured.meta}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#f4f6f8", fontSize: 14, fontWeight: 500 }}>
                    Read more
                    <span style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8fe9f2" }}>→</span>
                  </span>
                </span>
              </div>
            </Link>
          )}

          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255,255,255,.08)" }}>
            {rest.map((p) => (
              <Link
                key={p.slug}
                href={`/insights/${p.slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "112px minmax(0,1fr) 32px",
                  gap: 18,
                  alignItems: "center",
                  padding: "16px 4px",
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                  color: "#f4f6f8",
                }}
              >
                <span style={{ position: "relative", display: "block", height: 84, borderRadius: 12, overflow: "hidden" }}>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ position: "absolute", inset: 0, background: p.art, display: "block" }} />
                  )}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <span style={{ fontFamily: "var(--font-geist-mono),monospace", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#98a1ac" }}>
                    {p.type} &middot; {p.meta}
                  </span>
                  <strong style={{ fontSize: 17, lineHeight: 1.3, fontWeight: 500, letterSpacing: "-0.01em" }}>{p.t}</strong>
                </span>
                <span style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8fe9f2" }}>→</span>
              </Link>
            ))}
            {!showAll && (
            <Link href="/insights" style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, marginTop: 12, fontSize: 15, fontWeight: 500, color: "#8fe9f2" }}>
              View all insights →
            </Link>
            )}
            {(hasMore || canCollapse) && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 28, marginTop: 12 }}>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PREVIEW_LIST_SIZE)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: 0, background: "none", border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 500, color: "#8fe9f2" }}
                >
                  Read more articles ↓
                </button>
                )}
              {canCollapse && (
                <button
                  type="button"
                  onClick={collapse}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: 0, background: "none", border: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 15, fontWeight: 500, color: "#8fe9f2" }}
                >
                  Show less ↑
                </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PRODUCTS } from "./data";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

/**
 * Homepage Tools overview. The detailed product panels (descriptions, feature
 * badges, dashboard previews) now live on /tools — see ToolsPage and
 * ProductShowcase — so the homepage only points visitors there.
 */
export function AIToolsMarketplaceSection() {
  return (
    <section id="products" data-screen-label="03 Products" style={{ scrollMarginTop: 68, position: "relative", padding: "var(--ad-section-y) var(--ad-gutter)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
        <motion.div
          {...reveal(0)}
          style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
          Tools
        </motion.div>
        <motion.h2
          {...reveal(80)}
          style={{ margin: 0, fontSize: "clamp(34px,4.8vw,58px)", lineHeight: 1.04, letterSpacing: "-0.04em", fontWeight: 600, textWrap: "balance", background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}
        >
          Tools that work together
        </motion.h2>
        <motion.p {...reveal(160)} style={{ margin: 0, maxWidth: 480, fontSize: 18, lineHeight: 1.5, color: "#a3abb5" }}>
          Start with one. Add more as you grow.
        </motion.p>
        <motion.div {...reveal(240)} style={{ marginTop: 10 }}>
          <Link
            href="/tools"
            className="transition-shadow hover:shadow-[0_0_32px_rgba(111,227,239,.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 52, padding: "0 26px", borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 15, fontWeight: 500, textDecoration: "none", boxShadow: "0 0 30px rgba(111,227,239,.25)" }}
          >
            Explore All {PRODUCTS.length} Tools
            <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#07080b", color: "#8fe9f2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

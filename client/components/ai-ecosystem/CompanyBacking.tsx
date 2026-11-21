"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

// Facts as published in the company's own filings (public/investors/*.html:
// "NSE Symbol AVATAR", "Whether company is SME: Yes") and the footer details.
const FACTS = [
  { label: "Parent company", value: "Avatar Industries Limited" },
  { label: "Formerly", value: "ASL Industries Limited" },
  { label: "Listing", value: "NSE SME platform · Symbol: AVATAR" },
  { label: "Registered office", value: "NESCO IT Park, 10th Floor, Building 4, Goregaon East, Mumbai 400063" },
];

const mono: React.CSSProperties = { fontFamily: "var(--font-geist-mono),ui-monospace,monospace", letterSpacing: ".1em", textTransform: "uppercase" };

/** "The company behind Avatar AI": parent-company and listing details. */
export function CompanyBacking() {
  return (
    <div style={{ position: "relative", marginTop: "clamp(96px,11vw,150px)" }}>
      {/* faint dot pattern behind the text, fading out to the right */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-60px -24px -60px -24px",
          pointerEvents: "none",
          backgroundImage: "radial-gradient(rgba(255,255,255,.09) 1px,transparent 1.2px)",
          backgroundSize: "18px 18px",
          WebkitMaskImage: "linear-gradient(90deg,#000 0%,rgba(0,0,0,.5) 35%,transparent 65%)",
          maskImage: "linear-gradient(90deg,#000 0%,rgba(0,0,0,.5) 35%,transparent 65%)",
        }}
      />
      <div aria-hidden="true" style={{ position: "absolute", left: "30%", bottom: "-45%", width: "45%", height: "90%", pointerEvents: "none", background: "radial-gradient(closest-side,rgba(60,140,140,.10),transparent)" }} />

      <div className="relative grid grid-cols-1 items-center gap-10 min-[960px]:grid-cols-[1fr_minmax(0,560px)] min-[960px]:gap-[clamp(48px,6vw,80px)]">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            The company behind Avatar AI
          </motion.div>

          <motion.h2
            {...reveal(80)}
            style={{
              margin: "clamp(20px,2.4vw,28px) 0 0",
              fontSize: "clamp(36px,3.9vw,56px)",
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
              fontWeight: 600,
              background: "linear-gradient(180deg,#ffffff 0%,#f4f6f8 42%,#a9b1ba 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            <span className="min-[640px]:block">Backed by Avatar </span>
            <span className="min-[640px]:block">Industries Limited</span>
          </motion.h2>

          <motion.p {...reveal(160)} style={{ margin: "clamp(18px,2.2vw,26px) 0 0", maxWidth: 560, fontSize: "clamp(16px,1.25vw,18px)", lineHeight: 1.65, color: "#a3abb5" }}>
            Avatar AI is a brand of Avatar Industries Limited, formerly known as ASL Industries Limited. Avatar Industries is listed on the National Stock Exchange (NSE SME platform) under the symbol AVATAR, with its registered office in Mumbai.
          </motion.p>

          <motion.div {...reveal(240)} style={{ marginTop: "clamp(22px,2.6vw,32px)" }}>
            <Link href="/investors?theme=dark" className="text-[#6fe3ef] transition-colors hover:text-[#8fe9f2] focus-visible:underline" style={{ fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Investor information ↗
            </Link>
          </motion.div>
        </div>

        <motion.div
          {...reveal(120)}
          data-avoid-sticky=""
          style={{ borderRadius: 22, border: "1px solid rgba(255,255,255,.1)", background: "rgba(11,12,16,.92)", padding: "clamp(22px,2.4vw,30px) clamp(20px,2.2vw,32px) clamp(16px,1.6vw,20px)", boxShadow: "0 30px 80px -30px rgba(0,0,0,.8)" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <span style={{ ...mono, display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#f4f6f8" }}>
              <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: "#6fe3ef", boxShadow: "0 0 10px rgba(111,227,239,.6)" }} />
              NSE · AVATAR
            </span>
            <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#8fe9f2", background: "rgba(111,227,239,.12)", whiteSpace: "nowrap" }}>Listed company</span>
          </div>
          <dl style={{ margin: 0 }}>
            {FACTS.map((f, i) => (
              <div
                key={f.label}
                className="grid grid-cols-1 gap-1 min-[520px]:grid-cols-[150px_1fr] min-[520px]:gap-5"
                style={{ alignItems: "baseline", padding: "18px 10px", borderBottom: i < FACTS.length - 1 ? "1px solid rgba(255,255,255,.08)" : undefined }}
              >
                <dt style={{ ...mono, fontSize: 12, color: "#8a939e" }}>{f.label}</dt>
                <dd style={{ margin: 0, fontSize: "clamp(15px,1.15vw,17px)", lineHeight: 1.45, fontWeight: 600, color: "#f4f6f8" }}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </div>
  );
}

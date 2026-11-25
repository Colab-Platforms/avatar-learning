"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PRODUCTS, STEPS } from "./data";
import { ConnectedAIEcosystem } from "./connected-ecosystem/ConnectedAIEcosystem";
import { OurStory } from "./OurStory";
import { CompanyBacking } from "./CompanyBacking";
import { VisionMission } from "./VisionMission";
import { AboutFaq } from "./AboutFaq";

/**
 * The hero is the first thing on the page, so it must be visible straight
 * away (not hidden until scripts load and a scroll-reveal fires). A short
 * CSS-only fade-in keeps the polish; it runs before hydration.
 */
const heroIn = (step: number) => ({ initial: false as const, className: `about-enter about-enter-${step}` });

// Figures come from the site's own data: the product list, the "How it works"
// steps, and the FAQ ("Every setup includes hands-on training").
const STATS = [
  { value: String(PRODUCTS.length), label: "AI Tools & Business Solutions" },
  { value: String(STEPS.length), label: "Steps from call to scale" },
  { value: "100%", label: "Setups include training" },
];

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 50,
  padding: "0 26px",
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 500,
  whiteSpace: "nowrap",
  textDecoration: "none",
  boxSizing: "border-box",
};

/** The full AI Adoption About page content (rendered at /about). */
export function AboutPageContent() {
  return (
    <section
      id="about"
      data-screen-label="About page"
      style={{ scrollMarginTop: 68, position: "relative", overflow: "hidden", padding: "var(--ad-page-top) var(--ad-gutter) var(--ad-section-y)" }}
    >
      <style>{`
        @keyframes aboutEnter { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
        .about-enter { animation: aboutEnter .6s cubic-bezier(.2,.7,.1,1) both }
        .about-enter-2 { animation-delay: .06s } .about-enter-3 { animation-delay: .12s } .about-enter-4 { animation-delay: .18s } .about-enter-5 { animation-delay: .24s }
        @media (prefers-reduced-motion: reduce) { .about-enter { animation: none } }
      `}</style>
      {/* Background: faint grid that fades out at the edges + soft cyan light, as in the reference. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 45%,#000 30%,transparent 80%)",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 45%,#000 30%,transparent 80%)",
        }}
      />
      <div aria-hidden="true" style={{ position: "absolute", right: "-8%", top: "-10%", width: "55%", height: "70%", pointerEvents: "none", background: "radial-gradient(closest-side,rgba(64,150,165,.14),transparent)" }} />
      <div aria-hidden="true" style={{ position: "absolute", left: "-12%", bottom: "-20%", width: "45%", height: "60%", pointerEvents: "none", background: "radial-gradient(closest-side,rgba(40,90,110,.12),transparent)" }} />

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(28px,4vw,52px)" }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: 14 }}>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", gap: 10, alignItems: "center", color: "#8a939e" }}>
            <li>
              <Link href="/" className="transition-colors hover:text-white" style={{ color: "#a3abb5", textDecoration: "none" }}>Home</Link>
            </li>
            <li aria-hidden="true" style={{ color: "#5c646e" }}>/</li>
            <li aria-current="page" style={{ color: "#f4f6f8" }}>About us</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 items-center gap-12 min-[960px]:grid-cols-[55fr_45fr] min-[960px]:gap-[clamp(40px,5vw,72px)]">
          {/* Left: label, heading, text, buttons, stats */}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <motion.p
              {...heroIn(1)}
              style={{ margin: 0, display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-geist-mono),ui-monospace,monospace", fontSize: 12.5, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "#6fe3ef" }}
            >
              <span aria-hidden="true" style={{ width: 24, height: 1.5, background: "#6fe3ef", flex: "none" }} />
              About us · An Avatar Industries Limited company
            </motion.p>

            <motion.h1
              {...heroIn(2)}
              style={{
                margin: "clamp(18px,2.4vw,26px) 0 0",
                fontSize: "clamp(38px,4.6vw,66px)",
                lineHeight: 1.05,
                letterSpacing: "-0.035em",
                fontWeight: 600,
                // bright white at the top, easing to grey on the last line
                background: "linear-gradient(180deg,#ffffff 0%,#f4f6f8 38%,#a9b1ba 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              <span className="min-[640px]:block">Avatar AI is building </span>
              <span className="min-[640px]:block">an AI ecosystem for </span>
              <span className="min-[640px]:block">Indian businesses</span>
            </motion.h1>

            <motion.p {...heroIn(3)} style={{ margin: "clamp(20px,2.6vw,30px) 0 0", maxWidth: 540, fontSize: "clamp(16px,1.25vw,18px)", lineHeight: 1.7, color: "#a3abb5" }}>
              Avatar AI is the AI ecosystem of Avatar Industries Limited. We help businesses adopt AI and automation with ready-to-use tools, hands-on team training and support at every step.
            </motion.p>

            <motion.div {...heroIn(4)} style={{ marginTop: "clamp(24px,2.6vw,30px)", display: "flex", gap: 12, flexWrap: "wrap" }}>
              {/* Opens the Book a Demo form page (same shared form). */}
              <Link href="/book-demo" className="bg-[#f4f6f8] text-[#07080b] transition-shadow hover:bg-white hover:shadow-[0_0_32px_rgba(111,227,239,.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]" style={btnBase}>
                Talk to our team
              </Link>
              <Link href="/tools" className="border border-white/[0.14] bg-white/[0.02] text-[#f4f6f8] transition-colors hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]" style={btnBase}>
                Explore the ecosystem →
              </Link>
            </motion.div>

            <motion.dl
              {...heroIn(5)}
              style={{ margin: "clamp(36px,4vw,46px) 0 0", display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", borderTop: "1px solid rgba(255,255,255,.08)" }}
            >
              {STATS.map((s) => (
                <div key={s.label} style={{ position: "relative", paddingTop: "clamp(18px,2vw,24px)", paddingRight: 12, display: "flex", flexDirection: "column-reverse", justifyContent: "flex-end", gap: 8 }}>
                  <span aria-hidden="true" style={{ position: "absolute", left: 0, top: -1, width: 32, height: 2, background: "#6fe3ef", boxShadow: "0 0 10px rgba(111,227,239,.5)" }} />
                  <dt style={{ fontSize: "clamp(13px,1.1vw,15px)", lineHeight: 1.4, color: "#a3abb5" }}>{s.label}</dt>
                  <dd style={{ margin: 0, fontSize: "clamp(32px,3.4vw,48px)", lineHeight: 1, fontWeight: 600, letterSpacing: "-0.03em", color: "#f4f6f8" }}>{s.value}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* Right: the visual panel (Connected AI Ecosystem animation) */}
          <motion.div
            initial={false}
            role="img"
            aria-label="Avatar AI connects SaaS, AI tools, automation, consultation, AI adoption, training, analytics and custom solutions into one ecosystem."
            data-avoid-sticky=""
            className="about-enter about-enter-3 max-w-[560px] min-[960px]:max-w-none" // when stacked, don't let the panel dominate
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "507 / 580",
              maxHeight: 640,
              borderRadius: 24,
              border: "1px solid rgba(143,190,200,.22)",
              background: "#0b0c10",
              boxShadow: "0 40px 90px -30px rgba(111,227,239,.18), inset 0 1px 0 rgba(255,255,255,.03)",
              overflow: "hidden",
            }}
          >
            <ConnectedAIEcosystem />
          </motion.div>
        </div>

        <OurStory />
        <CompanyBacking />
        <VisionMission />
        <AboutFaq />
      </div>
    </section>
  );
}

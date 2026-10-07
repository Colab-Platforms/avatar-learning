"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PRODUCTS } from "./data";
import styles from "./ecosystem.module.css";

const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px 120px 0px" },
  transition: { duration: 0.9, delay: delay / 1000, ease: [0.2, 0.7, 0.1, 1] as const },
});

const CYCLE_MS = 7000;
const AI_CONTENT_COPY =
  "This Diwali, light up your home with our festive collection. Up to 30% off, only this week.";

function Dot({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ flex: "none", width: 18, height: 18, borderRadius: "50%", background: "rgba(111,227,239,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
    </span>
  );
}

function ProductMock({ index, typed }: { index: number; typed: string }) {
  if (index === 0) {
    const cols: [string, { t: string; s: string; hot?: boolean }[]][] = [
      ["New · 12", [{ t: "Sharma Textiles", s: "Website enquiry" }, { t: "Kiran Foods", s: "Referral" }]],
      ["Contacted · 7", [{ t: "Mehta Logistics", s: "Follow up today", hot: true }, { t: "Rao & Sons", s: "Demo booked" }]],
      ["Won · 4", [{ t: "Nair Retail", s: "Closed this week" }]],
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }} className={styles.fadeIn}>
        {cols.map(([label, cards]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#8a939e" }}>{label}</span>
            {cards.map((c) => (
              <div
                key={c.t}
                className={c.hot ? styles.floaty : undefined}
                style={{
                  borderRadius: 10,
                  border: c.hot ? "1px solid rgba(111,227,239,.35)" : "1px solid rgba(255,255,255,.07)",
                  background: c.hot ? "rgba(111,227,239,.06)" : "transparent",
                  padding: 10,
                  fontSize: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <strong style={{ fontWeight: 500 }}>{c.t}</strong>
                <span style={{ color: c.hot ? "#8fe9f2" : "#98a1ac" }}>{c.s}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (index === 1) {
    const rows: [string, string, string][] = [
      ["#2041", "Pune", "Delivered"],
      ["#2042", "Jaipur", "Shipped"],
      ["#2043", "Kochi", "Packed"],
    ];
    return (
      <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr", fontSize: 11, letterSpacing: ".08em", color: "#8a939e", fontFamily: "var(--font-geist-mono),monospace" }}>
          <span>ORDER</span>
          <span>CITY</span>
          <span>STATUS</span>
        </div>
        {rows.map((r) => (
          <div key={r[0]} style={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr", fontSize: 13, color: "#dfe4ea", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 10 }}>
            <span>{r[0]}</span>
            <span>{r[1]}</span>
            <span style={{ color: "#8fe9f2" }}>{r[2]}</span>
          </div>
        ))}
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#a3abb5" }}>Stock level &middot; Cotton kurta</span>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: 6 }}>
            <div className={styles.fill} style={{ width: "68%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#6b7cff,#6fe3ef)", transformOrigin: "0 50%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontSize: 12, color: "#8a939e" }}>Write an Instagram post for our Diwali sale</span>
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)", padding: 14, fontSize: 13, lineHeight: 1.6, color: "#dfe4ea", minHeight: 72 }}>
          {typed}
          <span className={styles.blink} style={{ display: "inline-block", width: 2, height: "1em", marginLeft: 2, verticalAlign: "-2px", background: "#8fe9f2" }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#8a939e" }}>Tone: Warm</span>
          <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, border: "1px solid rgba(111,227,239,.4)", color: "#8fe9f2" }}>English</span>
          <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, border: "1px solid rgba(255,255,255,.12)", color: "#a3abb5" }}>Hindi</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ padding: "7px 14px", borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 12, fontWeight: 500 }}>Approve</span>
          <span style={{ padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.14)", color: "#dfe4ea", fontSize: 12 }}>Rewrite</span>
        </div>
      </div>
    );
  }

  if (index === 3) {
    const courses: [string, string, boolean][] = [
      ["AI basics for sales teams", "Completed", true],
      ["Writing with AI", "64%", false],
      ["Using your new CRM", "20%", false],
    ];
    return (
      <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {courses.map(([t, v, done]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#dfe4ea" }}>{t}</span>
            <span style={{ color: done ? "#8fe9f2" : "#a3abb5", fontSize: 12 }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#6b7cff,#6fe3ef)" }} />
          <span style={{ fontSize: 12, color: "#8fe9f2" }}>1 certificate earned</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#dfe4ea" }}>
        <span style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#0c0e13" }}>Your process</span>
        <span style={{ color: "#6fe3ef" }}>→</span>
        <span style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(111,227,239,.5)", background: "#0f2329", color: "#bff5fa" }} className={styles.glow}>
          Avatar builds around it
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {["Custom tool", "Integrations", "Ongoing support"].map((t) => (
          <span key={t} style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", fontSize: 12, color: "#dfe4ea" }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AIToolsMarketplaceSection() {
  const [prod, setProd] = useState(0);
  const [auto, setAuto] = useState(true);
  const [typedN, setTypedN] = useState(0);
  const [hovered, setHovered] = useState(-1);
  const [stacked, setStacked] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const msgBoxRef = useRef<string>("");

  useEffect(() => {
    // The panel's two columns (text / mockup) stack below ~760px, where the
    // fixed heights that keep the desktop row from jumping between products
    // are no longer needed and would just leave dead space.
    const onResize = () => setStacked(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setProd((p) => (p + 1) % PRODUCTS.length);
      setTypedN(0);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [auto]);

  useEffect(() => {
    if (prod !== 2) return;
    const copy = AI_CONTENT_COPY;
    const id = setInterval(() => {
      setTypedN((n) => (n < copy.length ? n + 2 : n));
    }, 40);
    return () => clearInterval(id);
  }, [prod]);

  const goTo = (i: number) => {
    const n = (i + PRODUCTS.length) % PRODUCTS.length;
    setProd(n);
    setAuto(false);
    setTypedN(0);
    const el = tabsRef.current;
    const btn = el?.querySelectorAll("button")[n] as HTMLElement | undefined;
    if (btn && el) el.scrollTo({ left: Math.max(0, btn.offsetLeft - 24), behavior: "smooth" });
  };

  const product = PRODUCTS[prod];

  return (
    <section id="products" data-screen-label="03 Products" style={{ scrollMarginTop: 68, position: "relative", padding: "clamp(56px,7vw,96px) 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: "clamp(22px,4vw,40px)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18 }}>
          <motion.div
            {...reveal(0)}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.03)", fontSize: 15, color: "#a3abb5" }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6fe3ef" }} />
            Products
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
        </div>

        {stacked ? (
          <div
            ref={tabsRef}
            className={styles.noScrollbar}
            style={{
              position: "sticky",
              top: 68,
              zIndex: 20,
              display: "flex",
              flexDirection: "row",
              gap: 22,
              overflowX: "auto",
              margin: "0 -24px",
              padding: "6px 24px 14px",
              background: "rgba(7,8,11,.82)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(255,255,255,.08)",
              scrollSnapType: "x mandatory",
            }}
          >
            {PRODUCTS.map((p, i) => {
              const on = i === prod;
              return (
                <button
                  key={p.slug}
                  onClick={() => goTo(i)}
                  aria-pressed={on}
                  style={{
                    scrollSnapAlign: "start",
                    flex: "none",
                    position: "relative",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    border: 0,
                    background: "transparent",
                    padding: "6px 0 12px",
                    fontSize: 15,
                    fontWeight: on ? 600 : 500,
                    color: on ? "#f4f6f8" : "#8a939e",
                    transition: "color .3s",
                  }}
                >
                  {p.plain}
                  {on && (
                    <motion.span
                      layoutId="product-tab-underline-mobile"
                      transition={{ type: "spring", stiffness: 420, damping: 38 }}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: -1,
                        height: 2,
                        borderRadius: 2,
                        background: "linear-gradient(90deg,#6b7cff,#6fe3ef)",
                        boxShadow: "0 0 8px rgba(111,227,239,.5)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            ref={tabsRef}
            className={styles.noScrollbar}
            style={{
              position: "sticky",
              top: 68,
              zIndex: 20,
              display: "grid",
              gridTemplateColumns: "repeat(5,minmax(160px,1fr))",
              gap: 8,
              overflowX: "auto",
              margin: "0 -24px",
              padding: "6px 24px",
              background: "rgba(7,8,11,.82)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              scrollSnapType: "x mandatory",
            }}
          >
            {PRODUCTS.map((p, i) => {
              const on = i === prod;
              const hot = i === hovered;
              return (
                <button
                  key={p.slug}
                  onClick={() => goTo(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(-1)}
                  aria-pressed={on}
                  style={{
                    scrollSnapAlign: "start",
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    padding: "16px 16px 18px",
                    borderRadius: 14,
                    border: `1px solid ${on ? "rgba(111,227,239,.35)" : hot ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.08)"}`,
                    background: on ? "rgba(111,227,239,.06)" : hot ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.02)",
                    color: on ? "#f4f6f8" : "#8a939e",
                    fontSize: 15,
                    fontWeight: 500,
                    transform: hot && !on ? "translateY(-1px)" : "none",
                    transition: "border-color .3s,background .3s,color .3s,transform .3s",
                  }}
                >
                  <span style={{ display: "block", fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#8a939e", marginBottom: 6 }}>
                    0{i + 1} &middot; {p.tag ? "Custom" : p.name}
                  </span>
                  {p.plain}
                  <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "rgba(255,255,255,.06)" }} />
                  {on && (
                    <motion.span
                      // No layoutId here on purpose: the active underline swaps
                      // between sibling buttons that each clip their own content
                      // (overflow: hidden + border-radius). A shared layoutId
                      // "flies" the element across that boundary and can render
                      // outside its own 2px strip mid-transition. A plain local
                      // fade/grow stays inside this card the whole time.
                      initial={{ opacity: 0, scaleX: 0.3 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.1, 1] }}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 2,
                        transformOrigin: "0 50%",
                        background: "linear-gradient(90deg,#6b7cff,#6fe3ef)",
                        boxShadow: "0 0 8px rgba(111,227,239,.5)",
                      }}
                    >
                      <span
                        key={`${prod}-${auto}`}
                        style={{
                          display: "block",
                          height: "100%",
                          background: "linear-gradient(90deg,#6b7cff,#6fe3ef)",
                          transformOrigin: "0 50%",
                          animation: `${styles.fill} ${auto ? CYCLE_MS : 400}ms linear forwards`,
                        }}
                      />
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div
          style={{
            position: "relative",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,.08)",
            background: "linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01))",
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))",
          }}
        >
          <div
            className={styles.breathe}
            style={{
              position: "absolute",
              left: "62%",
              top: "50%",
              width: 640,
              height: 640,
              margin: "-320px 0 0 -320px",
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(107,124,255,.18),transparent 60%)",
              pointerEvents: "none",
              animationDuration: "7s",
            }}
          />
          <div style={{ position: "relative", padding: "clamp(28px,4vw,48px)", height: stacked ? "auto" : 500, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={prod}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.2, 0.7, 0.1, 1] }}
                style={{ display: "flex", flexDirection: "column", gap: 22 }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#6fe3ef" }}>
                  {String(prod + 1).padStart(2, "0")} / 05
                  <span style={{ padding: "3px 9px", borderRadius: 999, border: "1px solid rgba(111,227,239,.3)", color: "#bff5fa", letterSpacing: ".04em" }}>
                    {product.tag || product.name}
                  </span>
                </span>
                <h3 style={{ margin: 0, fontSize: "clamp(30px,3.6vw,44px)", fontWeight: 600, letterSpacing: "-0.035em", textWrap: "balance", color: "#f4f6f8" }}>{product.plain}</h3>
                <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#a3abb5", maxWidth: 480 }}>{product.desc}</p>
                <div
                  style={
                    stacked
                      ? { display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }
                      : { display: "flex", flexDirection: "row", gap: 8, flexWrap: "nowrap" }
                  }
                >
                  {product.bullets.map((b) => (
                    <span
                      key={b}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: stacked ? "10px 14px 10px 8px" : "7px 12px 7px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,.1)",
                        fontSize: 14,
                        color: "#dfe4ea",
                        whiteSpace: "nowrap",
                        width: stacked ? "100%" : undefined,
                        boxSizing: stacked ? "border-box" : undefined,
                      }}
                    >
                      <Dot label={b} color="#6fe3ef" />
                      {b}
                    </span>
                  ))}
                </div>
                <a
                  href="#contact"
                  onClick={() => {
                    const full = product.plain + (product.tag ? "" : ` (${product.name})`);
                    msgBoxRef.current = `Hi, I'd like to know more about ${full} for my business.`;
                    setTimeout(() => {
                      const m = document.querySelector<HTMLTextAreaElement>("[data-contact-message]");
                      if (m && !m.value) m.value = msgBoxRef.current;
                    }, 60);
                  }}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    background: "#f4f6f8",
                    color: "#07080b",
                    padding: "15px 22px",
                    borderRadius: 999,
                    fontSize: 15,
                    fontWeight: 500,
                    boxShadow: "0 0 30px rgba(111,227,239,.25)",
                  }}
                >
                  {product.cta}
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#07080b", color: "#8fe9f2", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>
                    →
                  </span>
                </a>
              </motion.div>
            </AnimatePresence>
          </div>
          <div style={{ position: "relative", padding: "clamp(20px,3vw,36px)", display: "flex", alignItems: "center", justifyContent: "center", height: stacked ? "auto" : 500 }}>
            <div data-avoid-sticky="" style={{ width: "100%", borderRadius: 16, border: "1px solid rgba(255,255,255,.1)", background: "rgba(10,12,16,.85)", boxShadow: "0 30px 80px -20px rgba(0,0,0,.8)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
                <span style={{ marginLeft: 10, fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#8a939e" }}>avatar / {product.slug}</span>
              </div>
              <div style={{ padding: 18, height: 300, boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <ProductMock index={prod} typed={AI_CONTENT_COPY.slice(0, typedN)} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {PRODUCTS.map((p, i) => (
            <button
              key={p.slug}
              aria-label={`Go to ${p.plain}`}
              onClick={() => goTo(i)}
              style={{
                width: i === prod ? 20 : 6,
                height: 6,
                borderRadius: 999,
                border: 0,
                background: i === prod ? "#6fe3ef" : "rgba(255,255,255,.2)",
                transition: "width .3s,background .3s",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

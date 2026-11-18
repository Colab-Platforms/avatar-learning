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

function Dot({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ flex: "none", width: 18, height: 18, borderRadius: "50%", background: "rgba(111,227,239,.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
    </span>
  );
}

type KanbanCols = [string, { t: string; s: string; hot?: boolean }[]][];

/** Three-column pipeline board (used by CRM and Recruitment CRM). */
function KanbanMock({ cols }: { cols: KanbanCols }) {
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

/** Small table + progress bar (used by OMS, HRMS and IMS). */
function TableMock({ head, rows, firstCol = 72, bar }: { head: [string, string, string]; rows: [string, string, string][]; firstCol?: number; bar: { label: string; pct: number } }) {
  const cols = `${firstCol}px 1fr 1fr`;
  return (
    <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, fontSize: 11, letterSpacing: ".08em", color: "#8a939e", fontFamily: "var(--font-geist-mono),monospace" }}>
        {head.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {rows.map((r) => (
        <div key={r[0]} style={{ display: "grid", gridTemplateColumns: cols, fontSize: 13, color: "#dfe4ea", borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 10 }}>
          <span>{r[0]}</span>
          <span>{r[1]}</span>
          <span style={{ color: "#8fe9f2" }}>{r[2]}</span>
        </div>
      ))}
      <div style={{ marginTop: 4 }}>
        <span style={{ fontSize: 12, color: "#a3abb5" }}>{bar.label}</span>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: 6 }}>
          <div className={styles.fill} style={{ width: `${bar.pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#6b7cff,#6fe3ef)", transformOrigin: "0 50%" }} />
        </div>
      </div>
    </div>
  );
}

function ProductMock({ slug }: { slug: string }) {
  if (slug === "crm") {
    return (
      <KanbanMock
        cols={[
          ["New · 12", [{ t: "Sharma Textiles", s: "Website enquiry" }, { t: "Kiran Foods", s: "Referral" }]],
          ["Contacted · 7", [{ t: "Mehta Logistics", s: "Follow up today", hot: true }, { t: "Rao & Sons", s: "Demo booked" }]],
          ["Won · 4", [{ t: "Nair Retail", s: "Closed this week" }]],
        ]}
      />
    );
  }

  if (slug === "orders") {
    return (
      <TableMock
        head={["ORDER", "CITY", "STATUS"]}
        rows={[
          ["#2041", "Pune", "Delivered"],
          ["#2042", "Jaipur", "Shipped"],
          ["#2043", "Kochi", "Packed"],
        ]}
        bar={{ label: "Stock level · Cotton kurta", pct: 68 }}
      />
    );
  }

  if (slug === "recruitment") {
    return (
      <KanbanMock
        cols={[
          ["Applied · 18", [{ t: "Priya Menon", s: "Sales executive" }, { t: "Arjun Patel", s: "Accountant" }]],
          ["Interview · 6", [{ t: "Neha Kulkarni", s: "Interview today", hot: true }, { t: "Rahul Verma", s: "Round 2" }]],
          ["Offer · 2", [{ t: "Sneha Iyer", s: "Offer accepted" }]],
        ]}
      />
    );
  }

  if (slug === "hrms") {
    return (
      <TableMock
        head={["EMPLOYEE", "IN", "STATUS"]}
        firstCol={110}
        rows={[
          ["Anita Desai", "9:02", "Present"],
          ["Vikram Singh", "9:15", "Present"],
          ["Farah Khan", "—", "On leave"],
        ]}
        bar={{ label: "Attendance today · 46 of 50", pct: 92 }}
      />
    );
  }

  if (slug === "inventory") {
    return (
      <TableMock
        head={["ITEM", "STOCK", "STATUS"]}
        firstCol={110}
        rows={[
          ["Cotton kurta", "240", "In stock"],
          ["Silk saree", "18", "Low stock"],
          ["Linen shirt", "96", "In stock"],
        ]}
        bar={{ label: "Warehouse capacity · Mumbai", pct: 74 }}
      />
    );
  }

  if (slug === "script") {
    const steps: [string, string, boolean][] = [
      ["Send WhatsApp welcome", "Done", true],
      ["Assign to a sales rep", "Done", true],
      ["Schedule follow-up call", "Running", false],
    ];
    return (
      <div className={styles.fadeIn} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#8a939e" }}>When a new enquiry arrives</span>
        {steps.map(([t, v, done]) => (
          <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13, borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 10 }}>
            <span style={{ color: "#dfe4ea" }}>{t}</span>
            <span className={done ? undefined : styles.blink} style={{ color: done ? "#8fe9f2" : "#a3abb5", fontSize: 12 }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#a3abb5" }}>Tasks automated this week &middot; 128</span>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden", marginTop: 6 }}>
            <div className={styles.fill} style={{ width: "80%", height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#6b7cff,#6fe3ef)", transformOrigin: "0 50%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (slug === "learning") {
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

const MARQUEE_SPEED = 30; // px per second
const MARQUEE_IDLE_MS = 3000; // resume this long after the last interaction
const COPIES = 3; // the sequence is rendered 3×; the visible window lives in the middle copy
const GUTTER = 24; // the carousel's left padding

/**
 * Seamless auto-scrolling marquee for the product carousel.
 *
 * The row is a native horizontal scroller (so mouse-drag, touch swipe and
 * trackpad scrolling all work), and a requestAnimationFrame loop advances its
 * scrollLeft by elapsed time. The 8 products are rendered three times; the
 * position is kept inside the middle copy, and when it crosses a copy boundary
 * it is shifted by exactly one sequence width (measured, gaps included), which
 * looks identical, so the loop never visibly resets. All per-frame state lives
 * in a ref, so animation frames never re-render React.
 */
function useMarquee(ref: React.RefObject<HTMLDivElement | null>) {
  const [playing, setPlaying] = useState(true);
  const s = useRef({
    pos: 0, base: 0, L: 0, playing: true, visible: false,
    hover: false, kbFocus: false, drag: false, touching: false, moved: false,
    last: -Infinity, lastUserScroll: -Infinity,
    wrap: () => {},
  });

  // Autoplay is off for people who prefer reduced motion (they can still press play).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);
  useEffect(() => {
    s.current.playing = playing;
    if (playing) s.current.last = -Infinity; // pressing play starts right away
  }, [playing]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = s.current;
    const n = PRODUCTS.length;
    const now = () => performance.now();

    const wrap = () => {
      if (st.L <= 0) return;
      if (st.pos < st.base || st.pos >= st.base + st.L) {
        st.pos = st.base + ((((st.pos - st.base) % st.L) + st.L) % st.L);
        el.scrollLeft = st.pos;
      }
    };
    st.wrap = wrap;

    // Loop distance = width of one full sequence incl. gaps (start of copy 2 − start of copy 1).
    const measure = () => {
      const a = el.querySelector<HTMLElement>('[data-card="0-0"]');
      const b = el.querySelector<HTMLElement>('[data-card="1-0"]');
      if (!a || !b) return;
      const rel = st.L > 0 ? (((st.pos - st.base) / st.L) % 1 + 1) % 1 : 0; // keep place on resize
      st.L = b.offsetLeft - a.offsetLeft;
      st.base = b.offsetLeft - GUTTER;
      st.pos = st.base + rel * st.L;
      el.scrollLeft = st.pos;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const firstCard = el.querySelector<HTMLElement>('[data-card="1-0"]');
    if (firstCard) ro.observe(firstCard); // card widths change with the breakpoint, not only with the row

    const canMove = (t: number) =>
      st.playing && !st.hover && !st.kbFocus && !st.drag && !st.touching && t - st.last > MARQUEE_IDLE_MS;

    let raf = 0;
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? Math.min(100, t - prev) : 0;
      prev = t;
      if (!st.drag && t - st.lastUserScroll > 200) wrap(); // re-centre after manual scrolling settles
      if (canMove(t) && st.L > 0) {
        st.pos += (MARQUEE_SPEED * dt) / 1000;
        if (st.pos >= st.base + st.L) st.pos -= st.L;
        el.scrollLeft = st.pos;
      }
      raf = requestAnimationFrame(tick);
    };
    // Only animate while the carousel is on screen and the tab is visible.
    const sync = () => {
      const run = st.visible && !document.hidden;
      if (run && !raf) {
        prev = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const io = new IntersectionObserver(([e]) => {
      st.visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);

    // Any scroll we didn't cause (trackpad, swipe, arrows, focus) = user interaction.
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - st.pos) > 1.5) {
        st.pos = el.scrollLeft;
        st.last = st.lastUserScroll = now();
      }
    };
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") st.hover = true;
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      st.hover = false;
      st.last = now();
    };
    // Mouse drag to scroll (touch uses native swiping).
    let startX = 0;
    let startPos = 0;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - startX;
      if (!st.moved && Math.abs(dx) > 5) st.moved = true;
      if (st.moved) {
        st.pos = startPos - dx;
        el.scrollLeft = st.pos;
      }
    };
    const onUp = () => {
      st.drag = false;
      st.last = now();
      // The click (if any) fires right after pointerup; clear the drag flag
      // after it so a later click or Enter key isn't swallowed.
      window.setTimeout(() => (st.moved = false), 0);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    const onDown = (e: PointerEvent) => {
      st.last = now();
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      st.drag = true;
      st.moved = false;
      startX = e.clientX;
      startPos = st.pos;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
    // A drag must not also count as a click on the card under the cursor.
    const onClickCapture = (e: MouseEvent) => {
      if (!st.moved) return;
      e.preventDefault();
      e.stopPropagation();
      st.moved = false;
    };
    const onTouchStart = () => {
      st.touching = true;
      st.last = now();
    };
    const onTouchEnd = () => {
      st.touching = false;
      st.last = now();
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) st.last = now(); // horizontal trackpad scroll
    };
    // Keyboard focus inside the carousel pauses it until focus leaves.
    const onFocusIn = (e: FocusEvent) => {
      st.kbFocus = (e.target as Element).matches?.(":focus-visible") ?? false;
      st.last = now();
    };
    const onFocusOut = (e: FocusEvent) => {
      if (el.contains(e.relatedTarget as Node | null)) return;
      st.kbFocus = false;
      st.last = now();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, [ref]);

  const markInteraction = () => {
    s.current.last = performance.now();
  };

  // Arrow buttons: move one card left/right, landing on a card edge.
  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    const card = el?.querySelector<HTMLElement>('[data-card="1-0"]');
    const st = s.current;
    if (!el || !card || st.L <= 0) return;
    st.wrap();
    st.last = performance.now();
    const step = st.L / PRODUCTS.length;
    const target = st.base + (Math.round((st.pos - st.base) / step) + dir) * step;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  };

  return { playing, setPlaying, nudge, markInteraction };
}

const ctrlStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.03)",
  color: "#a3abb5",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

export function AIToolsMarketplaceSection() {
  const [prod, setProd] = useState(0);
  const [auto, setAuto] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [vw, setVw] = useState(1440);
  const tabsRef = useRef<HTMLDivElement>(null);
  const msgBoxRef = useRef<string>("");

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The panel's two columns (text / mockup) stack below ~760px, where the
  // fixed heights that keep the desktop row from jumping between products
  // are no longer needed and would just leave dead space.
  const stacked = vw < 760;
  // Product carousel: how many cards are visible at once. The fraction leaves
  // part of the next card peeking in, so it is clear the row scrolls.
  // (The row runs into the 24px side gutters, so the visible count is a bit
  // higher than this: ≈1.4 on phones, ≈2.5 on tablets, ≈4.5 on desktop.)
  const cardsInView = vw < 600 ? 1.25 : vw < 1000 ? 2.4 : 4.3;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setProd((p) => (p + 1) % PRODUCTS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [auto]);

  const { playing, setPlaying, nudge, markInteraction } = useMarquee(tabsRef);

  const goTo = (i: number) => {
    setProd((i + PRODUCTS.length) % PRODUCTS.length);
    setAuto(false);
    markInteraction(); // clicking a card pauses the carousel so the panel can be read
  };

  // Left/Right arrow keys move between the (canonical) product cards.
  const onCardKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : -1) + PRODUCTS.length) % PRODUCTS.length;
    tabsRef.current?.querySelector<HTMLButtonElement>(`[data-card="1-${n}"]`)?.focus();
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
          <div role="group" aria-label="Product carousel controls" style={{ alignSelf: "flex-end", display: "flex", gap: 8 }}>
            <button type="button" aria-label="Previous products" aria-controls="product-carousel" onClick={() => nudge(-1)} style={ctrlStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" aria-label={playing ? "Pause automatic scrolling" : "Play automatic scrolling"} aria-pressed={!playing} aria-controls="product-carousel" onClick={() => setPlaying((v) => !v)} style={ctrlStyle}>
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
              )}
            </button>
            <button type="button" aria-label="Next products" aria-controls="product-carousel" onClick={() => nudge(1)} style={ctrlStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>

        {/* Product carousel: one row of cards that auto-scrolls in a seamless loop (see useMarquee). */}
        <div
          id="product-carousel"
          ref={tabsRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Products"
          className={styles.noScrollbar}
          style={{
            position: "sticky",
            top: 68,
            zIndex: 20,
            display: "flex",
            gap: 8,
            overflowX: "auto",
            margin: "0 -24px",
            padding: "6px 24px",
            background: "transparent",
            overscrollBehaviorX: "contain",
          }}
        >
            {Array.from({ length: COPIES }, (_, c) => PRODUCTS.map((p, i) => {
              const on = i === prod;
              const hot = hovered === p.slug;
              // Copy 1 (the middle) is the real, keyboard-reachable set; the
              // other copies only exist to make the loop seamless.
              const clone = c !== 1;
              return (
                <button
                  key={`${c}-${p.slug}`}
                  data-card={`${c}-${i}`}
                  type="button"
                  tabIndex={clone ? -1 : undefined}
                  aria-hidden={clone || undefined}
                  onClick={() => goTo(i)}
                  onKeyDown={(e) => onCardKey(e, i)}
                  onMouseEnter={() => setHovered(p.slug)}
                  onMouseLeave={() => setHovered(null)}
                  onDragStart={(e) => e.preventDefault()}
                  aria-pressed={on}
                  style={{
                    // Fixed card width: `cardsInView` cards (incl. the gaps
                    // between them) fill the row; the rest scroll into view.
                    flex: `0 0 calc((100% - ${Math.floor(cardsInView) * 8}px) / ${cardsInView})`,
                    position: "relative",
                    userSelect: "none",
                    overflow: "hidden",
                    cursor: "pointer",
                    textAlign: "left",
                    whiteSpace: "normal",
                    overflowWrap: "break-word",
                    padding: "16px 16px 18px",
                    borderRadius: 14,
                    border: `1px solid ${on ? "rgba(111,227,239,.35)" : hot ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.08)"}`,
                    background: on ? "rgba(111,227,239,.06)" : hot ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.02)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
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
            }))}
          </div>

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
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-geist-mono),monospace", fontSize: 12, color: "#6fe3ef" }}>
                  {String(prod + 1).padStart(2, "0")} / {String(PRODUCTS.length).padStart(2, "0")}
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
                      : { display: "flex", flexDirection: "row", gap: 8, flexWrap: "wrap" }
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
                <ProductMock slug={product.slug} />
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

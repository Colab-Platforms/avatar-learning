"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GeistSans } from "geist/font/sans";
import { HERO_PROMPTS, MARQUEE_ITEMS } from "./data";
import styles from "./ecosystem.module.css";

/**
 * Hero entrance: a CSS animation (see HERO_CSS), so the hero is visible and
 * correctly laid out from the very first paint — not hidden until scripts
 * load and a scroll-reveal fires (which left phones on slow networks with an
 * empty or desktop-sized hero for seconds).
 */
const enter = (step: number) => ({ initial: false as const, className: `hero-enter hero-enter-${step}` });

/**
 * Phone layout (< 600px) as CSS, so it applies on first paint. Desktop values
 * stay in the inline styles exactly as before; these rules only override them
 * on small screens (hence !important over inline styles).
 */
const HERO_CSS = `
@keyframes heroEnter { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: none } }
.hero-enter { animation: heroEnter .8s cubic-bezier(.2,.7,.1,1) both }
.hero-enter-2 { animation-delay: .08s } .hero-enter-3 { animation-delay: .16s } .hero-enter-4 { animation-delay: .24s } .hero-enter-5 { animation-delay: .32s }
@media (prefers-reduced-motion: reduce) { .hero-enter { animation: none } }
.hero-globe-inline { display: none }
.hero-pill-row { grid-template-columns: auto minmax(0,1fr) auto; grid-template-areas: "badge text send" }
/* Tablet/desktop: the hero fills the screen below the 69px sticky navbar (a minimum, never a fixed height, so nothing is clipped). */
@media (min-width: 600px) {
  .hero-root { min-height: calc(100vh - 69px); min-height: calc(100svh - 69px) }
}
@media (max-width: 599px) {
  .hero-area { --hero-pt: 40px !important; --hero-pb: 4px !important }
  .hero-stack { gap: 18px !important }
  .hero-badge { flex-wrap: wrap !important; gap: 6px !important; padding: 8px 14px !important; border-radius: 16px !important; font-size: 11.5px !important; max-width: 280px !important }
  .hero-badge-tag { font-size: 10.5px !important }
  .hero-badge-text { white-space: normal !important }
  .hero-h1 { font-size: clamp(30px,10vw,46px) !important; line-height: 1.06 !important }
  .hero-sub { max-width: 340px !important; font-size: 15px !important; line-height: 1.5 !important }
  .hero-ctas { flex-direction: column !important; width: 100% !important; max-width: 340px !important }
  .hero-cta { width: 100% !important }
  .hero-globe-inline { display: block; position: relative; width: 100%; max-width: 420px; aspect-ratio: 1 / 1; margin: 4px auto -8px; pointer-events: none }
  .hero-pill-wrap { margin-top: 4px !important }
  .hero-pill-outer { border-radius: 24px !important }
  .hero-pill-row { grid-template-columns: minmax(0,1fr) auto; grid-template-areas: "badge badge" "text send"; gap: 8px 12px !important; padding: 12px 12px 12px 16px !important; border-radius: 23px !important; align-items: end !important }
  .hero-pill-text { white-space: normal !important; height: 40px; font-size: 15px !important; line-height: 20px !important }
  .hero-pill-send { width: 36px !important; height: 36px !important }
  .hero-marquee { padding: 16px 0 32px !important }
}
`;

/** Rotating point-cloud "globe" rendered on canvas, with lines between nearby
 * points and a handful of labelled anchor nodes that light up near the cursor. */
const SPHERE_H = 980;

function HeroSphere({ width, height = SPHERE_H, inline = false }: { width: number; height?: number; inline?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ cmx: -9999, cmy: -9999, mx: 0, my: 0, hoverTarget: 0, hover: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Size the backing store here rather than via JSX attributes: the server
    // render has no devicePixelRatio, and hydration never patches a
    // mismatched `height`, which left the globe squashed into an oval on
    // zoomed / scaled displays.
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    // Same node density, radius, glow and interaction on every breakpoint —
    // the globe is just naturally smaller on a narrower canvas, not a
    // separately toned-down mobile variant.
    const N = 420;
    const pts: [number, number, number, number][] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = ga * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r, Math.random() * 6.28]);
    }
    const pairs: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        const dz = pts[i][2] - pts[j][2];
        if (dx * dx + dy * dy + dz * dz < 0.042) pairs.push([i, j]);
      }
    }
    const anchors: [number, string][] = [
      [36, "Leads"],
      [98, "Orders"],
      [165, "Content"],
      [232, "Team training"],
      [300, "Reports"],
      [370, "Custom tools"],
    ];

    let rot = 0;
    let tx = 0;
    let ty = 0;
    const proj = new Array<[number, number, number, number, number]>(N);
    const m = mouseRef.current;
    let raf = 0;

    let lastNow = -1;
    const draw = (now: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const w = c.width;
      const hh = c.height;
      const dp = w / (parseFloat(c.style.width) || w);
      ctx.clearRect(0, 0, w, hh);
      // Motion is stepped by elapsed time, not by frame count, so the globe
      // turns at the same speed on 60Hz, 120Hz and throttled devices.
      const dt = lastNow < 0 || now <= lastNow ? 1 : Math.min(3, (now - lastNow) / 16.667);
      lastNow = now;
      const ease = (f: number) => 1 - Math.pow(1 - f, dt);
      m.hover += (m.hoverTarget - m.hover) * ease(0.06);
      const hv = m.hover;
      const R = Math.min(w * (w < 600 * dp ? 0.5 : 0.42), hh * 0.5);
      const cx = w / 2;
      const cy = hh * 0.5;
      const t = (now || 0) / 1000;
      rot += (0.0018 + hv * 0.0012) * dt;
      tx += (m.my * 0.3 - tx) * ease(0.04);
      ty += (m.mx * 0.45 - ty) * ease(0.04);
      const ay = rot + ty;
      const ax = 0.3 + tx;
      const sy = Math.sin(ay);
      const cyy = Math.cos(ay);
      const sx = Math.sin(ax);
      const cxx = Math.cos(ax);
      const mX = m.cmx * dp;
      const mY = m.cmy * dp;
      const rad = 170 * dp;

      for (let i = 0; i < N; i++) {
        const p = pts[i];
        const x = p[0] * cyy + p[2] * sy;
        let z = -p[0] * sy + p[2] * cyy;
        const y = p[1] * cxx - z * sx;
        z = p[1] * sx + z * cxx;
        const X = cx + x * R;
        const Y = cy + y * R;
        const d = (z + 1) / 2;
        const dd = Math.hypot(X - mX, Y - mY);
        const k = dd < rad ? (1 - dd / rad) * hv * d : 0;
        proj[i] = [X, Y, d, p[3], k];
      }

      for (const [a, b] of pairs) {
        const A = proj[a];
        const B = proj[b];
        const d = (A[2] + B[2]) / 2;
        const k = Math.max(A[4], B[4]);
        ctx.strokeStyle = `rgba(${k > 0.05 ? "160,240,248" : "111,227,239"},${(0.015 + d * 0.11 + k * 0.7).toFixed(3)})`;
        ctx.lineWidth = dp * (1 + k * 1.6);
        ctx.beginPath();
        ctx.moveTo(A[0], A[1]);
        ctx.lineTo(B[0], B[1]);
        ctx.stroke();
      }

      for (let i = 0; i < N; i++) {
        const P = proj[i];
        const d = P[2];
        const k = P[4];
        const fl = Math.sin(t * 1.3 + P[3] * 7) > 0.988;
        const r = (0.7 + d * 1.7) * dp * (fl ? 2 : 1) * (1 + k * 1.6);
        ctx.fillStyle =
          fl || k > 0.25
            ? "rgba(233,253,255,1)"
            : d > 0.5
              ? `rgba(143,233,242,${(0.3 + d * 0.6).toFixed(2)})`
              : `rgba(107,124,255,${(0.18 + d * 0.5).toFixed(2)})`;
        if (fl || k > 0.25) {
          ctx.shadowColor = "#6fe3ef";
          ctx.shadowBlur = 14 * dp;
        }
        ctx.beginPath();
        ctx.arc(P[0], P[1], r, 0, 6.283);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.strokeStyle = `rgba(143,233,242,${(0.12 + hv * 0.2).toFixed(2)})`;
      ctx.lineWidth = dp;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.32, R * 0.3, -0.16, 0, 6.283);
      ctx.stroke();

      if (hv > 0.02) {
        ctx.font = `500 ${Math.round(13 * dp)}px ${GeistSans.style.fontFamily}, system-ui, sans-serif`;
        ctx.textBaseline = "middle";
        for (const [ai, label] of anchors) {
          const P = proj[ai];
          if (P[2] < 0.5) continue;
          const al = hv * Math.min(1, (P[2] - 0.5) * 4);
          const lx = P[0] + (P[0] > cx ? 26 : -26) * dp;
          const ly = P[1] - 22 * dp;
          const tw = ctx.measureText(label).width;
          const pw = tw + 22 * dp;
          const ph = 26 * dp;
          const bx = P[0] > cx ? lx : lx - pw;
          ctx.globalAlpha = al;
          ctx.strokeStyle = "rgba(143,233,242,.7)";
          ctx.beginPath();
          ctx.moveTo(P[0], P[1]);
          ctx.lineTo(P[0] > cx ? bx : bx + pw, ly);
          ctx.stroke();
          ctx.fillStyle = "rgba(12,14,19,.9)";
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(bx, ly - ph / 2, pw, ph, ph / 2);
          else ctx.rect(bx, ly - ph / 2, pw, ph);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#e9fdff";
          ctx.fillText(label, bx + 11 * dp, ly);
          ctx.shadowColor = "#6fe3ef";
          ctx.shadowBlur = 12 * dp;
          ctx.beginPath();
          ctx.arc(P[0], P[1], 3.5 * dp, 0, 6.283);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }
    };

    draw(0);

    // Reduced-motion: paint the globe once as a static background and skip
    // the rAF loop and mouse-reactive glow entirely — the sphere stays
    // visible, it just doesn't animate or chase the cursor.
    if (reduce) return;

    let visible = true;
    const loop = (now: number) => {
      draw(now);
      if (visible) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Scrolling the hero far out of view shouldn't keep this per-frame
    // canvas redraw (hundreds of line segments) competing for the main
    // thread with the rest of the page's scroll handling.
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          const wasVisible = visible;
          visible = entries[0]?.isIntersecting ?? true;
          if (visible && !wasVisible) raf = requestAnimationFrame(loop);
          else if (!visible) cancelAnimationFrame(raf);
        },
        { rootMargin: "200px 0px" },
      );
      io.observe(canvas);
    }

    const header = canvas.closest("header");
    const onMove = (e: MouseEvent) => {
      if (!header) return;
      const b = header.getBoundingClientRect();
      m.mx = (e.clientX - b.left) / b.width - 0.5;
      m.my = (e.clientY - b.top) / b.height - 0.5;
      const cb = canvas.getBoundingClientRect();
      m.cmx = e.clientX - cb.left;
      m.cmy = e.clientY - cb.top;
    };
    // Canvas opacity stays constant — brightness reacts to the cursor only
    // through each point's localized `k` factor below, never as a whole-globe
    // flood so the sphere doesn't read as "continuously bright" on hover.
    const onEnter = () => {
      m.hoverTarget = 1;
    };
    const onLeave = () => {
      m.hoverTarget = 0;
      m.cmx = m.cmy = -9999;
    };
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine && header) {
      header.addEventListener("mousemove", onMove);
      header.addEventListener("mouseenter", onEnter);
      header.addEventListener("mouseleave", onLeave);
    }

    // Touch devices have no persistent cursor, but a finger dragging across
    // the globe should still light it up the same way a mouse would — so
    // mirror onMove/onEnter/onLeave off touch events. Listeners are passive
    // (no preventDefault) so page scrolling is never blocked.
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch || !header) return;
      const b = header.getBoundingClientRect();
      m.mx = (touch.clientX - b.left) / b.width - 0.5;
      m.my = (touch.clientY - b.top) / b.height - 0.5;
      const cb = canvas.getBoundingClientRect();
      m.cmx = touch.clientX - cb.left;
      m.cmy = touch.clientY - cb.top;
      m.hoverTarget = 1;
    };
    const onTouchEnd = () => {
      m.hoverTarget = 0;
      m.cmx = m.cmy = -9999;
    };
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (hasTouch && header) {
      header.addEventListener("touchstart", onTouchMove, { passive: true });
      header.addEventListener("touchmove", onTouchMove, { passive: true });
      header.addEventListener("touchend", onTouchEnd, { passive: true });
      header.addEventListener("touchcancel", onTouchEnd, { passive: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      if (fine && header) {
        header.removeEventListener("mousemove", onMove);
        header.removeEventListener("mouseenter", onEnter);
        header.removeEventListener("mouseleave", onLeave);
      }
      if (hasTouch && header) {
        header.removeEventListener("touchstart", onTouchMove);
        header.removeEventListener("touchmove", onTouchMove);
        header.removeEventListener("touchend", onTouchEnd);
        header.removeEventListener("touchcancel", onTouchEnd);
      }
    };
  }, [width, height]);

  const H = height;

  return (
    <div
      aria-hidden="true"
      style={
        inline
          ? { position: "absolute", inset: 0, pointerEvents: "none" }
          : {
              // Centred on the hero content area (its parent), independent of the content itself.
              position: "absolute",
              left: 0,
              right: 0,
              top: "50%",
              marginTop: -H / 2,
              height: H,
              pointerEvents: "none",
              WebkitMaskImage: "linear-gradient(180deg,transparent 0%,#000 16%,#000 80%,transparent 100%)",
              maskImage: "linear-gradient(180deg,transparent 0%,#000 16%,#000 80%,transparent 100%)",
            }
      }
    >
      <div
        className={styles.breathe}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: H,
          height: H,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(111,227,239,.16),rgba(107,124,255,.07) 45%,transparent 70%)",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width, height: H, opacity: inline ? 0.85 : 0.55 }}
      />
    </div>
  );
}

function HeroPromptPill() {
  const promptRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let k = 0;
    const run = () => {
      const el = promptRef.current;
      if (!el) {
        timeout = setTimeout(run, 400);
        return;
      }
      const [q] = HERO_PROMPTS[k % HERO_PROMPTS.length];
      let n = 0;
      const type = () => {
        const p2 = promptRef.current;
        if (!p2) return;
        n++;
        p2.textContent = q.slice(0, n);
        if (n < q.length) {
          timeout = setTimeout(type, 38);
        } else {
          timeout = setTimeout(() => {
            timeout = setTimeout(() => {
              const p3 = promptRef.current;
              if (p3) p3.textContent = "";
              k++;
              run();
            }, 2600);
          }, 500);
        }
      };
      timeout = setTimeout(type, 400);
    };
    run();
    return () => clearTimeout(timeout);
  }, []);

  const badge = (
    <span
      style={{
        gridArea: "badge",
        justifySelf: "start",
        flex: "none",
        fontFamily: "var(--font-geist-mono),monospace",
        fontSize: 12,
        color: "#8fe9f2",
        padding: "3px 8px",
        borderRadius: 999,
        background: "rgba(111,227,239,.12)",
      }}
    >
      Ask Avatar AI
    </span>
  );
  const caret = (
    <span
      className={styles.blink}
      style={{
        display: "inline-block",
        width: 2,
        height: "1.1em",
        marginLeft: 2,
        verticalAlign: "-3px",
        background: "#f4f6f8",
      }}
    />
  );
  const send = (
    <span
      className="hero-pill-send"
      style={{
        gridArea: "send",
        flex: "none",
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "#f4f6f8",
        color: "#07080b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </span>
  );

  return (
    <div style={{ position: "relative", width: 670, maxWidth: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div
        className="hero-pill-outer"
        style={{
          width: "100%",
          boxSizing: "border-box",
          borderRadius: 999,
          padding: 1,
          background: "linear-gradient(90deg,rgba(107,124,255,.6),rgba(111,227,239,.7))",
          boxShadow: "0 20px 60px rgba(0,0,0,.6),0 0 40px rgba(111,227,239,.2)",
        }}
      >
        <div
          className="hero-pill-row"
          style={{
            display: "grid",
            alignItems: "center",
            gap: 14,
            padding: "14px 14px 14px 22px",
            borderRadius: 999,
            background: "rgba(10,12,16,.92)",
            backdropFilter: "blur(10px)",
            textAlign: "left",
          }}
        >
          {badge}
          <span className="hero-pill-text" style={{ gridArea: "text", minWidth: 0, fontSize: 17, color: "#f4f6f8", whiteSpace: "nowrap", overflow: "hidden" }}>
            <span ref={promptRef} />
            {caret}
          </span>
          {send}
        </div>
      </div>
    </div>
  );
}

function Marquee() {
  const row = (key: string) => (
    <div key={key} style={{ display: "flex" }}>
      {MARQUEE_ITEMS.map((t, i) => (
        <span
          key={key + i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            fontSize: 18,
            color: "#98a1ac",
            whiteSpace: "nowrap",
            padding: "0 28px",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6fe3ef", boxShadow: "0 0 8px #6fe3ef" }} />
          {t}
        </span>
      ))}
    </div>
  );
  return (
    <div className={styles.marquee} style={{ display: "flex", width: "max-content" }}>
      {row("a")}
      {row("b")}
    </div>
  );
}

export function EcosystemHero() {
  const [width, setWidth] = useState(1440);
  useEffect(() => {
    // Page width without the scrollbar, so the globe shares the content's centre line.
    const onResize = () => setWidth(document.documentElement.clientWidth || window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // JS width is only used for the canvas globe (drawn after load). All layout
  // switching is CSS (HERO_CSS) so the first paint is already right on phones.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const phone = mounted && width < 600;
  // Phone globe fills its box (screen width minus the 20px phone gutters), so it stays centred.
  const globeSize = Math.max(200, Math.min(420, width - 40));

  return (
    <header
      id="top"
      data-screen-label="01 Hero"
      className="hero-root"
      style={{
        position: "relative",
        overflowX: "clip",
        overflowY: "visible",
        // Two stacked layers: the content area (centred group + globe behind it) and the ticker.
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{HERO_CSS}</style>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          WebkitMaskImage: "linear-gradient(180deg,#000 45%,transparent 100%)",
          maskImage: "linear-gradient(180deg,#000 45%,transparent 100%)",
        }}
      >
        <div
          className={styles.breathe}
          style={{
            position: "absolute",
            left: "50%",
            top: -320,
            width: 1300,
            height: 1000,
            marginLeft: -650,
            background: "radial-gradient(ellipse 50% 50% at 50% 0%,rgba(111,227,239,.16),rgba(107,124,255,.08) 50%,transparent 75%)",
            filter: "blur(20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-10%",
            top: "30%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(107,124,255,.07),transparent 65%)",
            filter: "blur(30px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-10%",
            top: "15%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(111,227,239,.06),transparent 65%)",
            filter: "blur(30px)",
          }}
        />
      </div>

      {/* Content area: fills the hero above the ticker and centres the content group in it.
          The bottom padding is smaller because the ticker adds its own 40px on top, so the
          visible space above and below the group matches. */}
      <div
        className="hero-area"
        style={
          {
            "--hero-pt": "clamp(56px,6vw,88px)",
            "--hero-pb": "clamp(16px,3.2vw,48px)",
            position: "relative",
            flex: "1 0 auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "var(--hero-pt) var(--ad-gutter) var(--hero-pb)",
          } as React.CSSProperties
        }
      >
      {/* Background layer = the padded box the content group is centred in, so the globe's
          centre is the group's centre. Its size never affects the content's position. */}
      <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: "var(--hero-pt)", bottom: "var(--hero-pb)", pointerEvents: "none" }}>
      {/* Desktop/tablet: globe behind the hero. Phones: it moves below the buttons (see .hero-globe-inline). */}
      {!phone && <HeroSphere width={width} />}

      {/* Darkens the globe directly behind the text so it stays readable; centred with the globe. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginTop: -360,
          width: 1200,
          maxWidth: "130%",
          height: 720,
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse 52% 50% at 50% 48%,rgba(7,8,11,.9),rgba(7,8,11,.6) 50%,rgba(7,8,11,.2) 72%,transparent 85%)",
          pointerEvents: "none",
        }}
      />
      </div>

      <div
        className="hero-stack"
        style={{
          position: "relative",
          // Full width of the area (it is a flex item; auto margins alone would shrink it to its content).
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 28,
        }}
      >
        <motion.div
          initial={false}
          className="hero-enter hero-enter-1 hero-badge"
          style={{
            display: "flex",
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "6px 14px 6px 8px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.03)",
            fontSize: 13,
            color: "#a3abb5",
            maxWidth: "100%",
            textAlign: "center",
          }}
        >
          <span
            className="hero-badge-tag"
            style={{
              flex: "none",
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(111,227,239,.14)",
              color: "#8fe9f2",
              fontFamily: "var(--font-geist-mono),monospace",
              fontSize: 12,
              letterSpacing: ".06em",
            }}
          >
            AI-POWERED
          </span>
          <span className="hero-badge-text" style={{ minWidth: 0, whiteSpace: "nowrap" }}>
            AI Adoption Ecosystem for Indian businesses
          </span>
        </motion.div>

        <motion.div {...enter(2)} style={{ position: "relative", maxWidth: "100%" }}>
          <h1
            className="hero-h1"
            style={{
              margin: 0,
              fontSize: "clamp(44px,7.2vw,96px)",
              lineHeight: 1.02,
              letterSpacing: "-0.045em",
              fontWeight: 600,
            }}
          >
            <span style={{ display: "block", whiteSpace: "nowrap", color: "#ffffff" }}>Put AI to work</span>
            <span
              style={{
                display: "block",
                whiteSpace: "nowrap",
                paddingBottom: "0.08em",
                background: "linear-gradient(180deg,#e6eaee 0%,#b9c0c8 55%,#8e98a4 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              in your business
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={false}
          className="hero-enter hero-enter-3 hero-sub"
          style={{
            margin: 0,
            maxWidth: 560,
            fontSize: "clamp(17px,1.6vw,20px)",
            lineHeight: 1.5,
            color: "#a3abb5",
          }}
        >
          We bring together AI solutions, technology and talent to help businesses identify opportunities, implement the right solutions and scale measurable outcomes.
        </motion.p>

        <motion.div
          initial={false}
          className="hero-enter hero-enter-4 hero-ctas"
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
            width: "auto",
            maxWidth: "100%",
          }}
        >
          <a
            href="#contact"
            className="hero-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              width: "auto",
              height: 50,
              lineHeight: 1,
              background: "#f4f6f8",
              color: "#07080b",
              padding: "0 26px",
              borderRadius: 999,
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            Book a free consultation
          </a>
          <a
            href="/tools"
            className="hero-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              width: "auto",
              height: 50,
              lineHeight: 1,
              border: "1px solid rgba(255,255,255,.16)",
              color: "#f4f6f8",
              padding: "0 26px",
              borderRadius: 999,
              fontWeight: 500,
              fontSize: 15,
              background: "rgba(255,255,255,.03)",
            }}
          >
            Explore products →
          </a>
        </motion.div>

        {/* Phones: the globe sits here, below the buttons, in a square that scales with the screen. */}
        <div className="hero-globe-inline" aria-hidden="true">
          {phone && <HeroSphere width={globeSize} height={globeSize} inline />}
        </div>

        {/* Slightly more space than the other gaps (28 + 12), so it reads as the next step after the buttons. */}
        <motion.div initial={false} className="hero-enter hero-enter-5 hero-pill-wrap" style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 12 }}>
          <HeroPromptPill />
        </motion.div>
      </div>
      </div>

      <div
        className="hero-marquee"
        style={{
          position: "relative",
          padding: "40px 0 72px",
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)",
          maskImage: "linear-gradient(90deg,transparent,#000 15%,#000 85%,transparent)",
        }}
      >
        <Marquee />
      </div>
    </header>
  );
}

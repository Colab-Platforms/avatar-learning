"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CoreHandle } from "./EcosystemCore";
import { EcosystemConnections } from "./EcosystemConnections";
import { EcosystemNodes } from "./EcosystemNodes";
import { COMPACT_BELOW, CORE_FRAC, NODES, T, curvePoint, lineDur, lineStart, linkPaths, nodeStart, type LinkPath } from "./layout";
import styles from "./connectedEcosystem.module.css";

type Mode = "loading" | "webgl" | "fallback";

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Parallax travel in CSS px at the panel edge: core most, modules less, dust barely. */
const PARALLAX = { core: 5, nodes: 2.5, dust: 1 };
/** Length of the light trail behind each particle (share of the line). */
const TRAIL = 0.12; // keep in sync with .trail stroke-dasharray

/**
 * About page hero visual: the AVATAR core (Three.js) connected to eight
 * ecosystem modules (HTML + SVG). The reveal plays once (≈8 s); after that the
 * scene stays complete with ambient motion only: the core floats, particles
 * flow from the core to every module, a few borders breathe, and a soft pulse
 * runs through the network every 10 s.
 *
 * One requestAnimationFrame loop drives the WebGL core, particles, pulse and
 * parallax by writing to the DOM directly — no React state per frame. It stops
 * when the panel is off-screen or the tab is hidden, and the CSS reveal pauses
 * with it. Reduced motion shows the finished scene, still.
 */
export function ConnectedAIEcosystem() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linesLayerRef = useRef<HTMLDivElement>(null);
  const nodesLayerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const [mode, setMode] = useState<Mode>("loading");
  const [compact, setCompact] = useState(false);
  const [phase, setPhase] = useState<"idle" | "live" | "static">("idle");
  const [active, setActive] = useState<number | null>(null);

  const paths = useMemo(() => linkPaths(compact), [compact]);
  // Read by the animation loop; refreshed whenever the layout changes.
  const pathsRef = useRef<LinkPath[]>(paths);
  const domDirty = useRef(true);
  useEffect(() => {
    pathsRef.current = paths;
    domDirty.current = true;
  }, [paths]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    pointer.current.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    pointer.current.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
  }, []);
  const onPointerLeave = useCallback(() => {
    pointer.current.x = 0;
    pointer.current.y = 0;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCompact = () => root.clientWidth < COMPACT_BELOW;
    setCompact(isCompact());

    let disposed = false;
    let core: CoreHandle | null = null;
    let ready = false;
    let started = false;
    let visible = false;
    let raf = 0;
    let clock = 0; // scene seconds; only advances while running
    let last = 0;
    const tilt = { x: 0, y: 0 };

    // Cached element lists (re-queried only after the layout re-renders).
    let particleEls: { g: SVGGElement; dot: SVGCircleElement; trail: SVGPathElement; i: number; j: number }[] = [];
    let pulseEls: SVGPathElement[] = [];
    let nodeEls: { el: HTMLElement; i: number }[] = [];
    const refreshDom = () => {
      particleEls = Array.from(root.querySelectorAll<SVGGElement>("[data-particle]")).map((g) => {
        const [i, j] = g.dataset.particle!.split(":").map(Number);
        return { g, dot: g.querySelector("circle")!, trail: g.querySelector("path")!, i, j };
      });
      pulseEls = Array.from(root.querySelectorAll<SVGPathElement>("[data-pulse]"));
      nodeEls = Array.from(root.querySelectorAll<HTMLElement>("[data-node]")).map((el) => ({ el, i: Number(el.dataset.node) }));
      domDirty.current = false;
    };

    const resize = () => {
      const w = root.clientWidth;
      const h = root.clientHeight;
      core?.setSize(w, h, CORE_FRAC);
      setCompact(w < COMPACT_BELOW);
      // Resizing clears the canvas; redraw now if the loop isn't running.
      if (!raf) drawFrame(reduce ? 99 : clock);
    };

    function drawFrame(t: number) {
      if (domDirty.current) refreshDom();

      // Core: faint light, then the glass body fades and scales in (0–2 s).
      const reveal = smooth((t - T.coreIn) / T.coreDur);
      let glow = 0.35 * reveal + 0.65 * smooth((t - T.glowUp) / 1.2);
      if (t >= T.pulse && !reduce) {
        const ph = (t - T.pulse) % T.period;
        glow += 0.07 * Math.sin(((t - T.pulse) / 5) * Math.PI * 2); // slow breathing
        if (ph < 0.7) glow += 0.25 * Math.sin((ph / 0.7) * Math.PI); // the core sends the pulse
      }

      // Gentle float (±4 px) plus a small, eased response to the pointer.
      tilt.x += (pointer.current.x - tilt.x) * 0.06;
      tilt.y += (pointer.current.y - tilt.y) * 0.06;
      const floatY = reduce ? 0 : Math.sin(t * 0.6) * 4;
      const coreX = tilt.x * PARALLAX.core;
      const coreY = floatY + tilt.y * PARALLAX.core;
      core?.render({
        time: t,
        reveal,
        glow,
        rotX: -0.07 + Math.sin(t * 0.21) * 0.025 + tilt.y * 0.08,
        rotY: Math.sin(t * 0.15) * 0.1 + tilt.x * 0.12,
        offsetX: coreX,
        offsetY: coreY,
        dustX: tilt.x * PARALLAX.dust,
        dustY: tilt.y * PARALLAX.dust,
      });
      if (logoRef.current) logoRef.current.style.transform = `translate3d(calc(-50% + ${coreX.toFixed(2)}px), calc(-50% + ${coreY.toFixed(2)}px), 0)`;
      // Lines and modules move together (so lines stay attached), at half the core's travel.
      const shift = `translate3d(${(tilt.x * PARALLAX.nodes).toFixed(2)}px, ${(tilt.y * PARALLAX.nodes).toFixed(2)}px, 0)`;
      if (linesLayerRef.current) linesLayerRef.current.style.transform = shift;
      if (nodesLayerRef.current) nodesLayerRef.current.style.transform = shift;

      if (reduce) return;
      const paths = pathsRef.current;

      // Data particles: flow from the core out to each module once its line has drawn.
      // Each line has its own speed and phase, so they never move in lockstep.
      for (const { g, dot, trail, i, j } of particleEls) {
        const n = NODES[i];
        const begin = lineStart(n) + lineDur(n) * 0.7;
        if (t < begin) {
          g.style.opacity = "0";
          continue;
        }
        const speed = 0.2 + ((i * 3) % 5) * 0.018;
        const u = ((t - begin) * speed + j * 0.5 + i * 0.137) % 1;
        const pt = curvePoint(paths[i].p, paths[i].c, u);
        dot.setAttribute("cx", pt.x.toFixed(1));
        dot.setAttribute("cy", pt.y.toFixed(1));
        trail.style.strokeDashoffset = (TRAIL - u).toFixed(4);
        // Fade in near the core (hidden under it anyway) and out as it reaches the module.
        const edge = Math.min(1, u / 0.25, (1 - u) / 0.12);
        g.style.opacity = (Math.max(0, edge) * Math.min(1, (t - begin) * 1.5)).toFixed(3);
      }

      // Soft pulse from the core through every connection, every PERIOD seconds.
      const ph = t >= T.pulse ? (t - T.pulse) % T.period : -1;
      const travel = ph >= 0 && ph < T.pulseDur ? ph / T.pulseDur : -1;
      for (const el of pulseEls) {
        if (travel < 0) {
          el.style.opacity = "0";
          continue;
        }
        el.style.opacity = (smooth(travel / 0.15) * (1 - smooth((travel - 0.8) / 0.2))).toFixed(3);
        el.style.strokeDashoffset = (0.22 - travel * 1.22).toFixed(4);
      }
      // Modules glow briefly as the pulse reaches them.
      const arrive = ph >= 0 ? Math.max(0, 1 - Math.abs(ph - T.pulseDur * 0.85) / 0.6) : 0;
      for (const { el, i } of nodeEls) {
        el.style.setProperty("--pulse", t >= nodeStart(NODES[i]) + 0.7 ? smooth(arrive).toFixed(3) : "0");
      }
    }

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      clock += dt;
      drawFrame(clock);
      raf = requestAnimationFrame(tick);
    };

    const setRunning = () => {
      const run = started && !reduce && visible && document.visibilityState === "visible";
      root.toggleAttribute("data-paused", !run);
      if (run && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const maybeStart = () => {
      if (started || !ready || !visible) return;
      started = true;
      if (reduce) {
        setPhase("static");
        drawFrame(99);
      } else {
        setPhase("live");
      }
      setRunning();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        maybeStart();
        setRunning();
      },
      { rootMargin: "80px 0px" },
    );
    io.observe(root);
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const onVis = () => setRunning();
    document.addEventListener("visibilitychange", onVis);

    // Lazy-load three only here; fall back to the static SVG core if WebGL is unavailable.
    import("./EcosystemCore")
      .then(({ createEcosystemCore }) => {
        if (disposed) return;
        core = createEcosystemCore(canvas, { compact: isCompact() });
        setMode(core ? "webgl" : "fallback");
      })
      .catch(() => {
        if (!disposed) setMode("fallback");
      })
      .finally(() => {
        if (disposed) return;
        ready = true;
        resize();
        maybeStart();
      });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      core?.dispose();
      core = null;
    };
  }, []);

  const rootClass = [
    styles.root,
    phase === "live" && styles.live,
    phase === "static" && styles.static,
    mode === "webgl" && styles.webgl,
    compact && styles.compact,
    active !== null && styles.hasActive,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={rootClass} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <div aria-hidden="true" className={styles.backLight} />
      <div ref={linesLayerRef} className={styles.parallax}>
        <EcosystemConnections paths={paths} active={active} particlesPerLine={compact ? 1 : 2} showFallbackCore={mode === "fallback"} />
      </div>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div aria-hidden="true" className={styles.vignette} />
      <div ref={logoRef} className={styles.logo} aria-hidden="true">
        {/* The site's own AVATAR logo file, cropped to its symbol (left 40.6 of 119 units). */}
        <span className={styles.logoMark}>
          {/* Plain <img>: the crop sizes it by height only, which next/image warns about. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landingpage-images/Avatar_logo_Light.svg" alt="" width={119} height={32} decoding="async" className={styles.logoImg} />
        </span>
        <span className={styles.logoText}>AVATAR AI</span>
      </div>
      {/* Same parallax offset as the lines, so every line stays attached to its node. */}
      <div ref={nodesLayerRef} className={styles.parallax}>
        <EcosystemNodes paths={paths} active={active} onHover={setActive} />
      </div>
    </div>
  );
}

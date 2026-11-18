"use client";

import { useEffect, useRef } from "react";
import s from "./learnAdopt.module.css";

const N = 140; // sphere nodes
const LINK = 0.36; // max 3D distance (unit sphere) for a connecting line
const PARTICLES = 14;

/**
 * A softly glowing neural sphere drawn on a 2D canvas: nodes on a sphere
 * (Fibonacci layout) joined by fine lines, rotating slowly with a gentle
 * light pulse, plus a few drifting particles. Fills its container, pauses
 * when off-screen.
 */
export function NeuralSphere() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!box || !cv || !ctx) return;
    // Always animates, including when the OS reports reduced motion (by request).
    const reduce = false;

    // Fibonacci sphere + precomputed neighbour pairs.
    const pts: [number, number, number][] = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      pts.push([Math.cos(ga * i) * r, y, Math.sin(ga * i) * r]);
    }
    const pairs: [number, number][] = [];
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const dx = pts[i][0] - pts[j][0];
        const dy = pts[i][1] - pts[j][1];
        const dz = pts[i][2] - pts[j][2];
        if (dx * dx + dy * dy + dz * dz < LINK * LINK) pairs.push([i, j]);
      }
    const parts = Array.from({ length: PARTICLES }, () => ({
      a: Math.random() * Math.PI * 2,
      d: 1.15 + Math.random() * 0.45, // orbit radius (× sphere radius)
      v: (Math.random() * 0.5 + 0.2) * (Math.random() < 0.5 ? -1 : 1),
      y: (Math.random() - 0.5) * 1.4,
      s: Math.random() * 1.2 + 0.6,
    }));

    let w = 0;
    let h = 0;
    let dpr = 1;
    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = box.clientWidth;
      h = box.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    };
    size();

    const proj: [number, number, number][] = new Array(N);
    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.34;
      const cx = w / 2;
      const cy = h / 2;
      const rot = t * 0.00012;
      const tilt = 0.38;
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.0012);

      // core glow
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.7);
      g.addColorStop(0, `rgba(140, 205, 245, ${0.16 + pulse * 0.08})`);
      g.addColorStop(0.45, "rgba(107, 124, 255, 0.06)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const sy = Math.sin(rot);
      const cyr = Math.cos(rot);
      const sx = Math.sin(tilt);
      const cxr = Math.cos(tilt);
      for (let i = 0; i < N; i++) {
        const [px, py, pz] = pts[i];
        const x = px * cyr + pz * sy;
        let z = -px * sy + pz * cyr;
        const y = py * cxr - z * sx;
        z = py * sx + z * cxr;
        proj[i] = [cx + x * R, cy + y * R, (z + 1) / 2]; // depth 0 (back) .. 1 (front)
      }

      ctx.lineWidth = 0.7;
      for (const [a, b] of pairs) {
        const d = (proj[a][2] + proj[b][2]) / 2;
        ctx.strokeStyle = `rgba(187, 227, 250, ${(0.03 + d * 0.22).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(proj[a][0], proj[a][1]);
        ctx.lineTo(proj[b][0], proj[b][1]);
        ctx.stroke();
      }

      for (let i = 0; i < N; i++) {
        const [x, y, d] = proj[i];
        // a travelling light band across the sphere
        const wave = Math.max(0, Math.sin(t * 0.0009 + pts[i][1] * 3));
        const a = 0.18 + d * 0.55 + wave * pulse * 0.25;
        ctx.fillStyle = d > 0.55 ? `rgba(223, 243, 255, ${a.toFixed(3)})` : `rgba(140, 170, 255, ${(a * 0.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + d * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of parts) {
        const ang = p.a + t * 0.00025 * p.v;
        const x = cx + Math.cos(ang) * R * p.d;
        const y = cy + p.y * R + Math.sin(ang * 0.7) * R * 0.12;
        const front = (Math.sin(ang) + 1) / 2;
        ctx.fillStyle = `rgba(200, 235, 255, ${(0.15 + front * 0.4).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let visible = true;
    const loop = (t: number) => {
      draw(t);
      if (visible) raf = requestAnimationFrame(loop);
    };
    const ro = new ResizeObserver(() => {
      size();
      if (reduce || !visible) draw(4000);
    });
    ro.observe(box);

    if (reduce) {
      draw(4000);
      return () => ro.disconnect();
    }
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) raf = requestAnimationFrame(loop);
      if (!visible) cancelAnimationFrame(raf);
    });
    io.observe(box);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className={s.sphereBox}>
      <canvas ref={canvas} className={s.sphereCanvas} />
    </div>
  );
}

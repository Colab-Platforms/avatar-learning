"use client";

import { useEffect, useRef } from "react";
import s from "./learnAdopt.module.css";

/**
 * A soft blue shine that follows the mouse anywhere on the page. It eases
 * after the cursor (lerp per frame) and lightens whatever it passes over
 * (screen blend), fading out when the mouse leaves the window.
 * Mouse/trackpad only; never intercepts clicks.
 */
export function CursorShine() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let raf = 0;

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      el.dataset.on = "";
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => delete el.dataset.on;

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className={s.shine} aria-hidden="true">
      <span />
    </div>
  );
}

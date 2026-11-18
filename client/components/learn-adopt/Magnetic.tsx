"use client";

import { useEffect, useRef } from "react";
import s from "./learnAdopt.module.css";

/**
 * Subtle magnetic pull: the wrapped button leans toward the cursor and
 * springs back on leave. Pointer devices only.
 * Uses the `translate` property so it never fights transform animations.
 */
export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.translate = `${(dx * strength).toFixed(1)}px ${(dy * strength).toFixed(1)}px`;
    };
    const leave = () => {
      el.style.translate = "0 0";
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={s.magnetic}>
      {children}
    </span>
  );
}

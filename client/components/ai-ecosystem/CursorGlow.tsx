"use client";

import { useEffect, useRef } from "react";

/** Soft radial glow that follows the cursor anywhere on the page, fading in
 * on mouse enter and out on mouse leave — matches the reference's page-wide
 * ambient cursor effect. Disabled for touch/coarse pointers and users who
 * prefer reduced motion. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    const onMove = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.opacity = "1";
    };
    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -999,
        top: -999,
        zIndex: -1,
        width: 650,
        height: 650,
        margin: "-325px 0 0 -325px",
        borderRadius: "50%",
        background: "radial-gradient(circle,rgba(233,253,255,.4) 0%,rgba(111,227,239,.28) 30%,transparent 68%)",
        pointerEvents: "none",
        opacity: 0,
        transition: "left .6s ease-out, top .6s ease-out, opacity .6s ease",
      }}
    />
  );
}

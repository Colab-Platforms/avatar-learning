"use client";

import { useEffect, useRef } from "react";

// After rotate(45, 18, 18) the nib tip (18,29) lands at ≈ (10, 26) in a 36×36 viewBox.
// SVG rendered at 52×52 → scale = 52/36 ≈ 1.444 → TIP_X ≈ 14, TIP_Y ≈ 38
const TIP_X = 14;
const TIP_Y = 38;

export function PenCursor() {
  const penRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = penRef.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      el.style.transform = `translate3d(${e.clientX - TIP_X}px,${e.clientY - TIP_Y}px,0)`;
      el.style.opacity = "1";
    };
    const hide = () => { el.style.opacity = "0"; };
    const show = () => { el.style.opacity = "1"; };

    const inkDrop = (e: MouseEvent) => {
      const dot = document.createElement("div");
      dot.style.cssText = `
        position:fixed;left:${e.clientX - 3}px;top:${e.clientY - 3}px;
        width:6px;height:6px;border-radius:50%;
        background:rgba(0,200,255,0.85);pointer-events:none;z-index:99998;
        animation:ink-drop 0.55s ease-out forwards;
      `;
      document.body.appendChild(dot);
      dot.addEventListener("animationend", () => dot.remove(), { once: true });
    };

    window.addEventListener("mousemove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    document.documentElement.addEventListener("mouseenter", show);
    window.addEventListener("click", inkDrop);

    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.removeEventListener("mouseleave", hide);
      document.documentElement.removeEventListener("mouseenter", show);
      window.removeEventListener("click", inkDrop);
    };
  }, []);

  return (
    <div
      ref={penRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 99999,
        opacity: 0,
        willChange: "transform",
        transition: "opacity 0.25s",
      }}
    >
      <svg
        width="52"
        height="52"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g transform="rotate(45, 18, 18)">
          {/* Pen body */}
          <rect x="15.5" y="5" width="5" height="17" rx="1.5" fill="#0D1727" />
          {/* Top cap */}
          <rect x="14.5" y="3.5" width="7" height="6" rx="2" fill="#152034" />
          {/* Cap highlight line */}
          <rect x="17" y="4.5" width="1" height="4" rx="0.5" fill="rgba(255,255,255,0.12)" />
          {/* Body side sheen */}
          <rect x="17" y="6.5" width="1" height="13" rx="0.5" fill="rgba(255,255,255,0.05)" />
          {/* Grip section – darker ring */}
          <rect x="15.5" y="19" width="5" height="2.5" rx="0.8" fill="#07101C" />
          {/* Nib – tapered triangle */}
          <path d="M15.5 21.5 L20.5 21.5 L18 29.5 Z" fill="#00C8FF" />
          {/* Nib center split line */}
          <line
            x1="18" y1="21.5" x2="18" y2="28.5"
            stroke="rgba(0,90,140,0.55)"
            strokeWidth="0.6"
          />
          {/* Nib tip glow */}
          <circle cx="18" cy="28.8" r="1.4" fill="rgba(0,200,255,0.95)" />
          <circle cx="18" cy="28.8" r="3.2" fill="rgba(0,200,255,0.18)" />
          <circle cx="18" cy="28.8" r="5.5" fill="rgba(0,200,255,0.07)" />
        </g>
      </svg>
    </div>
  );
}

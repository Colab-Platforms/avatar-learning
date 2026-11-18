"use client";

import { useEffect, useRef, useState } from "react";

// Width/height of the pill itself (roughly) — used to test it against other
// on-page CTAs sharing the same bottom-right corner of the viewport, so it
// never ends up floating on top of a real button (e.g. a section's own
// "#contact" link or a form's submit button).
const PILL_W = 300;
const PILL_H = 64;
const MARGIN = 20;

export function StickyCta() {
  const [visible, setVisible] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = document.getElementById("top");
    const onScroll = () => {
      if (!hero) return;
      const pastHero = hero.getBoundingClientRect().bottom < 0;
      if (!pastHero) {
        setVisible(false);
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const zoneLeft = vw - MARGIN - PILL_W;
      const zoneTop = vh - MARGIN - PILL_H;

      const candidates = document.querySelectorAll<HTMLElement>(
        '#contact, a[href="#contact"], button[type="submit"], [data-avoid-sticky]',
      );
      let collides = false;
      for (const el of candidates) {
        if (pillRef.current?.contains(el)) continue;
        const r = el.getBoundingClientRect();
        if (r.right > zoneLeft && r.left < vw && r.bottom > zoneTop && r.top < vh) {
          collides = true;
          break;
        }
      }
      setVisible(!collides);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    const id = setInterval(onScroll, 500);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearInterval(id);
    };
  }, []);

  return (
    <div
      ref={pillRef}
      style={{
        position: "fixed",
        right: MARGIN,
        bottom: MARGIN,
        zIndex: 40,
        transform: visible ? "translateY(0)" : "translateY(140%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "transform .5s cubic-bezier(.2,.7,.1,1), opacity .4s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 10px 10px 18px",
          borderRadius: 999,
          background: "rgba(12,14,19,.92)",
          border: "1px solid rgba(255,255,255,.12)",
          boxShadow: "0 20px 50px rgba(0,0,0,.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            flex: "none",
            alignItems: "center",
            height: 44,
            padding: "0 18px",
            borderRadius: 999,
            background: "#000000",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
          className="hidden sm:flex"
        >
          Start your AI journey
        </span>
        <a
          href="#contact"
          style={{ flex: "none", display: "flex", alignItems: "center", height: 44, padding: "0 18px", borderRadius: 999, background: "#f4f6f8", color: "#07080b", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}
        >
          Book a call
        </a>
      </div>
    </div>
  );
}

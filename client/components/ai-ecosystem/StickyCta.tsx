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

  // Visibility is driven by IntersectionObservers only (no scroll listeners):
  //  • hidden until the hero has scrolled away;
  //  • hidden while anything it must not cover — the footer, the contact
  //    section, other "#contact" buttons, submit buttons, [data-avoid-sticky] —
  //    is inside the bottom-right zone the pill occupies. The footer counts as
  //    soon as its top edge enters that zone, so the pill is gone before it can
  //    sit on the footer's links, copyright or legal links.
  useEffect(() => {
    const hero = document.getElementById("top");
    let pastHero = false;
    const inZone = new Set<Element>();
    const update = () => setVisible(pastHero && inZone.size === 0); // same value → no re-render

    const heroIo = hero
      ? new IntersectionObserver(([e]) => {
          pastHero = !e.isIntersecting && e.boundingClientRect.bottom < 0;
          update();
        })
      : null;
    if (hero) heroIo!.observe(hero);

    let zoneIo: IntersectionObserver | null = null;
    const watchZone = () => {
      zoneIo?.disconnect();
      inZone.clear();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Shrink the observer's root to the pill's corner (plus a little slack).
      const top = Math.max(0, vh - MARGIN - PILL_H - 16);
      const left = Math.max(0, vw - MARGIN - PILL_W);
      zoneIo = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) inZone.add(e.target);
            else inZone.delete(e.target);
          }
          update();
        },
        { rootMargin: `-${top}px 0px 0px -${left}px` },
      );
      document
        .querySelectorAll<HTMLElement>('footer, #contact, a[href="#contact"], button[type="submit"], [data-avoid-sticky]')
        .forEach((el) => {
          if (!pillRef.current?.contains(el)) zoneIo!.observe(el);
        });
    };
    watchZone();
    // The zone is in pixels, so rebuild it when the viewport size changes.
    let t = 0;
    const onResize = () => {
      clearTimeout(t);
      t = window.setTimeout(watchZone, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      heroIo?.disconnect();
      zoneIo?.disconnect();
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
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
        transition: "transform .25s ease, opacity .25s ease",
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

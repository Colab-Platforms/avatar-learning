"use client";

import { useEffect } from "react";
import s from "./learnAdopt.module.css";

/**
 * Drives the scroll reveals: marks [data-reveal] elements with [data-in]
 * as they enter the viewport. Content stays visible until this runs.
 * Runs regardless of the OS reduced-motion setting (by request).
 */
export function RevealController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`.${s.page}`);
    if (!root || !("IntersectionObserver" in window)) return;

    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    // Anything already on screen is shown straight away so it never blinks out.
    const vh = window.innerHeight;
    for (const el of targets) {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.setAttribute("data-in", "");
    }
    root.classList.add(s.motionReady);

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.setAttribute("data-in", "");
          // Replay only when it leaves below the fold (i.e. the user scrolled
          // back up past it), so it re-enters from the direction it moves.
          else if (e.boundingClientRect.top > 0) e.target.removeAttribute("data-in");
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    targets.forEach((t) => io.observe(t));

    // Subtle parallax: [data-parallax="speed"] elements shift with scroll
    // relative to the viewport centre. Uses `translate`, so it composes with
    // the transform-based reveal animations.
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax]")).map((el) => ({
      el,
      speed: Number(el.dataset.parallax) || 0,
    }));
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      for (const { el, speed } of layers) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
        const offset = r.top + r.height / 2 - mid;
        el.style.translate = `0 ${(offset * speed).toFixed(1)}px`;
      }
    };
    // At the very bottom of the page, content in the last few pixels can
    // never cross the trigger line (the footer on phones), so show it.
    const revealRest = () => {
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight < doc.scrollHeight - 2) return;
      for (const el of targets) el.setAttribute("data-in", "");
    };
    const onScroll = () => {
      revealRest();
      if (layers.length && !raf) raf = requestAnimationFrame(update);
    };
    if (layers.length) update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      root.classList.remove(s.motionReady);
    };
  }, []);

  return null;
}

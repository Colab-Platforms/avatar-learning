"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { LA_WHY } from "./data";
import { ArrowRight } from "./icons";
import { rv } from "./motion";
import s from "./learnAdopt.module.css";

const INTERVAL = 3500; // ms between steps
const RESUME_AFTER_TOUCH = 3000; // ms
const SWIPE_MIN = 40; // px

/**
 * Why Avatar: an infinite carousel that steps exactly one card at a time
 * with a smooth eased slide, right to left.
 *
 * The track is moved with a GPU transform (sub-pixel smooth). The cards are
 * rendered twice; after stepping into the copy, the track silently jumps
 * back by one full set — identical content, so the loop has no visible
 * reset. The copy is aria-hidden and inert.
 *
 * Auto-advances on a timer; pauses on hover, keyboard focus, touch, when
 * off-screen or the tab is hidden. Swipe left/right on touch screens, or use
 * the arrow buttons (which restart the timer).
 */
export function WhyCards() {
  const count = LA_WHY.items.length;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [step, setStep] = useState(0);
  const [drag, setDrag] = useState(0);
  const [kick, setKick] = useState(0); // bumping it restarts the auto-advance timer
  const hold = useRef({ hover: false, focus: false, touchUntil: 0 });
  const indexRef = useRef(0);
  indexRef.current = index;
  const pending = useRef<number | null>(null); // target to slide to after an invisible jump
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);

  // Measure the distance between two neighbouring cards (card + gap).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => {
      const a = el.children[0] as HTMLElement | undefined;
      const b = el.children[1] as HTMLElement | undefined;
      if (a && b) setStep(b.offsetLeft - a.offsetLeft);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // The loop copy must be fully non-interactive (React 18 drops "inert").
    Array.from(el.children)
      .slice(count)
      .forEach((c) => c.setAttribute("inert", ""));
    return () => ro.disconnect();
  }, [count]);

  const next = useCallback(() => {
    setAnimate(true);
    setIndex((i) => i + 1);
  }, []);

  const prev = useCallback(() => {
    if (indexRef.current > 0) {
      setAnimate(true);
      setIndex((i) => i - 1);
      return;
    }
    // At the start: jump invisibly to the same cards in the copy, then slide
    // back one card once the jump has painted.
    pending.current = count - 1;
    setAnimate(false);
    setIndex(count);
  }, [count]);

  // After sliding into the copy, snap back by one set without animating.
  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return; // ignore card hover transitions
    if (index >= count) {
      setAnimate(false);
      setIndex((i) => i - count);
    }
  };
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        if (pending.current !== null) {
          setIndex(pending.current);
          pending.current = null;
        }
      }),
    );
    return () => cancelAnimationFrame(id);
  }, [animate]);

  // Auto-advance.
  useEffect(() => {
    const id = window.setInterval(() => {
      const el = track.current;
      const h = hold.current;
      if (!el || h.hover || h.focus || performance.now() < h.touchUntil || document.hidden) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      next();
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [next, kick]);

  // Touch swipe (vertical page scrolling stays native via touch-action).
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null };
    hold.current.touchUntil = performance.now() + 60_000;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const st = touch.current;
    if (!st) return;
    const t = e.touches[0];
    const dx = t.clientX - st.x;
    const dy = t.clientY - st.y;
    if (st.horizontal === null && Math.abs(dx) + Math.abs(dy) > 8) st.horizontal = Math.abs(dx) > Math.abs(dy);
    if (st.horizontal) {
      setAnimate(false);
      setDrag(dx);
    }
  };
  const onTouchEnd = () => {
    const st = touch.current;
    touch.current = null;
    hold.current.touchUntil = performance.now() + RESUME_AFTER_TOUCH;
    if (!st?.horizontal) return;
    const dx = drag;
    setDrag(0);
    setAnimate(true);
    if (dx <= -SWIPE_MIN) next();
    else if (dx >= SWIPE_MIN) prev();
  };

  const style = {
    transform: `translate3d(${-index * step + drag}px, 0, 0)`,
    transition: animate ? undefined : "none",
  } as CSSProperties;

  return (
    <div
      className={s.carousel}
      {...rv(1)}
      // Mouse only: touch browsers fire mouseenter on tap but never mouseleave.
      onPointerEnter={(e) => e.pointerType === "mouse" && (hold.current.hover = true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && (hold.current.hover = false)}
    >
      <div className={s.wViewport} role="region" aria-label="Why Avatar">
        <div
          ref={track}
          className={s.wTrack}
          style={style}
          onTransitionEnd={onTransitionEnd}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          {[0, 1].flatMap((set) =>
            LA_WHY.items.map((w, i) => {
              const clone = set === 1;
              return (
                <div key={`${set}-${w.title}`} className={s.cSlide} aria-hidden={clone || undefined}>
                  <article
                    className={`${s.glass} ${s.why} ${s.glowCard}`}
                    tabIndex={clone ? -1 : 0}
                    onFocus={() => {
                      hold.current.focus = true;
                      if (!clone) {
                        setAnimate(true);
                        setIndex(i);
                      }
                    }}
                    onBlur={() => (hold.current.focus = false)}
                  >
                    <span className={s.cardNumText}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className={s.h3}>{w.title}</h3>
                    {w.body.map((p) => (
                      <p key={p} className={s.body}>
                        {p}
                      </p>
                    ))}
                  </article>
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className={s.wControls}>
        <button
          type="button"
          className={`${s.wArrow} ${s.wArrowPrev}`}
          aria-label="Previous card"
          onClick={() => {
            prev();
            setKick((k) => k + 1);
          }}
        >
          <ArrowRight className={s.arrow} />
        </button>
        <button
          type="button"
          className={s.wArrow}
          aria-label="Next card"
          onClick={() => {
            next();
            setKick((k) => k + 1);
          }}
        >
          <ArrowRight className={s.arrow} />
        </button>
      </div>
    </div>
  );
}

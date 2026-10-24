"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { COURSES } from "@/data/courses";
import { LA_LEARNING_PANEL, LA_PILLARS, LA_SOON_PANELS, type PillarId } from "./data";
import { ArrowRight, Check, Star } from "./icons";
import s from "./learnAdopt.module.css";

function Panel({
  eyebrow,
  title,
  body,
  points,
  cta,
}: {
  eyebrow: string;
  title: readonly string[];
  body: string;
  points: readonly string[];
  cta: { label: string; href: string };
}) {
  return (
    <div className={s.pillarCopy}>
      <span className={s.statusChip}>{eyebrow}</span>
      <h3 className={s.pillarTitle}>
        {title[0]}
        <br />
        {title[1]}
      </h3>
      <p className={s.body}>{body}</p>
      <ul className={`${s.points} ${s.pointsSm}`}>
        {points.map((p) => (
          <li key={p}>
            <Check className={s.check} />
            {p}
          </li>
        ))}
      </ul>
      <Link href={cta.href} className={s.btnPrimary}>
        {cta.label}
        <ArrowRight className={s.arrow} />
      </Link>
    </div>
  );
}

const CYCLE_MS = 1500;

/**
 * Four pillars with auto-rotation. The active tab's progress bar is the
 * timer: when its CSS fill animation ends, the next tab activates. Pausing
 * (hover, keyboard focus, off-screen, hidden tab) just pauses that
 * animation, so rotation resumes exactly where it left off. Clicking a tab
 * activates it and restarts its bar.
 */
export function PillarTabs() {
  const [active, setActive] = useState<PillarId>("learning");
  const [run, setRun] = useState(0); // bumps to restart the progress bar
  const [hover, setHover] = useState(false);
  const [kbFocus, setKbFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Start only once the section is on screen; pause while it's off screen.
  useEffect(() => {
    const el = root.current;
    if (!el || !("IntersectionObserver" in window)) return setVisible(true);
    // Any part on screen is enough to start rotating.
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    const onVis = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const paused = hover || kbFocus || !visible || pageHidden;

  const select = (id: PillarId) => {
    setActive(id);
    setRun((r) => r + 1);
  };
  const advance = () => {
    const i = LA_PILLARS.findIndex((p) => p.id === active);
    select(LA_PILLARS[(i + 1) % LA_PILLARS.length].id);
  };

  return (
    <div
      ref={root}
      className={s.pillars}
      // Pointer events with a mouse check: touch browsers fire mouseenter on
      // tap but never mouseleave, which used to pause rotation forever on mobile.
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onFocus={(e) => setKbFocus(e.target.matches(":focus-visible"))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setKbFocus(false);
      }}
    >
      <div className={s.pillarList} role="tablist" aria-label="Avatar pillars">
        {LA_PILLARS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`pillar-tab-${p.id}`}
            aria-selected={active === p.id}
            aria-controls="pillar-panel"
            className={s.pillarTab}
            onClick={() => select(p.id)}
          >
            <span className={s.pillarNum}>{p.num}</span>
            <span className={s.pillarText}>
              <strong>{p.title}</strong>
              <span>{p.sub}</span>
            </span>
            <span className={p.status === "live" ? s.badgeLive : s.badgeSoon}>
              {p.status === "live" ? "Live" : "Soon"}
            </span>
            {active === p.id && (
              <span
                key={run}
                className={s.pillarProgress}
                aria-hidden="true"
                style={{ "--cycle": `${CYCLE_MS}ms`, animationPlayState: paused ? "paused" : "running" } as CSSProperties}
                onAnimationEnd={advance}
              />
            )}
          </button>
        ))}
      </div>

      <div
        className={`${s.glass} ${s.pillarPanel}`}
        role="tabpanel"
        id="pillar-panel"
        aria-labelledby={`pillar-tab-${active}`}
      >
        {active === "learning" ? (
          <>
            <Panel key="learning-copy" {...LA_LEARNING_PANEL} />
            <div key="learning-courses" className={s.courses}>
              <span className={s.coursesLabel}>Courses inside Direct2Hire</span>
              {COURSES.slice(0, 3).map((c) => (
                <Link key={c.id} href="/direct2hire" className={s.courseRow}>
                  <span className={s.courseThumb} aria-hidden="true" />
                  <span className={s.courseText}>
                    <strong>{c.title}</strong>
                    <span>
                      {c.weeks} Weeks Specialization · {c.level}
                    </span>
                  </span>
                  <span className={s.rating}>
                    {c.rating}
                    <Star className={s.star} />
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <Panel key={active} eyebrow="Coming soon" {...LA_SOON_PANELS[active]} />
        )}
      </div>
    </div>
  );
}

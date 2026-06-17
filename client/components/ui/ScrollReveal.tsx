"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type RevealAnimation =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "zoom-out"
  | "fade-in"
  | "slide-up";

interface ScrollRevealProps {
  children: ReactNode;
  animation?: RevealAnimation;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  style?: CSSProperties;
  once?: boolean;
  distance?: number;
}

const getInitial = (animation: RevealAnimation, distance: number): CSSProperties => ({
  "fade-up":    { opacity: 0, transform: `translateY(${distance}px)` },
  "fade-down":  { opacity: 0, transform: `translateY(-${distance}px)` },
  "fade-left":  { opacity: 0, transform: `translateX(${distance}px)` },
  "fade-right": { opacity: 0, transform: `translateX(-${distance}px)` },
  "zoom-in":    { opacity: 0, transform: "scale(0.90)" },
  "zoom-out":   { opacity: 0, transform: "scale(1.08)" },
  "fade-in":    { opacity: 0 },
  "slide-up":   { opacity: 0, transform: `translateY(${distance * 0.6}px)`, filter: "blur(4px)" },
}[animation]);

const VISIBLE: CSSProperties = { opacity: 1, transform: "none", filter: "none" };

export function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 700,
  threshold = 0.1,
  className,
  style,
  once = true,
  distance = 40,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const initial = getInitial(animation, distance);
    const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
    const transitionProps = Object.keys(initial)
      .filter((k) => k !== "opacity" || true)
      .map((k) => {
        if (k === "opacity") return `opacity ${duration}ms ${easing} ${delay}ms`;
        if (k === "transform") return `transform ${duration}ms ${easing} ${delay}ms`;
        if (k === "filter") return `filter ${duration * 0.8}ms ${easing} ${delay}ms`;
        return `${k} ${duration}ms ${easing} ${delay}ms`;
      });

    Object.assign(el.style, initial, {
      transition: [
        `opacity ${duration}ms ${easing} ${delay}ms`,
        `transform ${duration}ms ${easing} ${delay}ms`,
        animation === "slide-up" ? `filter ${Math.round(duration * 0.8)}ms ${easing} ${delay}ms` : "",
      ].filter(Boolean).join(", "),
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            Object.assign(el.style, VISIBLE);
            if (once) observer.unobserve(el);
          } else if (!once) {
            Object.assign(el.style, initial);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className={cn(className)} style={style}>
      {children}
    </div>
  );
}

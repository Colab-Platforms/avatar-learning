"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimateOnScroll } from "@/components/ui";
import { FileText, CheckCircle, BookOpen, Award, TrendingUp, Shield, ArrowRight } from "lucide-react";

interface TimelineStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: 1,
    title: "Apply for the Internship",
    description: "Register and secure your spot",
    icon: <FileText className="h-6 w-6" />,
  },
  {
    id: 2,
    title: "Verification & Offer",
    description: "Application review and official letter",
    icon: <CheckCircle className="h-6 w-6" />,
  },
  {
    id: 3,
    title: "8-Week Learning",
    description: "Structured training with hands-on learning",
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    id: 4,
    title: "Earn Your Certificate",
    description: "Successfully complete and get certified",
    icon: <Award className="h-6 w-6" />,
  },
  {
    id: 5,
    title: "Final Assessment",
    description: "Demonstrate skills through evaluation",
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    id: 6,
    title: "Project Submission & Validation",
    description: "Submit projects and verify outcomes",
    icon: <Shield className="h-6 w-6" />,
  },
];

const STEP_COUNT = TIMELINE_STEPS.length;

/**
 * The student image rides the leading edge of the progress line.
 * It walks (subtle bob + tilt) while in transit, then settles flat
 * with a small scale-pop once the line reaches 100%.
 */
function StudentRider({ completed }: { completed: boolean }) {
  return (
    <div
      className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20"
      style={{
        animation: completed
          ? "student-land 0.5s cubic-bezier(0.34,1.56,0.64,1) both"
          : "student-bob 0.6s ease-in-out infinite",
      }}
    >
      <Image
        src="/landingpage-images/student.png"
        alt="Student progressing through the internship timeline"
        fill
        sizes="(max-width: 640px) 48px, (max-width: 768px) 64px, 80px"
        className="object-contain select-none pointer-events-none"
        priority={false}
      />
    </div>
  );
}

export function TimelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setActiveCount(STEP_COUNT);
      setCompleted(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;

        // Progress 0 -> 1 as the timeline travels through the viewport.
        // Starts charging once the top enters the lower half of the screen,
        // finishes once the bottom clears the upper third.
        const start = viewportH * 0.85;
        const end = viewportH * 0.25;
        const total = rect.top - end;
        const span = start - end;
        const raw = 1 - total / span;
        const progress = Math.min(1, Math.max(0, raw));

        const nextActive = Math.round(progress * STEP_COUNT);
        setActiveCount((prev) => (prev === nextActive ? prev : nextActive));
        if (nextActive >= STEP_COUNT) setCompleted(true);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  const fillPercent =
    STEP_COUNT > 0 ? (Math.max(0, activeCount - 0.5) / (STEP_COUNT - 1)) * 100 : 0;
  const clampedFill = Math.min(100, Math.max(0, fillPercent));

  return (
    <section className="relative bg-ink-950 overflow-hidden py-12 sm:py-16 md:py-24 lg:py-32">
      {/* Top divider line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-brand-500/30 to-transparent" />

      {/* Local keyframes for the student rider — bobbing while walking, a settle-pop on landing */}
      <style jsx>{`
        @keyframes student-bob {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes student-land {
          0% { transform: scale(0.85) translateY(-6px); }
          60% { transform: scale(1.12) translateY(2px); }
          100% { transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,200,255,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="absolute inset-0 line-grid opacity-10 pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Header */}
        <AnimateOnScroll className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
          <p className="eyebrow eyebrow-dark mb-3 sm:mb-4 inline-block text-xs sm:text-sm">
            ✓ GUARANTEED INTERNSHIPS
          </p>
          <h2 className="h-display text-white mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
            Top Performers Get{" "}
            <span className="text-gradient-brand">Real Internships.</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto leading-[1.6] sm:leading-[1.8]">
            Complete any of our paid programs with strong performance and get a
            chance to work on live projects with our partner companies. Real
            experience. Real outcomes.
          </p>
        </AnimateOnScroll>

        {/* Timeline Container */}
        <div ref={containerRef} className="relative">
          {/* Desktop connecting line — track + animated fill */}
          <div className="hidden lg:block absolute top-12 left-[8.33%] right-[8.33%] h-0.5 z-0">
            <div className="absolute inset-0 bg-white/10 rounded-full" />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 shadow-[0_0_12px_rgba(0,200,255,0.6)]"
              style={{
                width: `${clampedFill}%`,
                transition: reduceMotion
                  ? "none"
                  : "width 0.4s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            {/* Student image riding the leading edge of the fill — only hidden at 0% or 100% */}
            {!reduceMotion && clampedFill > 0 && clampedFill < 100 && (
              <div
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  left: `${clampedFill}%`,
                  transform: "translate(-50%, -50%)",
                  transition: "left 0.4s cubic-bezier(0.22,1,0.36,1)",
                  filter: "drop-shadow(0 0 10px rgba(0,200,255,0.45))",
                }}
              >
                <StudentRider completed={completed} />
              </div>
            )}
          </div>

          {/* Mobile/tablet connecting line — vertical track + fill (phones + tablets, hidden on lg+) */}
          <div className="lg:hidden absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 z-0">
            <div className="absolute inset-0 bg-white/10 rounded-full" />
            <div
              className="absolute inset-x-0 top-0 rounded-full bg-gradient-to-b from-brand-600 via-brand-500 to-brand-400"
              style={{
                height: `${clampedFill}%`,
                transition: reduceMotion
                  ? "none"
                  : "height 0.4s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            {/* Student image riding the vertical track — only hidden at 0% or 100% */}
            {!reduceMotion && clampedFill > 0 && clampedFill < 100 && (
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: `${clampedFill}%`,
                  transform: "translate(-50%, -50%)",
                  transition: "top 0.4s cubic-bezier(0.22,1,0.36,1)",
                  filter: "drop-shadow(0 0 10px rgba(0,200,255,0.45))",
                }}
              >
                <StudentRider completed={completed} />
              </div>
            )}
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-8 lg:grid-cols-6 lg:gap-4 relative z-10">
            {TIMELINE_STEPS.map((step, index) => {
              const isActive = reduceMotion || activeCount > index;
              const isLast = index === STEP_COUNT - 1;
              const justCompleted = isLast && isActive && completed;

              return (
                <AnimateOnScroll key={step.id} delay={index * 100}>
                  {/* Mobile/Tablet vertical line between steps */}
                  {index > 0 && (
                    <div
                      className="absolute -top-4 left-1/2 w-0.5 h-4 lg:hidden transform -translate-x-1/2 transition-colors duration-500"
                      style={{
                        background: isActive
                          ? "linear-gradient(to bottom, rgba(0,200,255,0.8), rgba(0,200,255,0.2))"
                          : "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)",
                      }}
                    />
                  )}

                  <div className="flex flex-col items-center text-center group">
                    {/* Icon Circle */}
                    <div className="relative mb-4 sm:mb-6 flex items-center justify-center">
                      {/* Completion burst ring — fires once on the final step */}
                      {justCompleted && (
                        <span
                          className="absolute inset-0 rounded-full border-2 border-brand-400 pointer-events-none"
                          style={{ animation: "pulse-ring 1.1s ease-out 1" }}
                        />
                      )}

                      {/* Ambient glow — only once active */}
                      <div
                        className="absolute inset-0 rounded-full scale-110 transition-all duration-500"
                        style={{
                          background: isActive
                            ? "rgba(0,200,255,0.22)"
                            : "rgba(0,200,255,0.06)",
                        }}
                      />

                      {/* Icon container */}
                      <div
                        className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-500 ease-out"
                        style={{
                          border: isActive
                            ? "1px solid rgba(0,200,255,0.9)"
                            : "1px solid rgba(0,200,255,0.25)",
                          background: isActive ? "#00C8FF" : "#080F1C",
                          color: isActive ? "#050B14" : "rgba(0,200,255,0.45)",
                          boxShadow: isActive
                            ? "0 0 22px rgba(0,200,255,0.55)"
                            : "none",
                          transform: isActive ? "scale(1)" : "scale(0.92)",
                        }}
                      >
                        {step.icon}

                        {/* Step number badge */}
                        <div
                          className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-500"
                          style={{
                            background: isActive ? "#00C8FF" : "#152034",
                            color: isActive ? "#050B14" : "rgba(255,255,255,0.5)",
                            boxShadow: isActive
                              ? "0 0 10px rgba(0,200,255,0.7)"
                              : "none",
                            transform: isActive ? "scale(1)" : "scale(0.85)",
                          }}
                        >
                          {isActive && !reduceMotion ? (
                            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />
                          ) : (
                            step.id
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step content */}
                    <div className="flex-1 min-h-0">
                      <h3
                        className="font-semibold text-xs sm:text-sm md:text-base mb-1.5 sm:mb-2 transition-colors duration-500"
                        style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)" }}
                      >
                        {step.title}
                      </h3>
                      <p
                        className="text-xs leading-normal sm:leading-relaxed transition-colors duration-500"
                        style={{ color: isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.3)" }}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <AnimateOnScroll delay={600} className="flex justify-center mt-10 sm:mt-12 md:mt-16 lg:mt-20">
          <a href="/courses"
            className={`relative px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-3.5 rounded-lg bg-brand-500 text-ink-950 font-semibold text-xs sm:text-sm md:text-base
            hover:bg-brand-400 transition-all duration-300 group
            shadow-lg hover:shadow-xl hover:shadow-brand-500/30
            hover:scale-105 ${completed && !reduceMotion ? "btn-glow" : ""}`}
          >
            <span className="flex items-center gap-2">
              Explore Programs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-250" />
            </span>
          </a>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
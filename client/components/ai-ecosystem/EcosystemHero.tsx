"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";

const GridScan = dynamic(() => import("./GridScan").then((m) => m.GridScan), {
  ssr: false,
});

export function EcosystemHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Cinematic hero-to-page transition as the user scrolls past the hero —
  // disabled entirely when reduced motion is requested.
  const textY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, -30]);
  // Opacity fades are written straight to the DOM from the scroll listener below:
  // MotionValue-bound `opacity` never reached the element here, while `y` did.
  // The background fades (no scale/shift) so its edges never read as a card.
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [pastIndicatorThreshold, setPastIndicatorThreshold] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setPastIndicatorThreshold(window.scrollY > 60);
      const section = sectionRef.current;
      if (!section || prefersReducedMotion) return;
      // Smoothstep over ~90% of the hero: stays strong at the top, then fades
      // slowly and evenly, easing out again as it disappears.
      const p = Math.min(Math.max(window.scrollY / (section.offsetHeight * 0.9), 0), 1);
      const eased = p * p * (3 - 2 * p);
      if (bgRef.current) bgRef.current.style.opacity = String(1 - eased);
      if (textRef.current) textRef.current.style.opacity = String(1 - eased);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-14"
    >
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-40 left-1/2 h-[640px] w-[900px] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(124,58,237,0.22) 0%, transparent 60%)",
            filter: "blur(30px)",
          }}
        />
        <div
          className="absolute top-10 right-0 h-[420px] w-[500px]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(37,99,235,0.20) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      <style jsx>{`
        .aie-headline-gradient {
          animation: aie-headline-gradient-shift 8s ease-in-out infinite;
        }
        @keyframes aie-headline-gradient-shift {
          0%,
          100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }
      `}</style>

      {/* GridScan — supplied WebGL background component, used as-is, full-bleed behind the hero content.
          Not pointer-events-none: it tracks the cursor for its perspective tilt. The text block
          below is pointer-events-none (buttons opt back in) so the cursor reaches it. */}
      <div ref={bgRef} className="absolute inset-0 transition-opacity duration-300 ease-out" aria-hidden>
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#2F293A"
          gridScale={0.1}
          scanColor="#FF9FFC"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
          lineJitter={0.1}
          scanGlow={0.5}
          scanSoftness={2}
          enableWebcam={false}
          showPreview={false}
        />
      </div>

      {/* fades the GridScan background into the next section's flat
          background color, so the hero blends into the page instead of
          reading as a separate card with a hard bottom edge */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,5,10,0) 0%, rgba(5,5,10,0.35) 35%, rgba(5,5,10,0.8) 70%, #05050a 100%)",
        }}
        aria-hidden
      />

      {/* hero content — centered foreground layer */}
      <motion.div
        ref={textRef}
        className="pointer-events-none relative z-10 mx-auto w-full max-w-4xl px-5 text-center transition-opacity duration-300 ease-out sm:px-8"
        style={{ y: textY }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-[32px] font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-[52px]"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          The AI Adaption Ecosystem for
          <br />
          <span
            className="aie-headline-gradient bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #C4B5FD 0%, #93C5FD 25%, #C4B5FD 50%, #93C5FD 75%, #C4B5FD 100%)",
              backgroundSize: "300% auto",
            }}
          >
            Modern Business.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-lg text-[17px] font-normal leading-relaxed text-white/90 sm:text-[19px]"
        >
          AI-powered solutions to manage, automate and scale your business.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-col items-center gap-3.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
        >
          <a
            href="#book-demo"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new Event("aie:open-book-demo"));
            }}
            className="pointer-events-auto group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full px-9 py-4.5 text-[16px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:!shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_20px_50px_-8px_rgba(124,58,237,0.8)] sm:w-auto"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.08), 0 16px 40px -8px rgba(124,58,237,0.6)",
            }}
          >
            <span className="relative z-10">Book a Demo</span>
            <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          </a>

          <a
            href="#pricing"
            className="pointer-events-auto inline-flex w-full items-center justify-center rounded-lg border border-white/25 bg-transparent px-9 py-4.5 text-[16px] font-semibold text-white/85 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:text-white hover:shadow-[0_0_24px_rgba(255,255,255,0.12)] sm:w-auto"
          >
            Know Our Plans
          </a>
        </motion.div>
      </motion.div>

      {/* minimal scroll indicator — bounces gently until the user starts scrolling */}
      <div
        className={`pointer-events-none absolute bottom-7 left-1/2 z-10 -translate-x-1/2 transition-opacity duration-300 ${
          pastIndicatorThreshold ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5 text-white/40" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

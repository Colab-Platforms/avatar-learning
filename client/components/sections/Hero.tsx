"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Star,
  TrendingUp,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button, Badge, CountUp, HeroParticles } from "@/components/ui";
// import { HERO_SLIDES } from "@/data/hero";
import { DBCourse, fetchHeroCourses } from "@/lib/coursesApi";
import { HeroCardSkeleton } from "../ui/HeroCardSkeleton";
import { AnimatePresence, motion } from "framer-motion";

const SLIDE_DURATION = 4000;

const STATS = [
  { icon: Users, value: "10,000+", label: "Students enrolled" },
  { icon: Star, value: "4.9", label: "Average rating" },
  { icon: TrendingUp, value: "95%", label: "Completion rate" },
];

const TICKER_ITEMS = [
  "AI Fundamentals",
  "Prompt Engineering",
  "LangChain & Agents",
  "Computer Vision",
  "GPT-4 API",
  "Midjourney",
  "AutoGPT",
  "Fine-tuning LLMs",
];

export function Hero() {
  // const slide = HERO_SLIDES[0];
  const [courses, setCourses] = useState<DBCourse[]>([]);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vid1Ref = useRef<HTMLVideoElement>(null);
  const vid2Ref = useRef<HTMLVideoElement>(null);
  const course = courses[activeIdx] ?? null;

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchHeroCourses();
        console.log("Hero:", data);

        setCourses(data);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  //2nd time
  // useEffect(() => {
  //   if (courses.length <= 1) return;

  //   timerRef.current = setTimeout(() => {
  //     setActiveIdx((i) => (i + 1) % courses.length);
  //   }, SLIDE_DURATION);

  //   return () => {
  //     if (timerRef.current) clearTimeout(timerRef.current);
  //   };
  // }, [activeIdx, courses.length]);

  // useEffect(() => {
  //   const activeVid = activeIdx % 2 === 0 ? vid1Ref.current : vid2Ref.current;

  //   if (activeVid) {
  //     activeVid.currentTime = 0;
  //     activeVid.play().catch(() => {});
  //   }

  //   if (courses.length <= 1) return;

  //   timerRef.current = setTimeout(() => {
  //     setActiveIdx((i) => (i + 1) % courses.length);
  //   }, SLIDE_DURATION);

  //   return () => {
  //     if (timerRef.current) clearTimeout(timerRef.current);
  //   };
  // }, [activeIdx, courses.length]);

  useEffect(() => {
    if (courses.length <= 1) return;

    // Determine which video belongs to the current index
    // Even indices play Video 1, Odd indices play Video 2
    const currentVid = activeIdx % 2 === 0 ? vid1Ref.current : vid2Ref.current;
    const nextVid = activeIdx % 2 === 0 ? vid2Ref.current : vid1Ref.current;

    // Fast-start current video
    if (currentVid) {
      currentVid.currentTime = 0;
      currentVid.play().catch(() => {});
    }

    // Pre-buffer the hidden video so it's instantly warm for the next transition
    if (nextVid) {
      nextVid.play().catch(() => {});
    }

    // Standard auto slide timer
    timerRef.current = setTimeout(() => {
      setDirection(1);
      setActiveIdx((i) => (i + 1) % courses.length);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIdx, courses.length]);

  // useEffect(() => {
  //   const activeVid = activeIdx % 2 === 0 ? vid1Ref.current : vid2Ref.current;

  //   activeVid?.play().catch(() => {});
  // }, [activeIdx]);

  // useEffect(() => {
  //   if (courses.length <= 1) return;

  //   const id = setInterval(() => {
  //     setActiveIdx((i) => (i + 1) % courses.length);
  //   }, SLIDE_DURATION);

  //   return () => clearInterval(id);
  // }, [courses.length]);

  //Button for changing the slides in hero card of courses
  const nextSlide = () => {
    if (courses.length <= 1) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setDirection(1);
    setActiveIdx((prev) => (prev + 1) % courses.length);
  };

  const prevSlide = () => {
    if (courses.length <= 1) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setDirection(-1);
    setActiveIdx((prev) => (prev - 1 + courses.length) % courses.length);
  };

  // Helper variables to determine visibility regardless of 3-item constraints
  const isVid1Active = activeIdx % 2 === 0;
  const isVid2Active = activeIdx % 2 !== 0;

  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-white min-h-screen flex flex-col">
      {/* ── Video 1: full background, plays for 4 s then fades out ── */}
      <video
        ref={vid1Ref}
        autoPlay
        muted
        playsInline
        loop
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover video-pos transition-opacity duration-1000"
        // style={{ opacity: activeIdx === 0 ? 0.8 : 0 }}
        style={{ opacity: isVid1Active ? 0.8 : 0 }}
      >
        <source src="/landing-vid/robot-vid.mp4" type="video/mp4" />
      </video>

      {/* ── Video 2: avatar — full-width on mobile, right-half on md+ ── */}
      <video
        ref={vid2Ref}
        autoPlay
        muted
        playsInline
        loop
        aria-hidden="true"
        className="absolute inset-0 md:left-auto md:right-0 h-full w-full md:w-1/2 object-cover object-center transition-opacity duration-1000"
        style={{
          // opacity: activeIdx === 1 ? 0.85 : 0,
          opacity: isVid2Active ? 0.85 : 0,
          maskImage: "linear-gradient(to right, transparent 0%, black 20%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 20%)",
        }}
      >
        <source src="/landing-vid/avatar_video.mp4" type="video/mp4" />
      </video>

      {/* ── Gradient overlays ── */}
      <div className="absolute inset-0 bg-linear-to-r from-ink-950 via-ink-950/75 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-ink-950/95 via-transparent to-transparent" />
      <div className="absolute top-0 inset-x-0 h-40 bg-linear-to-b from-ink-950/70 to-transparent" />

      {/* ── Neon ambient orbs ── */}
      {/* Primary neon cyan orb — top left */}
      <div
        className="orb w-[680px] h-[680px] -top-48 -left-52 opacity-[0.22]"
        style={{
          background: "radial-gradient(circle, #00C8FF 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      {/* Secondary electric blue orb — bottom left */}
      <div
        className="orb w-[420px] h-[420px] bottom-16 -left-20 opacity-[0.18]"
        style={{
          background: "radial-gradient(circle, #0080FF 0%, transparent 65%)",
          filter: "blur(80px)",
          animationDelay: "3.2s",
        }}
      />
      {/* Accent cyan orb — centre right */}
      <div
        className="orb-breathe absolute top-1/3 right-1/4 w-[320px] h-[320px] rounded-full opacity-[0.12]"
        style={{
          background: "radial-gradient(circle, #00D4FF 0%, transparent 65%)",
          filter: "blur(65px)",
          animationDelay: "1.5s",
        }}
      />

      {/* ── Neon dot grid ── */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* ── Floating particles ── */}
      <HeroParticles count={28} />

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="relative flex-1 flex items-center">
        <div className="container-x pt-36 pb-20 md:pt-44 md:pb-28 w-full">
          {/* ── Eyebrow pill ── */}
          {/* <div className="anim-fade-up stagger-1">
            <span className="pill-tag border-brand-500/35 bg-brand-500/10 text-brand-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="live-dot text-emerald-400 h-full w-full" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <Sparkles className="h-3 w-3 text-brand-400" />
              {slide.eyebrow}
            </span>
          </div> */}

          {/* ── Heading ── */}
          <h1 className="h-display mt-7 max-w-[700px] anim-fade-up stagger-2">
            {/* {slide.heading.split("\n").map((line, i, arr) => (
              <span key={i}>
                {i === arr.length - 1 ? (
                  <span className="text-shimmer">{line}</span>
                ) : (
                  <span className="text-white">{line} </span>
                )}
                {i < arr.length - 1 && <br />}
              </span>
            ))} */}
            {"Your AI Journey Starts\nThis Weekend."
              .split("\n")
              .map((line, i, arr) => (
                <span key={i}>
                  {i === arr.length - 1 ? (
                    <span className="text-shimmer">{line}</span>
                  ) : (
                    <span>{line} </span>
                  )}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
          </h1>

          {/* ── Sub-copy ── */}
          <p className="mt-6 max-w-[440px] text-white/48 text-[15px] leading-[1.85] anim-fade-up stagger-3">
            Hands-on AI programs built for the weekend — live sessions, real
            projects, and career-moving certifications.
          </p>

          {/* ── Course card — neon animated border ── */}

          <div className=" relative mt-10 max-w-[476px] min-h-[240px]">
            {loading || !course ? (
              <HeroCardSkeleton />
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={course.id}
                  className="absolute inset-0"
                  initial={{
                    // x: "100%",
                    x: direction > 0 ? "100%" : "-100%",
                    opacity: 1,
                    scale: 0.97,
                  }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    // x: "-25%",
                    x: direction > 0 ? "-25%" : "25%",
                    opacity: 0,
                    scale: 0.96,
                  }}
                  transition={{
                    duration: 0.65,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {/* Your complete card here */}
                  <div className="hero-card-border  rounded-2xl">
                    <div className="hero-card-border p-[1.5px] rounded-2xl">
                      <div
                        className="group/hcard relative rounded-[14px] bg-ink-900/95 backdrop-blur-xl p-6 overflow-hidden
                            transition-all duration-500 hover:bg-ink-800/95"
                        style={{
                          boxShadow:
                            "0 32px 80px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(0,200,255,0.08)",
                        }}
                      >
                        {/* Neon corner glow */}
                        <div
                          className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none
                              opacity-30 group-hover/hcard:opacity-60 transition-opacity duration-500"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(0,200,255,0.35) 0%, transparent 70%)",
                            filter: "blur(22px)",
                          }}
                        />

                        <div className="relative">
                          <div className="flex flex-wrap items-center gap-2">
                            {course.price === 0
                              ? "Free - Enroll Now"
                              : "Enroll Now"}
                            <Badge variant="level-dark">{course.level}</Badge>
                            <span className="ml-auto text-[11px] text-white/30 font-medium tabular-nums">
                              {course.startDate ?? "Coming Soon"}
                            </span>
                          </div>

                          <h3
                            className="mt-4 text-[17px] font-semibold leading-snug text-white
                                  group-hover/hcard:text-brand-300 transition-colors duration-300"
                          >
                            {course.title}
                          </h3>
                          <p className="mt-1.5 text-[13px] text-white/35">
                            {course.totalWeeks} Weeks • {course._count.lessons}{" "}
                            Lessons
                          </p>

                          <div className="mt-6 flex flex-wrap items-center gap-3">
                            <Link href={`/courses/${course.slug}`}>
                              <Button
                                variant="primary"
                                size="sm"
                                className="btn-glow"
                              >
                                {/* {course.price === 0 && <Badge>FREE</Badge>} */}
                                {course.price === 0
                                  ? "Free - Enroll Now"
                                  : "Enroll Now"}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            {/* <Link href="/courses/from-zero-to-ai-ready-at-your-own-pace">
                    <Button variant="ghost-light" size="sm">{slide.secondaryCta}</Button>
                    </Link> */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Slider nav ── */}
          <div className="anim-fade-up stagger-5  flex items-center gap-4">
            <Button
              variant="ghost-light"
              size="icon"
              onClick={prevSlide}
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost-light"
              size="icon"
              aria-label="Next"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* <div className="flex items-center gap-1.5 ml-1">
              <span className="h-1.5 w-6 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(0,200,255,1)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/18 hover:bg-brand-500/50 transition-colors cursor-pointer" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/18 hover:bg-brand-500/50 transition-colors cursor-pointer" />
            </div> */}
          </div>

          {/* ── Stats strip — neon ── */}
          {/* <div className="anim-fade-up stagger-6 mt-12 w-fit">
            <div
              className="flex flex-wrap items-stretch rounded-2xl border border-brand-500/15 bg-ink-900/80
                          backdrop-blur-sm overflow-hidden divide-x divide-brand-500/10"
              style={{ boxShadow: "inset 0 1px 0 rgba(0,200,255,0.06), 0 0 40px rgba(0,200,255,0.05)" }}
            >
              {STATS.map(({ icon: Icon, value, label }, i) => (
                <div
                  key={label}
                  className="group/stat flex items-center gap-3 px-5 py-3.5
                              hover:bg-brand-500/6 transition-colors duration-300 cursor-default"
                >
                  <span
                    className="flex items-center justify-center h-8 w-8 rounded-lg border
                                bg-brand-500/12 border-brand-500/25
                                group-hover/stat:bg-brand-500/22 group-hover/stat:border-brand-500/40
                                group-hover/stat:shadow-[0_0_12px_rgba(0,200,255,0.25)]
                                transition-all duration-300 group-hover/stat:scale-110"
                  >
                    <Icon className="h-3.5 w-3.5 text-brand-400" />
                  </span>
                  <div>
                    <div
                      className="text-[17px] font-semibold leading-tight tracking-tight text-brand-300"
                      style={{ animationDelay: `${600 + i * 120}ms` }}
                    >
                      <CountUp value={value} duration={1800} />
                    </div>
                    <div className="text-[11px] text-white/35 mt-px">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div
        className="absolute bottom-[5.5rem] left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2
                    text-white/20 z-10 pointer-events-none anim-fade-up stagger-8"
      >
        <div className="relative h-10 w-[22px] rounded-full border border-brand-500/25 overflow-hidden">
          <div
            className="absolute left-1/2 top-1.5 h-[7px] w-[2.5px] rounded-full bg-brand-400/70"
            style={{ animation: "scroll-dot 2s ease-in-out infinite" }}
          />
        </div>
        <ChevronDown
          className="h-3.5 w-3.5 text-brand-500/50"
          style={{ animation: "float-up 2s ease-in-out infinite alternate" }}
        />
      </div>

      {/* ══════════ TICKER BAR ══════════ */}
      <div className="relative border-t border-brand-500/10 bg-ink-900/70 backdrop-blur-sm py-3 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 px-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/25 whitespace-nowrap
                          hover:text-brand-400 transition-colors duration-300 cursor-default"
            >
              <span className="h-[3px] w-[3px] rounded-full bg-brand-500/60 shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

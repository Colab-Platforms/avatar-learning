"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star, Clock, Users, BadgeCheck, Zap,
  ChevronDown, ArrowRight, Download,
} from "lucide-react";
import { Badge, Button, ScrollReveal, AnimateOnScroll } from "@/components/ui";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { COURSES } from "@/data/courses";
import { CourseIcon } from "@/lib/courseIcons";
import { useAppSelector } from "@/store/hooks";

interface PageProps { params: Promise<{ id: string }> }

export default function CoursePage({ params }: PageProps) {
  const { id } = use(params);
  const router  = useRouter();
  const [openWeek, setOpenWeek] = useState<number | null>(0);
  const { user } = useAppSelector((s) => s.auth);

  const course = COURSES.find((c) => c.id === id);
  if (!course) return notFound();

  const handleEnroll = () => { if (!user) router.push("/login"); };

  return (
    <>
      <Navbar />
      <main className="min-h-screen text-white overflow-x-hidden"
        style={{
          background:
            "linear-gradient(160deg, #060D1A 0%, #091220 25%, #060D1A 50%, #091525 75%, #060D1A 100%)",
        }}
      >

        {/* ── BANNER ── */}
        <div className="relative w-full h-[340px] sm:h-[440px] md:h-[520px] overflow-hidden">
          <Image
            src={course.bannerImage} alt={course.title}
            fill sizes="100vw"
            className="object-cover object-center scale-[1.04] transition-transform duration-[8000ms] ease-out"
            style={{ transformOrigin: "center 40%" }}
            priority
          />
          {/* gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/15 to-[#060D1A]" />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 90% 70% at 55% 35%, rgba(0,128,255,0.22) 0%, transparent 65%)" }} />
          {/* bottom fade */}
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#060D1A] to-transparent" />

          {/* breadcrumb pill over banner */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 container-x">
            <Link href="/#learning"
              className="inline-flex items-center gap-1.5 text-[12px] mt-10 text-white/50 hover:text-white/80
                         transition-colors duration-200 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
              ← All Courses
            </Link>
          </div>
        </div>


        {/* ── HERO INFO ── */}
        <section className="relative -mt-28 pb-20 overflow-hidden">
          {/* ambient cyan top glow */}
          <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
            style={{ background: "radial-gradient(ellipse at top, rgba(0,200,255,0.12) 0%, transparent 65%)", filter: "blur(60px)" }} aria-hidden />
          {/* blue orb right */}
          <div className="pointer-events-none absolute top-40 right-0 w-[500px] h-[400px] opacity-20"
            style={{ background: "radial-gradient(ellipse at right, rgba(0,80,200,0.5) 0%, transparent 65%)", filter: "blur(80px)" }} aria-hidden />
          <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-35" aria-hidden />

          <div className="relative container-x pt-10">
            <div className="grid md:grid-cols-[1fr_380px] gap-14 items-start">

              {/* LEFT */}
              <div>
                <ScrollReveal animation="fade-up" delay={0} duration={700}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30
                                  bg-brand-500/8 px-3.5 py-1.5 text-[11px] font-semibold uppercase
                                  tracking-widest text-brand-300 mb-5 hover:border-brand-500/50
                                  hover:bg-brand-500/12 transition-all duration-300 cursor-default">
                    <Zap className="h-3 w-3" />
                    AI Learning Course
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={60} duration={700}>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {course.free && <Badge variant="free">FREE</Badge>}
                    <Badge variant="level-light">{course.level}</Badge>
                    {course.certificate && (
                      <Badge variant="level-dark" className="flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3 text-emerald-400" />
                        Certificate Included
                      </Badge>
                    )}
                  </div>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={120} duration={800}>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-5">
                    {course.title}
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={180} duration={750}>
                  <p className="text-white/55 text-[16px] leading-relaxed max-w-xl mb-6">
                    {course.description}
                  </p>
                </ScrollReveal>


                {/* Rating */}
                <ScrollReveal animation="fade-up" delay={230} duration={700}>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm mb-6">
                    <span className="flex items-center gap-1.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s}
                          className={`h-4 w-4 transition-colors duration-200 ${
                            s <= Math.round(course.rating) ? "fill-amber-400 text-amber-400" : "text-white/20"
                          }`} />
                      ))}
                      <span className="ml-1 font-semibold text-white">{course.rating}</span>
                      <span className="text-white/40">({course.reviews})</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-white/45">
                      <Clock className="h-4 w-4" />{course.sessions}
                    </span>
                    <span className="flex items-center gap-1.5 text-white/45">
                      <Users className="h-4 w-4" />{course.seats}
                    </span>
                  </div>
                </ScrollReveal>

                {/* Meta row */}
                <ScrollReveal animation="fade-up" delay={280} duration={700}>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-white/45
                                  border-t border-white/6 pt-5 mb-8">
                    <span><span className="text-white/25 mr-1">Starts:</span>
                      <span className="text-white/65 font-medium">{course.startDate}</span></span>
                    <span><span className="text-white/25 mr-1">Duration:</span>
                      <span className="text-white/65 font-medium">{course.weeks} Weeks</span></span>
                    <span><span className="text-white/25 mr-1">Mode:</span>
                      <span className="text-white/65 font-medium">Live + Recorded</span></span>
                  </div>
                </ScrollReveal>

                {/* CTAs */}
                <ScrollReveal animation="fade-up" delay={330} duration={700}>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Button variant="primary" size="lg" onClick={handleEnroll}>
                      Get Started Today <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost-light" size="lg">
                      <Download className="h-4 w-4" /> Download Syllabus
                    </Button>
                  </div>
                </ScrollReveal>

                {/* Tool tags */}
                <ScrollReveal animation="fade-up" delay={380} duration={700}>
                  <div className="flex flex-wrap gap-2">
                    {course.tools.map((tool) => (
                      <span key={tool}
                        className="rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[11px]
                                   font-medium text-white/40 hover:border-brand-500/35 hover:bg-brand-500/8
                                   hover:text-brand-300 transition-all duration-250 cursor-default">
                        {tool}
                      </span>
                    ))}
                  </div>
                </ScrollReveal>
              </div>


              {/* RIGHT — sticky card */}
              <ScrollReveal animation="fade-left" delay={200} duration={900} className="hidden md:block">
                <div className="sticky top-24">
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-white/8
                                  group hover:border-brand-500/30 transition-all duration-500"
                    style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}>
                    <Image src={course.heroImage} alt={course.title} fill sizes="380px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/65 via-transparent to-transparent" />
                    {/* hover neon glow overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ background: "radial-gradient(ellipse 70% 60% at 50% 80%, rgba(0,200,255,0.08) 0%, transparent 70%)" }} />
                  </div>
                  {/* Floating stat */}
                  <div className="absolute -bottom-4 -left-4 rounded-xl border border-white/10
                                  bg-ink-800/90 backdrop-blur-sm px-4 py-3 shadow-lg
                                  hover:border-brand-500/25 transition-colors duration-300">
                    <p className="text-[11px] text-white/35 uppercase tracking-wider">Students enrolled</p>
                    <p className="text-2xl font-bold text-white mt-0.5">2,400+</p>
                  </div>
                </div>
              </ScrollReveal>

            </div>
          </div>
        </section>


        {/* ── WHAT YOU'LL LEARN ── */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          {/* section background glow */}
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 70% 60% at 20% 50%, rgba(0,80,160,0.12) 0%, transparent 65%)" }} aria-hidden />
          <div className="pointer-events-none absolute inset-0 line-grid opacity-25" aria-hidden />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" duration={700}>
              <div className="text-center mb-14">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">
                  Curriculum Overview
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">What You&apos;ll Learn</h2>
                <p className="mt-3 text-white/40 max-w-xl mx-auto">
                  Practical real-world skills you can apply in your work immediately.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {course.whatYouLearn.map((item, i) => (
                <AnimateOnScroll key={i} delay={i * 100}>
                  <div
                    className="group h-full rounded-2xl border border-white/6 p-6 cursor-default
                               hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-350"
                    style={{
                      background: "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
                      transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    {/* icon badge */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4
                                    bg-brand-500/10 border border-brand-500/15
                                    group-hover:bg-brand-500/20 group-hover:border-brand-500/35
                                    group-hover:shadow-[0_0_16px_rgba(0,200,255,0.15)]
                                    transition-all duration-350">
                      <CourseIcon name={item.iconName} />
                    </div>
                    <h3 className="font-semibold text-[15px] text-white mb-2 leading-snug
                                   group-hover:text-brand-300 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-white/40 leading-relaxed">{item.body}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>


        {/* ── PROGRAM STRUCTURE ── */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(6,13,26,0) 0%, rgba(9,21,37,0.7) 50%, rgba(6,13,26,0) 100%)" }} aria-hidden />
          <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[400px] opacity-15"
            style={{ background: "radial-gradient(ellipse at top right, rgba(0,128,255,0.45) 0%, transparent 65%)", filter: "blur(80px)" }} aria-hidden />
          <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-25" aria-hidden />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" duration={700}>
              <div className="text-center mb-14">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">
                  Curriculum
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Program Structure</h2>
                <p className="mt-3 text-white/40 max-w-xl mx-auto">
                  A structured week-by-week path — each milestone builds directly on the last.
                </p>
              </div>
            </ScrollReveal>

            <div className="max-w-3xl mx-auto space-y-3">
              {course.weekData.map((week, i) => (
                <AnimateOnScroll key={i} delay={i * 80}>
                  <div className="rounded-2xl border overflow-hidden transition-all duration-300"
                    style={{
                      borderColor: openWeek === i ? "rgba(0,200,255,0.20)" : "rgba(255,255,255,0.06)",
                      background: openWeek === i
                        ? "linear-gradient(145deg, rgba(0,200,255,0.04) 0%, rgba(9,18,32,0.98) 100%)"
                        : "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)",
                      boxShadow: openWeek === i ? "0 0 30px rgba(0,200,255,0.06)" : "none",
                    }}
                  >
                    <button
                      onClick={() => setOpenWeek(openWeek === i ? null : i)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left
                                 hover:bg-white/[0.02] transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full
                                         bg-brand-500/12 text-brand-400 text-[13px] font-bold
                                         transition-all duration-300"
                          style={{ boxShadow: openWeek === i ? "0 0 12px rgba(0,200,255,0.2)" : "none" }}>
                          {i + 1}
                        </span>
                        <span className="font-semibold text-[15px] text-white">{week.title}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-[12px] text-white/30 hidden sm:inline">
                          {week.modules.length} modules
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-white/40 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]
                                      ${openWeek === i ? "rotate-180 text-brand-400" : ""}`} />
                      </div>
                    </button>

                    {/* Smooth expand — CSS max-height transition */}
                    <div
                      className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{ maxHeight: openWeek === i ? "600px" : "0px" }}
                    >
                      <div className="px-6 pb-5 border-t border-white/5">
                        <ul className="mt-4 space-y-3">
                          {week.modules.map((mod, j) => (
                            <li key={j}
                              className="flex items-start gap-3 text-[14px] text-white/55
                                         hover:text-white/80 transition-colors duration-200"
                              style={{ transitionDelay: openWeek === i ? `${j * 40}ms` : "0ms" }}>
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center
                                               rounded-full bg-brand-500/8 text-brand-400 text-[10px] font-semibold">
                                {j + 1}
                              </span>
                              {mod}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>


        {/* ── WHO THIS IS FOR ── */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div className="pointer-events-none absolute bottom-0 left-0 w-[600px] h-[400px] opacity-15"
            style={{ background: "radial-gradient(ellipse at bottom left, rgba(0,200,255,0.4) 0%, transparent 65%)", filter: "blur(80px)" }} aria-hidden />
          <div className="pointer-events-none absolute inset-0 line-grid opacity-20" aria-hidden />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" duration={700}>
              <div className="text-center mb-14">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">Audience</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Who This Program Is For</h2>
                <p className="mt-3 text-white/40 max-w-xl mx-auto">
                  Designed for anyone ready to thrive in an AI-powered world.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {course.audience.map((item, i) => (
                <AnimateOnScroll key={i} delay={i * 100}>
                  <div
                    className="group h-full rounded-2xl border border-white/6 p-6 cursor-default
                               hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-350"
                    style={{
                      background: "linear-gradient(145deg, rgba(13,23,39,0.85) 0%, rgba(9,18,32,0.95) 100%)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                      transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4
                                    bg-brand-500/10 border border-brand-500/15
                                    group-hover:bg-brand-500/20 group-hover:border-brand-500/35
                                    group-hover:shadow-[0_0_16px_rgba(0,200,255,0.15)]
                                    transition-all duration-350">
                      <CourseIcon name={item.iconName} />
                    </div>
                    <h3 className="font-semibold text-[15px] text-white mb-2
                                   group-hover:text-brand-300 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-white/40 leading-relaxed">{item.body}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>


        {/* ── ENROLL CTA ── */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(6,13,26,0) 0%, rgba(0,30,60,0.25) 50%, rgba(6,13,26,0) 100%)" }} aria-hidden />

          <div className="container-x">
            <ScrollReveal animation="zoom-in" duration={800}>
              <div className="relative rounded-3xl overflow-hidden border border-brand-500/20 p-10 sm:p-16 text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(9,21,37,0.97) 0%, rgba(6,13,26,0.99) 100%)",
                  boxShadow: "0 0 100px rgba(0,200,255,0.07), inset 0 1px 0 rgba(0,200,255,0.10)",
                }}
              >
                {/* neon glow core */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 60% 55% at 50% 55%, rgba(0,200,255,0.08) 0%, transparent 70%)" }} />
                {/* top line accent */}
                <div className="absolute top-0 inset-x-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(0,200,255,0.4) 30%, rgba(0,128,255,0.5) 50%, rgba(0,200,255,0.4) 70%, transparent)" }} />

                <p className="relative text-[11px] font-semibold uppercase tracking-widest text-brand-400 mb-3">
                  {course.free ? "100% Free" : "Enrol Now"}
                </p>
                <h2 className="relative text-3xl sm:text-4xl font-bold mb-4">
                  Ready to start your AI journey?
                </h2>
                <p className="relative text-white/45 max-w-md mx-auto mb-8 text-[15px]">
                  Join 2,400+ learners who are already building real skills with Avatar India.
                </p>
                <div className="relative flex flex-wrap justify-center gap-3">
                  <Button variant="primary" size="lg" onClick={handleEnroll}>
                    Enroll for Free <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Link href="/">
                    <Button variant="ghost-light" size="lg">View All Courses</Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}

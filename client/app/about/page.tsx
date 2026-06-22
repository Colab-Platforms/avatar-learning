import Image from "next/image";
import Link from "next/link";
import {
  Globe, Users, Zap, Eye, Target, CheckCircle2,
  ArrowRight, GraduationCap, Bot, Briefcase, FlaskConical,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal, AnimateOnScroll } from "@/components/ui";

/* ─── data ─────────────────────────────────────────────────────────── */

const STATS = [
  { value: "2,400+", label: "Learners Enrolled" },
  { value: "35+",    label: "Countries Reached" },
  { value: "8",      label: "AI Divisions" },
  { value: "100%",   label: "Practical Focus" },
];

const VISION_POINTS = [
  "Democratize AI access for everyone globally",
  "Build a world where humans and machines collaborate seamlessly",
  "Pioneer responsible and ethical AI development",
];

const MISSION_POINTS = [
  "Deliver world-class AI education and certifications",
  "Build plug-and-play AI agents and SaaS products for businesses",
  "Connect AI talent with opportunities through our Talent Network",
  "Advance AI research for local, multilingual, and enterprise systems",
];

const DIVISIONS = [
  { icon: GraduationCap, label: "AI Learning",      desc: "Weekend-first live programs with real projects and certificates." },
  { icon: Bot,           label: "Agent Marketplace", desc: "Deployable AI agents that integrate into any business workflow." },
  { icon: Briefcase,     label: "Enterprise AI",     desc: "End-to-end AI infrastructure for organizations at scale." },
  { icon: FlaskConical,  label: "AI Research",       desc: "Building multilingual and responsible AI for the real world." },
];

const PARTNERS = [
  "Google Cloud", "Microsoft Azure", "AWS", "NVIDIA",
  "Intel", "IBM Watson", "Snowflake", "Salesforce",
  "UiPath", "GitHub", "Cisco", "Palo Alto",
];

/* ─── page ──────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-white overflow-x-hidden pt-16"
        style={{
          background: "linear-gradient(160deg,#060D1A 0%,#091220 25%,#060D1A 55%,#091525 80%,#060D1A 100%)",
        }}
      >
        {/* ambient layers */}
        <div className="pointer-events-none fixed inset-0 dot-grid-dark opacity-20" aria-hidden />
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-[0.11]"
          style={{ background: "radial-gradient(ellipse at top,rgba(0,200,255,0.45) 0%,transparent 65%)", filter: "blur(70px)" }}
          aria-hidden
        />

        {/* ══════════════════════════════
            HERO
        ══════════════════════════════ */}
        <section className="relative py-24 sm:py-32 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 line-grid opacity-20" aria-hidden />
          <div
            className="pointer-events-none absolute top-0 right-0 w-[700px] h-[500px] opacity-15"
            style={{ background: "radial-gradient(ellipse at top right,rgba(0,128,255,0.5) 0%,transparent 65%)", filter: "blur(80px)" }}
            aria-hidden
          />

          <div className="relative container-x">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* left */}
              <div>
                <ScrollReveal animation="fade-up" delay={0}>
                  <p className="eyebrow mb-4">Who We Are</p>
                  <h1 className="h-display text-white mb-6">
                    Powering the AI Revolution —{" "}
                    <span className="text-gradient-brand">For Everyone</span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={80}>
                  <p className="text-white/45 text-[16px] leading-relaxed mb-4">
                    Avatar is a next-generation AI ecosystem built to democratize
                    artificial intelligence for individuals, businesses, and
                    enterprises worldwide.
                  </p>
                  <p className="text-white/40 text-[15px] leading-relaxed mb-8">
                    From students taking their first AI course to Fortune 500 companies
                    deploying enterprise-grade infrastructure — we serve every level of
                    the AI adoption journey under one unified platform.
                  </p>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={150}>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3
                                 text-[14px] font-semibold text-ink-950
                                 hover:bg-brand-400 hover:scale-[1.04]
                                 shadow-[0_2px_16px_rgba(0,200,255,0.40)]
                                 hover:shadow-[0_4px_32px_rgba(0,200,255,0.65)]
                                 transition-all duration-250"
                    >
                      Explore Programs <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-full border border-white/15
                                 px-6 py-3 text-[14px] font-medium text-white/70
                                 hover:border-brand-500/40 hover:text-brand-300
                                 hover:bg-brand-500/6 transition-all duration-250"
                    >
                      Talk to Our Team
                    </Link>
                  </div>
                </ScrollReveal>
              </div>

              {/* right — image + stat cards */}
              <ScrollReveal animation="fade-left" delay={200} duration={900}>
                <div className="relative">
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-white/8
                                  hover:border-brand-500/30 transition-all duration-500 group"
                    style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.55)" }}>
                    <Image
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                      alt="Avatar Team"
                      fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 via-transparent to-transparent" />
                  </div>

                  {/* floating stat — bottom left */}
                  <div className="absolute -bottom-5 -left-4 rounded-xl border border-white/10
                                  bg-ink-800/90 backdrop-blur-sm px-4 py-3 shadow-lg
                                  hover:border-brand-500/25 transition-colors duration-300 hidden md:block">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">Countries Reached</p>
                    <p className="text-2xl font-bold text-white mt-0.5">35+</p>
                  </div>

                  {/* floating stat — top right */}
                  <div className="absolute -top-4 -right-4 rounded-xl border border-brand-500/20
                                  bg-ink-800/90 backdrop-blur-sm px-4 py-3 shadow-lg hidden md:block"
                    style={{ boxShadow: "0 0 20px rgba(0,200,255,0.08)" }}>
                    <p className="text-[10px] text-brand-400/70 uppercase tracking-wider">Since</p>
                    <p className="text-xl font-bold text-white mt-0.5">2026</p>
                    <p className="text-[10px] text-white/30 mt-0.5">Building AI Future</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* stat strip */}
            <ScrollReveal animation="fade-up" delay={200} className="mt-20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map((s, i) => (
                  <AnimateOnScroll key={s.label} delay={i * 70}>
                    <div
                      className="rounded-2xl border border-white/6 p-6 text-center
                                 hover:border-brand-500/25 hover:-translate-y-1 transition-all duration-300"
                      style={{ background: "linear-gradient(145deg,rgba(13,23,39,0.85) 0%,rgba(9,18,32,0.95) 100%)" }}
                    >
                      <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                      <p className="text-[12px] text-white/35 uppercase tracking-wider">{s.label}</p>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>


        {/* ══════════════════════════════
            OUR STORY
        ══════════════════════════════ */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-25" aria-hidden />
          <div
            className="pointer-events-none absolute bottom-0 left-0 w-[600px] h-[400px] opacity-10"
            style={{ background: "radial-gradient(ellipse at bottom left,rgba(0,200,255,0.5) 0%,transparent 65%)", filter: "blur(80px)" }}
            aria-hidden
          />

          <div className="relative container-x max-w-3xl text-center">
            <ScrollReveal animation="fade-up">
              <p className="eyebrow mb-4">Our Story</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-6">
                From a Simple Idea to a{" "}
                <span className="text-gradient-brand">Global AI Ecosystem</span>
              </h2>
              <p className="text-white/45 text-[16px] leading-relaxed mb-5">
                Avatar started with a simple but powerful question:{" "}
                <span className="text-white/70 font-medium">
                  What if anyone — regardless of background, budget, or technical
                  expertise — could harness the power of AI?
                </span>{" "}
                That question sparked a journey to build the most comprehensive AI
                platform in the world.
              </p>
              <p className="text-white/38 text-[15px] leading-relaxed">
                Today, Avatar serves thousands of individuals, hundreds of businesses,
                and enterprise clients across 35+ countries. Our ecosystem spans AI
                education, intelligent automation, a marketplace of deployable AI agents,
                SaaS products, talent networks, and ongoing research. And we're just
                getting started.
              </p>
            </ScrollReveal>
          </div>
        </section>


        {/* ══════════════════════════════
            VISION & MISSION
        ══════════════════════════════ */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden" id="vision-mission">
          <div
            className="pointer-events-none absolute top-0 right-0 w-[600px] h-[400px] opacity-10"
            style={{ background: "radial-gradient(ellipse at top right,rgba(0,128,255,0.5) 0%,transparent 65%)", filter: "blur(80px)" }}
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 line-grid opacity-15" aria-hidden />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="text-center mb-14">
              <p className="eyebrow mb-4">What Drives Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Vision &amp; Mission
              </h2>
              <p className="mt-3 text-white/38 max-w-xl mx-auto">
                The principles guiding every product we build, every course we design,
                and every partnership we forge.
              </p>
            </ScrollReveal>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Vision */}
              <AnimateOnScroll delay={0}>
                <div
                  className="group h-full rounded-2xl border border-white/6 p-8 sm:p-10
                             hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-350"
                  style={{
                    background: "linear-gradient(145deg,rgba(13,23,39,0.85) 0%,rgba(9,18,32,0.95) 100%)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
                    transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-6
                                  bg-brand-500/10 border border-brand-500/15
                                  group-hover:bg-brand-500/20 group-hover:border-brand-500/35
                                  group-hover:shadow-[0_0_16px_rgba(0,200,255,0.15)]
                                  transition-all duration-350">
                    <Eye className="h-5 w-5 text-brand-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors duration-300">Our Vision</h3>
                  <p className="text-white/40 text-[14px] leading-relaxed mb-5">
                    To become the world's most trusted and comprehensive AI ecosystem —
                    a single platform where anyone, anywhere can learn, build, deploy,
                    and scale AI solutions that transform lives and businesses.
                  </p>
                  <ul className="space-y-3">
                    {VISION_POINTS.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-[13px] text-white/50">
                        <CheckCircle2 className="h-4 w-4 text-brand-400/70 shrink-0 mt-0.5" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>

              {/* Mission */}
              <AnimateOnScroll delay={120}>
                <div
                  className="group h-full rounded-2xl border border-white/6 p-8 sm:p-10
                             hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-350"
                  style={{
                    background: "linear-gradient(145deg,rgba(13,23,39,0.85) 0%,rgba(9,18,32,0.95) 100%)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
                    transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-6
                                  bg-elec-500/10 border border-elec-500/15
                                  group-hover:bg-elec-500/20 group-hover:border-elec-500/35
                                  group-hover:shadow-[0_0_16px_rgba(0,128,255,0.15)]
                                  transition-all duration-350">
                    <Target className="h-5 w-5 text-elec-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors duration-300">Our Mission</h3>
                  <p className="text-white/40 text-[14px] leading-relaxed mb-5">
                    To empower individuals and organizations with practical, scalable AI
                    tools and education — bridging the gap between AI innovation and
                    real-world adoption across our eight interconnected divisions.
                  </p>
                  <ul className="space-y-3">
                    {MISSION_POINTS.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-[13px] text-white/50">
                        <CheckCircle2 className="h-4 w-4 text-elec-400/70 shrink-0 mt-0.5" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>


        {/* ══════════════════════════════
            DIVISIONS
        ══════════════════════════════ */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-20" aria-hidden />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="text-center mb-14">
              <p className="eyebrow mb-4">Our Ecosystem</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Eight Divisions, One Platform
              </h2>
              <p className="mt-3 text-white/38 max-w-xl mx-auto">
                End-to-end AI capabilities that grow with our users — from first course
                to enterprise deployment.
              </p>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DIVISIONS.map((d, i) => (
                <AnimateOnScroll key={d.label} delay={i * 80}>
                  <div
                    className="group h-full rounded-2xl border border-white/6 p-6
                               hover:border-brand-500/30 hover:-translate-y-1.5 transition-all duration-350 cursor-default"
                    style={{
                      background: "linear-gradient(145deg,rgba(13,23,39,0.85) 0%,rgba(9,18,32,0.95) 100%)",
                      transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                    }}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4
                                    bg-brand-500/10 border border-brand-500/15
                                    group-hover:bg-brand-500/20 group-hover:border-brand-500/35
                                    group-hover:shadow-[0_0_14px_rgba(0,200,255,0.15)]
                                    transition-all duration-350">
                      <d.icon className="h-5 w-5 text-brand-400" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-white mb-2
                                   group-hover:text-brand-300 transition-colors duration-300">
                      {d.label}
                    </h3>
                    <p className="text-[13px] text-white/38 leading-relaxed">{d.desc}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>


        {/* ══════════════════════════════
            PARTNERS
        ══════════════════════════════ */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] opacity-[0.06]"
            style={{ background: "radial-gradient(ellipse at top,rgba(0,200,255,0.6) 0%,transparent 65%)", filter: "blur(60px)" }}
            aria-hidden
          />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="text-center mb-14">
              <p className="eyebrow mb-4">Our Partners</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Trusted by Industry Leaders
              </h2>
              <p className="mt-3 text-white/38 max-w-lg mx-auto">
                We collaborate with world-class organizations to deliver cutting-edge
                AI solutions, research, and education.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {PARTNERS.map((name, i) => (
                  <div
                    key={name}
                    className="group rounded-xl border border-white/5 px-4 py-5 flex items-center justify-center
                               hover:border-brand-500/25 hover:bg-brand-500/4 transition-all duration-300"
                    style={{ background: "linear-gradient(145deg,rgba(13,23,39,0.7) 0%,rgba(9,18,32,0.85) 100%)" }}
                  >
                    <span className="text-[12px] font-medium text-white/30 group-hover:text-white/60
                                     text-center leading-snug transition-colors duration-300">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={150} className="text-center mt-10">
              <p className="text-[13px] text-white/30 mb-4">Interested in partnering with Avatar?</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-brand-500/35
                           px-6 py-2.5 text-[13px] font-medium text-brand-300
                           hover:bg-brand-500/10 hover:border-brand-500/60 transition-all duration-250"
              >
                Become a Partner <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </ScrollReveal>
          </div>
        </section>


        {/* ══════════════════════════════
            CTA
        ══════════════════════════════ */}
        <section className="py-24 border-t border-white/5 relative overflow-hidden">
          <div className="container-x">
            <ScrollReveal animation="zoom-in" duration={800}>
              <div
                className="relative rounded-3xl overflow-hidden border border-brand-500/20 p-10 sm:p-16 text-center"
                style={{
                  background: "linear-gradient(135deg,rgba(9,21,37,0.97) 0%,rgba(6,13,26,0.99) 100%)",
                  boxShadow: "0 0 100px rgba(0,200,255,0.07),inset 0 1px 0 rgba(0,200,255,0.10)",
                }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse 60% 55% at 50% 55%,rgba(0,200,255,0.08) 0%,transparent 70%)" }} />
                <div className="absolute top-0 inset-x-0 h-px"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(0,200,255,0.4) 30%,rgba(0,128,255,0.5) 50%,rgba(0,200,255,0.4) 70%,transparent)" }} />

                <p className="relative eyebrow mb-3">Join Us</p>
                <h2 className="relative text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to Build Your AI Future?
                </h2>
                <p className="relative text-white/42 max-w-md mx-auto mb-8 text-[15px]">
                  Whether you want to learn AI, automate your business, or deploy enterprise
                  AI — Avatar is your one-stop platform.
                </p>
                <div className="relative flex flex-wrap justify-center gap-3">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3.5
                               text-[14px] font-semibold text-ink-950
                               hover:bg-brand-400 hover:scale-[1.04]
                               shadow-[0_2px_16px_rgba(0,200,255,0.40)]
                               hover:shadow-[0_4px_32px_rgba(0,200,255,0.65)]
                               transition-all duration-250"
                  >
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15
                               px-7 py-3.5 text-[14px] font-medium text-white/70
                               hover:border-brand-500/40 hover:text-brand-300
                               hover:bg-brand-500/6 transition-all duration-250"
                  >
                    Talk to Our Team
                  </Link>
                </div>
                <p className="relative mt-5 text-[12px] text-white/22">
                  No credit card required · Free tier available · Cancel anytime
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}

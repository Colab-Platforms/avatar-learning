import Image from "next/image";
import Link from "next/link";
import {
  Globe,
  Users,
  Zap,
  Eye,
  Target,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Bot,
  Briefcase,
  FlaskConical,
} from "lucide-react";
import {
  SiGooglecloud,
  SiNvidia,
  SiIntel,
  SiSnowflake,
  SiUipath,
  SiGithub,
  SiCisco,
  SiPaloaltonetworks,
  SiHuggingface,
  SiPytorch,
  SiTensorflow,
  SiDatabricks,
} from "react-icons/si";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal, AnimateOnScroll } from "@/components/ui";

/* ─── data ─────────────────────────────────────────────────────────── */

const STATS = [
  { value: "2,400+", label: "Learners Enrolled" },
  { value: "35+", label: "Countries Reached" },
  { value: "8", label: "AI Divisions" },
  { value: "100%", label: "Practical Focus" },
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
  {
    icon: FlaskConical,
    label: "Counselling",
    desc: "Expert guidance to turn your ambitions into a successful career",
  },
  {
    icon: GraduationCap,
    label: "AI Learning",
    desc: "Weekend-first live programs with real projects and certificates.",
  },
  {
    icon: Briefcase,
    label: "Internship",
    desc: "Real projects. Real mentors. Real industry experience.",
  },
  {
    icon: Bot,
    label: "Placement",
    desc: "Industry-ready placement support with interviews and hiring opportunities",
  },
];

const PARTNERS = [
  { name: "Google Cloud", Icon: SiGooglecloud, color: "#4285F4" },
  { name: "NVIDIA", Icon: SiNvidia, color: "#76B900" },
  { name: "Intel", Icon: SiIntel, color: "#0071C5" },
  { name: "Snowflake", Icon: SiSnowflake, color: "#29B5E8" },
  { name: "UiPath", Icon: SiUipath, color: "#FA4616" },
  { name: "GitHub", Icon: SiGithub, color: "#1F2937" },
  { name: "Cisco", Icon: SiCisco, color: "#1BA0D7" },
  { name: "Palo Alto", Icon: SiPaloaltonetworks, color: "#FA582D" },
  { name: "Hugging Face", Icon: SiHuggingface, color: "#D97706" },
  { name: "PyTorch", Icon: SiPytorch, color: "#EE4C2C" },
  { name: "TensorFlow", Icon: SiTensorflow, color: "#FF6F00" },
  { name: "Databricks", Icon: SiDatabricks, color: "#FF3621" },
];

/* ─── page ──────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main
        className="min-h-screen text-slate-800 overflow-x-hidden"
        style={{
          background: "#FFFFFF",
        }}
      >
        {/* ambient */}
        <div
          className="pointer-events-none fixed inset-0 dot-grid opacity-[0.10]"
          aria-hidden
        />
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(99,102,241,0.10) 0%, transparent 65%)",
            filter: "blur(70px)",
          }}
          aria-hidden
        />

        {/* ══ HERO ══ */}
        <section className="relative py-12 sm:pt-25 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 dot-grid opacity-[0.08]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-0 right-0 w-[700px] h-[500px] opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(99,102,241,0.18) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
            aria-hidden
          />

          <div className="relative container-x">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* left */}
              <div>
                <ScrollReveal animation="fade-up" delay={0}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-4 cursor-default">
                    <Zap className="h-3 w-3" /> Who We Are
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900 mb-6">
                    Powering the AI Revolution —{" "}
                    <span
                      className="text-transparent bg-clip-text"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #4F46E5 0%, #2563EB 100%)",
                      }}
                    >
                      For Everyone
                    </span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={80}>
                  <p className="text-slate-600 text-[16px] leading-relaxed mb-4">
                    Avatar is a next-generation AI ecosystem built to
                    democratize artificial intelligence for individuals,
                    businesses, and enterprises worldwide.
                  </p>
                  <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
                    From students taking their first AI course to Fortune 500
                    companies deploying enterprise-grade infrastructure — we
                    serve every level of the AI adoption journey under one
                    unified platform.
                  </p>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={150}>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-2 rounded-full px-6 py-3
                                 text-[14px] font-semibold text-white
                                 hover:brightness-110 hover:scale-[1.04]
                                 shadow-md transition-all duration-250"
                      style={{
                        background:
                          "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                      }}
                    >
                      Explore Programs <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200
                                 px-6 py-3 text-[14px] font-medium text-slate-600
                                 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50
                                 transition-all duration-250"
                    >
                      Talk to Our Team
                    </Link>
                  </div>
                </ScrollReveal>
              </div>

              {/* right — image + stat cards */}
              <ScrollReveal animation="fade-left" delay={200} duration={900}>
                <div className="relative">
                  <div
                    className="relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200
                                  hover:border-blue-300/50 transition-all duration-500 group"
                    style={{ boxShadow: "0 16px 48px rgba(99,102,241,0.10)" }}
                  >
                    <Image
                      src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                      alt="Avatar Team"
                      fill
                      sizes="(max-width:1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-900/15 via-transparent to-transparent" />
                  </div>

                  {/* floating stat — bottom left */}
                  <div
                    className="absolute -bottom-5 -left-4 rounded-xl border border-slate-200
                                  bg-white/95 backdrop-blur-sm px-4 py-3 shadow-sm
                                  hover:border-blue-200 transition-colors duration-300 hidden md:block"
                  >
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Countries Reached
                    </p>
                    <p className="text-2xl font-bold text-slate-800 mt-0.5">
                      35+
                    </p>
                  </div>

                  {/* floating stat — top right */}
                  <div
                    className="absolute -top-4 -right-4 rounded-xl border border-blue-100
                                  bg-white/95 backdrop-blur-sm px-4 py-3 shadow-sm hidden md:block"
                  >
                    <p className="text-[10px] text-blue-500 uppercase tracking-wider">
                      Since
                    </p>
                    <p className="text-xl font-bold text-slate-800 mt-0.5">
                      2026
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Building AI Future
                    </p>
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
                      className="rounded-2xl border border-slate-200 p-6 text-center
                                 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
                      style={{
                        background:
                          "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                      }}
                    >
                      <p className="text-3xl font-bold text-slate-900 mb-1">
                        {s.value}
                      </p>
                      <p className="text-[12px] text-slate-400 uppercase tracking-wider">
                        {s.label}
                      </p>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ══ OUR STORY ══ */}
        <section
          className="py-12 border-t border-slate-100 relative overflow-hidden"
          style={{ background: "#FAFAFA" }}
        >
          <div
            className="pointer-events-none absolute inset-0 dot-grid opacity-[0.07]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 w-[600px] h-[400px] opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at bottom left, rgba(99,102,241,0.08) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
            aria-hidden
          />

          <div className="relative container-x max-w-3xl text-center">
            <ScrollReveal animation="fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-4 cursor-default">
                <Globe className="h-3 w-3" /> Our Story
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-6">
                From a Simple Idea to a{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #4F46E5 0%, #2563EB 100%)",
                  }}
                >
                  Global AI Ecosystem
                </span>
              </h2>
              <p className="text-slate-600 text-[16px] leading-relaxed mb-5">
                Avatar started with a simple but powerful question:{" "}
                <span className="text-slate-800 font-medium">
                  What if anyone regardless of background, budget, or technical
                  expertise could harness the power of AI?
                </span>{" "}
                That question sparked a journey to build the most comprehensive
                AI platform in the world.
              </p>
              <p className="text-slate-500 text-[15px] leading-relaxed">
                Today, Avatar serves thousands of individuals, hundreds of
                businesses, and enterprise clients across 35+ countries. Our
                ecosystem spans AI education, intelligent automation, a
                marketplace of deployable AI agents, SaaS products, talent
                networks, and ongoing research. And we&apos;re just getting
                started.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ══ VISION & MISSION ══ */}
        <section
          className="py-12 border-t border-blue-100/60 relative overflow-hidden"
          style={{ background: "#FFFFFF" }}
          id="vision-mission"
        >
          <div
            className="pointer-events-none absolute top-0 right-0 w-[600px] h-[400px] opacity-15"
            style={{
              background:
                "radial-gradient(ellipse at top right, rgba(59,130,246,0.15) 0%, transparent 65%)",
              filter: "blur(80px)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 dot-grid opacity-[0.07]"
            aria-hidden
          />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-4 cursor-default">
                <Zap className="h-3 w-3" /> What Drives Us
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Vision &amp; Mission
              </h2>
              <p className="mt-3 text-slate-500 max-w-xl mx-auto">
                The principles guiding every product we build, every course we
                design, and every partnership we forge.
              </p>
            </ScrollReveal>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Vision */}
              <AnimateOnScroll delay={0}>
                <div
                  className="group h-full rounded-2xl border border-slate-200 p-8 sm:p-10
                             hover:border-blue-300/50 hover:-translate-y-1.5 transition-all duration-350"
                  style={{
                    background:
                      "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl mb-6
                                  bg-blue-50 border border-blue-100
                                  group-hover:bg-blue-100 group-hover:border-blue-200
                                  transition-all duration-350"
                  >
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors duration-300">
                    Our Vision
                  </h3>
                  <p className="text-slate-500 text-[14px] leading-relaxed mb-5">
                    To become the world&apos;s most trusted and comprehensive AI
                    ecosystem — a single platform where anyone, anywhere can
                    learn, build, deploy, and scale AI solutions that transform
                    lives and businesses.
                  </p>
                  <ul className="space-y-3">
                    {VISION_POINTS.map((pt) => (
                      <li
                        key={pt}
                        className="flex items-start gap-3 text-[13px] text-slate-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>

              {/* Mission */}
              <AnimateOnScroll delay={120}>
                <div
                  className="group h-full rounded-2xl border border-slate-200 p-8 sm:p-10
                             hover:border-indigo-300/50 hover:-translate-y-1.5 transition-all duration-350"
                  style={{
                    background:
                      "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl mb-6
                                  bg-indigo-50 border border-indigo-100
                                  group-hover:bg-indigo-100 group-hover:border-indigo-200
                                  transition-all duration-350"
                  >
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors duration-300">
                    Our Mission
                  </h3>
                  <p className="text-slate-500 text-[14px] leading-relaxed mb-5">
                    To empower individuals and organizations with practical,
                    scalable AI tools and education — bridging the gap between
                    AI innovation and real-world adoption across our eight
                    interconnected divisions.
                  </p>
                  <ul className="space-y-3">
                    {MISSION_POINTS.map((pt) => (
                      <li
                        key={pt}
                        className="flex items-start gap-3 text-[13px] text-slate-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </section>

        {/* ══ DIVISIONS ══ */}
        <section
          className="py-12 border-t border-purple-100/50 relative overflow-hidden"
          style={{ background: "#FAFAFA" }}
        >
          <div
            className="pointer-events-none absolute inset-0 dot-grid opacity-[0.08]"
            aria-hidden
          />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-4 cursor-default">
                <Users className="h-3 w-3" /> Our Ecosystem
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Four Divisions, One Platform
              </h2>
              <p className="mt-3 text-slate-500 max-w-xl mx-auto">
                End-to-end AI capabilities that grow with our users — from first
                course to enterprise deployment.
              </p>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DIVISIONS.map((d, i) => (
                <AnimateOnScroll key={d.label} delay={i * 80}>
                  <div
                    className="group h-full rounded-2xl border border-slate-200 p-6
                               hover:border-blue-300/50 hover:-translate-y-1.5 transition-all duration-350 cursor-default"
                    style={{
                      background:
                        "linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)",
                    }}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl mb-4
                                    bg-blue-50 border border-blue-100
                                    group-hover:bg-blue-100 group-hover:border-blue-200
                                    transition-all duration-350"
                    >
                      <d.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-[15px] text-slate-900 mb-2 group-hover:text-blue-700 transition-colors duration-300">
                      {d.label}
                    </h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PARTNERS ══ */}
        <section
          className="py-12 border-t border-slate-100 relative overflow-hidden"
          style={{ background: "#FFFFFF" }}
        >
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(99,102,241,0.12) 0%, transparent 65%)",
              filter: "blur(60px)",
            }}
            aria-hidden
          />

          <div className="relative container-x">
            <ScrollReveal animation="fade-up" className="text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-4 cursor-default">
                <Globe className="h-3 w-3" /> Our Partners
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Trusted by Industry Leaders
              </h2>
              <p className="mt-3 text-slate-500 max-w-lg mx-auto">
                We collaborate with world-class organizations to deliver
                cutting-edge AI solutions, research, and education.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {PARTNERS.map(({ name, Icon, color }) => (
                  <div
                    key={name}
                    title={name}
                    className="group relative rounded-xl border border-slate-200 px-4 py-6 flex flex-col items-center justify-center gap-2
                               hover:border-blue-200 hover:shadow-sm transition-all duration-300 cursor-default"
                    style={{
                      background:
                        "linear-gradient(145deg, #FFFFFF 0%, #F8FAFF 100%)",
                    }}
                  >
                    <Icon
                      className="h-7 w-7 transition-all duration-300 text-slate-300 group-hover:scale-110"
                      style={
                        {
                          color: `color-mix(in srgb, ${color} 80%, transparent)`,
                        } as React.CSSProperties
                      }
                    />
                    <span className="text-[10px] font-medium text-slate-0 group-hover:text-slate-400 text-center leading-snug transition-all duration-300 absolute bottom-2">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal
              animation="fade-up"
              delay={150}
              className="text-center mt-10"
            >
              <p className="text-[13px] text-slate-400 mb-4">
                Interested in partnering with Avatar?
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-blue-200
                           px-6 py-2.5 text-[13px] font-medium text-blue-700
                           hover:bg-blue-50 hover:border-blue-300 transition-all duration-250"
              >
                Become a Partner <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </ScrollReveal>
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section
          className="py-12 border-t border-slate-100 relative overflow-hidden"
          style={{ background: "#FAFAFA" }}
        >
          <div className="container-x">
            <ScrollReveal animation="zoom-in" duration={800}>
              <div
                className="relative rounded-3xl overflow-hidden border border-blue-200/80 p-10 sm:p-16 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)",
                  boxShadow:
                    "0 10px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "none" }}
                />
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(148,163,184,0.4) 30%, rgba(100,116,139,0.5) 50%, rgba(148,163,184,0.4) 70%, transparent)",
                  }}
                />

                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-3 cursor-default">
                  <Zap className="h-3 w-3" /> Join Us
                </div>
                <h2 className="relative text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  Ready to Build Your AI Future?
                </h2>
                <p className="relative text-slate-500 max-w-md mx-auto mb-8 text-[15px]">
                  Whether you want to learn AI, automate your business, or
                  deploy enterprise AI — Avatar is your one-stop platform.
                </p>
                <div className="relative flex flex-wrap justify-center gap-3">
                  <Link
                    href="/courses"
                    className="inline-flex items-center gap-2 rounded-full px-7 py-3.5
                               text-[14px] font-semibold text-white
                               hover:brightness-110 hover:scale-[1.04]
                               shadow-md transition-all duration-250"
                    style={{
                      background:
                        "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                    }}
                  >
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200
                               px-7 py-3.5 text-[14px] font-medium text-slate-600
                               hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50
                               transition-all duration-250"
                  >
                    Talk to Our Team
                  </Link>
                </div>
                <p className="relative mt-5 text-[12px] text-slate-400">
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

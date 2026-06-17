import { ChevronLeft, ChevronRight, Sparkles, Users, Star, TrendingUp, ArrowRight } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { HERO_SLIDES } from "@/data/hero";

const STATS = [
  { icon: Users,      value: "10,000+", label: "Students enrolled" },
  { icon: Star,       value: "4.9",     label: "Average rating" },
  { icon: TrendingUp, value: "95%",     label: "Completion rate" },
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
  const slide = HERO_SLIDES[0];

  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-white min-h-screen flex flex-col">

      {/* ─── Background video ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/landingpage-images/hero.png"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-right-top opacity-90"
      >
        <source src="/landing-vid/robot-vid.mp4" type="video/mp4" />
      </video>

      {/* Left dark fade — text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/65 to-transparent" />
      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
      {/* Top fade (for navbar blend) */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-ink-950/60 to-transparent" />

      {/* ─── Glow orbs (left side only) ── */}
      <div
        className="orb w-[560px] h-[560px] -top-32 -left-40 opacity-[0.28]"
        style={{ background: "radial-gradient(circle, #2F7BFF 0%, transparent 65%)", filter: "blur(90px)" }}
      />
      <div
        className="orb w-[360px] h-[360px] bottom-20 -left-16 opacity-[0.18]"
        style={{ background: "radial-gradient(circle, #7c5fff 0%, transparent 65%)", filter: "blur(70px)", animationDelay: "3s" }}
      />

      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-35 pointer-events-none" />

      {/* ─── Main content ── */}
      <div className="relative flex-1 flex items-center">
        <div className="container-x pt-36 pb-20 md:pt-44 md:pb-28 w-full">

          {/* Eyebrow */}
          <div className="anim-fade-up stagger-1">
            <span className="pill-tag border-brand-500/30 bg-brand-500/10 text-brand-300">
              <Sparkles className="h-3 w-3 text-brand-400" />
              {slide.eyebrow}
            </span>
          </div>

          {/* Heading */}
          <h1 className="h-display mt-7 max-w-[640px] anim-fade-up stagger-2">
            {slide.heading.split("\n").map((line, i, arr) => (
              <span key={i}>
                {i === arr.length - 1
                  ? <span className="text-shimmer">{line}</span>
                  : <span className="text-white">{line}</span>
                }
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>

          {/* Sub copy */}
          <p className="mt-6 max-w-md text-white/48 text-[15px] leading-[1.8] anim-fade-up stagger-3">
            Hands-on AI programs built for the weekend — live sessions,
            real projects, and career-moving certifications.
          </p>

          {/* Course card */}
          <div
            className="anim-fade-up stagger-4 group/hcard mt-10 max-w-[460px] relative rounded-2xl border border-white/[0.08] bg-white/[0.055] backdrop-blur-xl p-6 overflow-hidden
                        transition-all duration-500 hover:border-brand-500/30 hover:bg-white/[0.08]"
            style={{ boxShadow: "0 0 0 1px rgba(47,123,255,0.08), 0 32px 80px -16px rgba(0,0,0,0.5)" }}
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent
                            scale-x-75 group-hover/hcard:scale-x-100 transition-transform duration-500 origin-center" />
            {/* Corner orb */}
            <div
              className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none opacity-50 group-hover/hcard:opacity-80 transition-opacity duration-500"
              style={{ background: "radial-gradient(circle, rgba(47,123,255,0.25) 0%, transparent 70%)", filter: "blur(18px)" }}
            />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                {slide.badge.free && <Badge variant="free">FREE</Badge>}
                <Badge variant="level-dark">{slide.badge.level}</Badge>
                <span className="ml-auto text-[11px] text-white/35 font-medium">{slide.badge.date}</span>
              </div>
              <h3 className="mt-4 text-[17px] font-semibold leading-snug text-white group-hover/hcard:text-brand-200 transition-colors duration-300">
                {slide.courseTitle}
              </h3>
              <p className="mt-1.5 text-[13px] text-white/40">{slide.courseMeta}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">
                  {slide.primaryCta}
                  <ArrowRight className="h-3.5 w-3.5 group-hover/hcard:translate-x-0.5 transition-transform duration-250" />
                </Button>
                <Button variant="ghost-light" size="sm">{slide.secondaryCta}</Button>
              </div>
            </div>
          </div>

          {/* Slider nav + dots */}
          <div className="anim-fade-up stagger-5 mt-5 flex items-center gap-3">
            <Button variant="ghost-light" size="icon" aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost-light" size="icon" aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="h-1.5 w-6 rounded-full bg-brand-500 shadow-[0_0_6px_rgba(47,123,255,0.8)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/18" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/18" />
            </div>
          </div>

          {/* Stats strip */}
          <div className="anim-fade-up stagger-6 mt-12 w-fit">
            <div className="flex flex-wrap items-stretch rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm overflow-hidden divide-x divide-white/[0.08]">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="group/stat flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.06] transition-colors duration-300 cursor-default"
                >
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand-500/15 border border-brand-500/20 group-hover/stat:bg-brand-500/25 transition-colors duration-300">
                    <Icon className="h-3.5 w-3.5 text-brand-400" />
                  </span>
                  <div>
                    <div className="text-[17px] font-semibold leading-tight tracking-tight">{value}</div>
                    <div className="text-[11px] text-white/38 mt-px">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Ticker bar ── */}
      <div className="relative border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-sm py-3 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-ink-950 to-transparent z-10 pointer-events-none" />
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 px-6 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35 whitespace-nowrap">
              <span className="h-1 w-1 rounded-full bg-brand-500/60" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

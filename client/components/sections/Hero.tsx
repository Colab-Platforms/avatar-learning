import Link from "next/link";
import {
  ArrowRight,
  Users,
  ClipboardList,
  Briefcase,
  Award,
} from "lucide-react";
import { Button, CyclingText } from "@/components/ui";

const HERO_GRADIENT_STYLE = {
  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};

const CARDS = [
  {
    title: "AI-Powered Assessment",
    description:
      "Data-backed insights into your strengths, skills, and best-fit careers.",
  },
  {
    title: "Career Counselling",
    description:
      "1-on-1 guidance from experts to map out the right career path for you.",
  },

  {
    title: "Guaranteed Internships",
    description:
      "Hands-on industry internships that turn learning into real experience.",
  },
  {
    title: "Job Placement Support",
    description:
      "Get connected with 500+ hiring partners and land your first role.",
  },
];

export function Hero() {
  return (
    <section className="relative bg-white pt-6 pb-20 overflow-hidden">
      {/* Light gradient hero container */}
      <div className="mx-4 md:mx-6 lg:mx-8 bg-gradient-to-br from-brand-50/50 via-white to-brand-100/50 rounded-[32px] pt-16 pb-44 px-6 md:px-16 relative overflow-hidden flex flex-col items-start border border-brand-100/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-300/20 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-300/20 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 translate-y-1/2" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Column (Text) */}
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div className="anim-fade-up flex">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-200 text-brand-700 text-xs font-semibold tracking-wider shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                THE DIRECT2HIRE PROGRAM
              </span>
            </div>

            {/* Heading */}
            <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.15] anim-fade-up stagger-1">
              From Confusion
              <br />
              to Career.
              <br />
              <span className="inline-flex items-baseline flex-wrap">
                <span style={HERO_GRADIENT_STYLE}>Get&nbsp;</span>
                <CyclingText
                  words={[
                    "Direct2Hire",
                    "AI Counselling",
                    "AI Learning",
                    "Internship",
                    "Placement",
                  ]}
                  style={HERO_GRADIENT_STYLE}
                />
                <span style={HERO_GRADIENT_STYLE}>.</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-xl text-lg text-slate-600 leading-relaxed anim-fade-up stagger-2">
              Counselling, AI-powered assessment, skill-building, internships,
              and placement support — one program that takes you from learning
              to earning.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4 anim-fade-up stagger-3">
              <Link href="/direct2hire">
                <Button
                  variant="primary"
                  size="lg"
                  className="h-14 px-8 text-base font-semibold shadow-lg shadow-brand-500/25 rounded-xl"
                >
                  Explore Direct2Hire
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/quiz">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 text-base font-semibold border-brand-200 text-brand-700 hover:bg-brand-50 rounded-xl transition-all bg-white"
                >
                  Take 2-min Career Quiz
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center gap-4 text-sm text-slate-600 anim-fade-up stagger-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative shadow-sm"
                  >
                    <img
                      src={`https://i.pravatar.cc/100?img=${i + 15}`}
                      alt="Student"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="font-medium tracking-wide">
                10,000+ Students Guided to a Career
              </span>
            </div>
          </div>

          {/* Right Column (Visuals) */}
          <div className="relative w-full h-full min-h-[350px] sm:min-h-[450px] lg:min-h-[550px] anim-fade-up stagger-3 hidden lg:flex items-center justify-center">
            {/* Main Video Animation */}
            <div className="relative w-[85%] rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-10 bg-white border border-white/50">
              <video
                src="/landing-vid/pencil-animation.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-contain scale-[1.02]"
                style={{ mixBlendMode: "darken" }}
              />
            </div>

            {/* Decorative element behind */}
            <div className="absolute top-[10%] right-[5%] w-32 h-32 bg-brand-400/20 rounded-full blur-[50px] z-0" />
          </div>
        </div>
      </div>

      {/* Overlapping Cards */}
      <div className="container-x relative z-20 -mt-28 md:-mt-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((card, idx) => (
            <Link
              href="/direct2hire"
              key={card.title}
              className={`group bg-white rounded-[24px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border-2 border-brand-100 anim-fade-up hover:-translate-y-2 hover:border-brand-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-300 relative z-30`}
              style={{ animationDelay: `${200 + idx * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 mb-6 flex items-center justify-center border border-brand-100/50 text-brand-600 group-hover:bg-brand-100 transition-colors duration-300">
                {idx === 0 && <Users className="w-6 h-6" />}
                {idx === 1 && <ClipboardList className="w-6 h-6" />}
                {idx === 2 && <Briefcase className="w-6 h-6" />}
                {idx === 3 && <Award className="w-6 h-6" />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">
                {card.title}
              </h3>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-4">
                {card.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-600">
                Learn more
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

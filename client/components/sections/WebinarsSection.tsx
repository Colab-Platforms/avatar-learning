import Link from "next/link";
import { CalendarPlus, CheckCircle2, Circle } from "lucide-react";
import { ScrollReveal } from "@/components/ui";
import { WEBINARS, WEBINARS_SECTION } from "@/data/webinars";

export function WebinarsSection() {
  return (
    <section className="relative bg-ink-950 py-16 overflow-hidden">
      {/* Top divider */}
      <div className="absolute top-0 inset-x-0 divider-glow" />

      {/* Subtle ambient orb */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none opacity-[0.07]"
        style={{
          background: "radial-gradient(ellipse, #00C8FF 0%, transparent 65%)",
          filter: "blur(100px)",
        }}
      />

      <div className="relative container-x">
        {/* ── Section header ── */}
        <ScrollReveal animation="fade-up" duration={600}>
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-brand-400 mb-3">
            {WEBINARS_SECTION.eyebrow}
          </p>
          <h2 className="text-[36px] sm:text-[46px] font-semibold tracking-tight text-white leading-[1.1]">
            {WEBINARS_SECTION.heading}
          </h2>
          <p className="mt-4 max-w-xl text-[15px] text-white/42 leading-[1.85]">
            {WEBINARS_SECTION.description}
          </p>
        </ScrollReveal>

        {/* ── Cards grid ── */}
        <div className="mt-12 grid sm:grid-cols-2 gap-5">
          {WEBINARS.map((webinar, i) => (
            <ScrollReveal
              key={webinar.id}
              animation="fade-up"
              delay={i * 80}
              duration={600}
            >
              <WebinarCard webinar={webinar} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WebinarCard({
  webinar,
}: {
  webinar: import("@/data/webinars").Webinar;
}) {
  return (
    <div
      className="group relative flex flex-col rounded-2xl border border-white/8 bg-ink-800
                  overflow-hidden transition-all duration-350
                  hover:border-brand-500/25 hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,200,255,0.08)]"
      style={{ boxShadow: "0 8px 32px -8px rgba(0,0,0,0.4)" }}
    >
      {/* Hover top glow line */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

      <div className="flex flex-col flex-1 p-6 sm:p-7 gap-5">
        {/* Top row: FREE badge + date/time */}
        <div className="flex items-start justify-between gap-3">
          {webinar.free && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-[11px] font-semibold text-brand-300 tracking-wide">
              FREE
            </span>
          )}
          {/* <div className="ml-auto text-right shrink-0">
            <p className="text-[13px] font-semibold text-white/80">
              {webinar.date}
            </p>
            <p className="text-[12px] text-white/35 mt-0.5">{webinar.time}</p>
          </div> */}
        </div>

        {/* Title */}
        <h3 className="text-[20px] sm:text-[22px] font-semibold leading-snug text-white group-hover:text-brand-100 transition-colors duration-300">
          {webinar.title}
        </h3>

        {/* What you'll learn */}
        <div>
          <p className="text-[12px] font-semibold text-white/40 uppercase tracking-[0.14em] mb-3">
            What you'll learn:
          </p>
          <ul className="flex flex-col gap-2">
            {webinar.learns.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 h-[7px] w-[7px] rounded-full bg-brand-500/70 mt-[5px]" />
                <span className="text-[13px] text-white/55 leading-snug">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* CTA buttons */}
        <div className="flex gap-3 pt-1">
          <button
            disabled
            className="flex-1 py-3 rounded-xl bg-brand-600 text-ink-950 text-[14px] font-semibold text-center
                       transition-all duration-200 cursor-not-allowed
                       shadow-[0_4px_16px_rgba(0,200,255,0.28)] "
          >
            Coming Soon
          </button>
          {/* <button
            disabled
            className="flex-1 py-3 rounded-xl cursor-not-allowed border border-white/12 bg-white/4 text-white/70 text-[14px] font-medium text-center
                       transition-all duration-200 inline-flex items-center justify-center gap-2"
          >
            <CalendarPlus className="h-3.5 w-3.5 shrink-0" />
            Add to Calendar
          </button> */}
        </div>

        {/* Certificate indicator */}
        <div className="flex items-center gap-2 pt-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-[12px] text-emerald-400/80">
            {WEBINARS_SECTION.certificateLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

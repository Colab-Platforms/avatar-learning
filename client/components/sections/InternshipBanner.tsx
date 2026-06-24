import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Briefcase } from "lucide-react";
import { Button, ScrollReveal } from "@/components/ui";
import { INTERNSHIP_BANNER } from "@/data/internship";

export function InternshipBanner() {
  return (
    <section className="relative bg-ink-900 overflow-hidden">
      <div className="absolute top-0 inset-x-0 divider-glow z-10" />
      <div className="absolute bottom-0 inset-x-0 divider-glow z-10" />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 15% 50%, rgba(0,128,255,0.10) 0%, transparent 60%)" }}
      />
      <div className="absolute inset-0 line-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:min-h-[520px]">
        {/* Text */}
        <div className="relative z-10 flex flex-1 items-center sm:ml-80">
          <div className="container-x w-full py-16 sm:py-20 lg:py-24 lg:pr-8">
            <ScrollReveal animation="fade-up" duration={700}>
              <p className="eyebrow eyebrow-dark mb-5">
                <Briefcase className="h-3.5 w-3.5" />
                {INTERNSHIP_BANNER.eyebrow}
              </p>

              <h3 className="h-display max-w-xl text-white">
                {INTERNSHIP_BANNER.heading.split("\n").map((line, i, arr) => (
                  <span key={i}>
                    {i === arr.length - 1 ? (
                      <span className="text-gradient-brand">{line}</span>
                    ) : (
                      <span>{line}</span>
                    )}
                    {i < arr.length - 1 && <br />}
                  </span>
                ))}
              </h3>

              <p className="mt-6 max-w-lg text-[15px] text-white/45 leading-[1.85]">
                {INTERNSHIP_BANNER.description}
              </p>

              <Link href="#learning">
                <Button variant="primary" size="md" className="mt-9 group/btn btn-glow">
                  {INTERNSHIP_BANNER.ctaLabel}
                  <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-250" />
                </Button>
              </Link>
            </ScrollReveal>
          </div>
        </div>

        {/* Image — full bleed on desktop */}
        <div className="relative w-full lg:w-[48%] xl:w-[44%] shrink-0 min-h-[320px] sm:min-h-[380px] lg:min-h-0">
          <Image
            src={INTERNSHIP_BANNER.image}
            alt="Internship pathway from learning to real-world projects"
            fill
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="object-cover object-center"
            priority={false}
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-ink-900/20 to-transparent lg:hidden" />
          <div className="absolute inset-0 bg-linear-to-r from-ink-900 via-ink-900/55 to-transparent lg:via-ink-900/25" />
        </div>
      </div>
    </section>
  );
}

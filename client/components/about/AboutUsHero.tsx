'use client';

import { useInView } from '@/hooks/useInView';

export default function AboutUsHero() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Hero Image */}
          <div className={`relative transition-all duration-800 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
              alt="Avatar Team"
              className="rounded-2xl shadow-xl w-full object-cover h-[480px]"
            />
            <div className="absolute -bottom-5 -right-5 bg-white rounded-xl shadow-lg p-5 border border-avatar-light/60 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-avatar-accent rounded-xl flex items-center justify-center">
                  <i className="fas fa-globe text-white text-lg" />
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-avatar-dark">
                    35+
                  </p>
                  <p className="text-xs text-avatar-steel">Countries Reached</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -left-4 bg-avatar-dark text-white rounded-xl shadow-lg px-5 py-3 hidden md:block">
              <p className="font-display font-bold text-lg">Since 2026</p>
              <p className="text-xs text-avatar-silver">Building AI Future</p>
            </div>
          </div>

          {/* Hero Text Content */}
          <div className={`transition-all duration-800 delay-200 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <span className="text-xs font-semibold uppercase tracking-widest text-avatar-accent mb-4 inline-block">
              Who We Are
            </span>
            <h1 className="font-display text-3xl lg:text-5xl font-bold text-avatar-dark mb-6 leading-tight">
              Powering the AI Revolution —{" "}
              <span className="text-avatar-accent">For Everyone</span>
            </h1>
            <p className="text-avatar-slate leading-relaxed mb-5 text-base">
              Avatar is a next-generation AI ecosystem built to democratize
              artificial intelligence for individuals, businesses, and
              enterprises worldwide. We believe AI is not just a tool — it&apos;s
              a fundamental shift in how humans work, learn, and innovate.
            </p>
            <p className="text-avatar-slate leading-relaxed mb-5 text-base">
              Founded with the vision of making AI accessible to all, Avatar
              brings together education, automation, SaaS products, talent
              networks, and cutting-edge research under one unified platform.
              From students taking their first AI course to Fortune 500
              companies deploying enterprise-grade AI infrastructure, we serve
              every level of the AI adoption journey.
            </p>
            <p className="text-avatar-slate leading-relaxed mb-8 text-base">
              Our team of AI researchers, engineers, educators, and industry
              experts work tirelessly to build solutions that are practical,
              scalable, and transformative. We don&apos;t just talk about the
              future of AI — we build it, every single day.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#cta"
                className="inline-flex items-center justify-center gap-2 bg-avatar-dark text-white font-semibold px-7 py-3 rounded-full hover:bg-avatar-navy transition-colors text-sm"
              >
                Get Started
                <i className="fas fa-arrow-right text-xs" />
              </a>
              <a
                href="#vision-mission"
                className="inline-flex items-center justify-center gap-2 border border-avatar-silver text-avatar-dark font-medium px-7 py-3 rounded-full hover:bg-avatar-ice transition-colors text-sm"
              >
                Our Vision
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

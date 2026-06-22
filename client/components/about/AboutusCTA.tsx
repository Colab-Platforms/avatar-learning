'use client';

import { useInView } from '@/hooks/useInView';

export default function AboutusCTA() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-avatar-ice" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className={`relative bg-avatar-dark rounded-3xl overflow-hidden transition-all duration-800 ${isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Background Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80"
            alt="CTA Background"
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-avatar-deep/95 via-avatar-dark/85 to-avatar-dark/70" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center p-10 lg:p-16">
            <div className={`transition-all duration-800 delay-200 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <span className="text-xs font-semibold uppercase tracking-widest text-avatar-steel mb-4 inline-block">
                Join Us
              </span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-5 leading-tight">
                Ready to Build Your AI Future?
              </h2>
              <p className="text-avatar-silver leading-relaxed mb-8">
                Whether you want to learn AI, automate your business, deploy
                AI agents, or build enterprise AI infrastructure — Avatar is
                your one-stop platform. Join thousands of individuals and
                businesses already building their AI future.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#cta"
                  className="inline-flex items-center justify-center gap-2 bg-white text-avatar-dark font-semibold px-8 py-3.5 rounded-full hover:bg-avatar-ice transition-colors text-sm"
                >
                  Get Started Free
                  <i className="fas fa-arrow-right text-xs" />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 border border-white/25 text-white font-medium px-8 py-3.5 rounded-full hover:bg-white/10 transition-colors text-sm"
                >
                  Talk to Our Team
                </a>
              </div>
              <p className="text-xs text-avatar-steel mt-5">
                No credit card required · Free tier available · Cancel anytime
              </p>
            </div>
            <div className={`hidden lg:block transition-all duration-800 delay-400 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80"
                alt="Team using AI"
                className="rounded-2xl shadow-2xl w-full h-[360px] object-cover border border-white/10"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

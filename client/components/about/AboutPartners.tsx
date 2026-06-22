'use client';

import { useInView } from '@/hooks/useInView';


type Partner = { name: string; icon: string };

const partners: Partner[] = [
  { name: "Google Cloud", icon: "fab fa-google" },
  { name: "Microsoft Azure", icon: "fab fa-microsoft" },
  { name: "AWS", icon: "fab fa-aws" },
  { name: "NVIDIA", icon: "fas fa-brain" },
  { name: "Intel", icon: "fas fa-microchip" },
  { name: "IBM Watson", icon: "fab fa-ibm" },
  { name: "Snowflake", icon: "fas fa-database" },
  { name: "Salesforce", icon: "fas fa-cloud" },
  { name: "UiPath", icon: "fas fa-robot" },
  { name: "GitHub", icon: "fas fa-code" },
  { name: "Cisco", icon: "fas fa-network-wired" },
  { name: "Palo Alto", icon: "fas fa-shield-alt" },
];





export default function AboutPartners() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-avatar-ice" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center max-w-2xl mx-auto mb-14 transition-all duration-800 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="text-xs font-semibold uppercase tracking-widest text-avatar-accent mb-4 inline-block">
            Our Partners
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-avatar-dark mb-4">
            Trusted by Industry Leaders
          </h2>
          <p className="text-avatar-slate leading-relaxed">
            We collaborate with world-class organizations to deliver
            cutting-edge AI solutions, research, and education.
          </p>
        </div>

        {/* Partner Logos Grid */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-8 transition-all duration-800 delay-200 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          id="partnersGrid"
        >
          {partners.map((p) => (
            <div
              key={p.name}
              className="partner-logo bg-white rounded-2xl p-6 flex items-center justify-center border border-avatar-light/60 h-28"
            >
              <div className="text-center">
                <i className={`${p.icon} text-3xl text-avatar-slate mb-2`} />
                <p className="text-xs font-medium text-avatar-steel">
                  {p.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Partner CTA */}
        <div className={`text-center mt-12 transition-all duration-800 delay-400 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm text-avatar-slate mb-4">
            Interested in partnering with Avatar?
          </p>
          <a
            href="#cta"
            className="inline-flex items-center justify-center gap-2 bg-avatar-dark text-white font-semibold px-7 py-3 rounded-full hover:bg-avatar-navy transition-colors text-sm"
          >
            Become a Partner
            <i className="fas fa-arrow-right text-xs" />
          </a>
        </div>
      </div>
    </section>
  );
}

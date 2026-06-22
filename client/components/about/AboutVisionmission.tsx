'use client';

const visionPoints = [
  "Democratize AI access for everyone globally",
  "Build an AI-powered world where humans and machines collaborate seamlessly",
  "Pioneer responsible and ethical AI development",
];

const missionPoints = [
  "Deliver world-class AI education and certifications",
  "Build plug-and-play AI agents and SaaS products for businesses",
  "Connect AI talent with opportunities through our Talent Network",
  "Advance AI research for local, multilingual, and enterprise systems",
];

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-sm text-avatar-slate"
        >
          <span className="w-5 h-5 bg-avatar-accent/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <i className="fas fa-check text-avatar-accent text-[10px]" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}



import { useInView } from '@/hooks/useInView';

export default function AboutVisionmission() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-28 bg-white" id="vision-mission" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-800 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="text-xs font-semibold uppercase tracking-widest text-avatar-accent mb-4 inline-block">
            What Drives Us
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-avatar-dark mb-4">
            Vision &amp; Mission
          </h2>
          <p className="text-avatar-slate leading-relaxed">
            The principles that guide every product we build, every course we
            design, and every partnership we forge.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Vision */}
          <div className={`vm-card bg-avatar-ice rounded-2xl p-8 lg:p-10 border border-avatar-light/60 transition-all duration-800 delay-200 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="w-14 h-14 bg-avatar-accent/10 rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-eye text-avatar-accent text-xl" />
            </div>
            <h3 className="font-display text-2xl font-bold text-avatar-dark mb-4">
              Our Vision
            </h3>
            <p className="text-avatar-slate leading-relaxed mb-6">
              To become the world&apos;s most trusted and comprehensive AI
              ecosystem — a single platform where anyone, anywhere can learn,
              build, deploy, and scale artificial intelligence solutions that
              transform lives and businesses.
            </p>
            <p className="text-avatar-slate leading-relaxed mb-6">
              We envision a future where AI is not reserved for tech giants and
              researchers alone, but is accessible to freelancers, small
              businesses, students, and enterprises equally. A future where
              every individual has an AI co-pilot, and every organization runs
              on intelligent systems.
            </p>
            <CheckList items={visionPoints} />
          </div>

          {/* Mission */}
          <div className={`vm-card bg-avatar-ice rounded-2xl p-8 lg:p-10 border border-avatar-light/60 transition-all duration-800 delay-400 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="w-14 h-14 bg-avatar-accent/10 rounded-xl flex items-center justify-center mb-6">
              <i className="fas fa-bullseye text-avatar-accent text-xl" />
            </div>
            <h3 className="font-display text-2xl font-bold text-avatar-dark mb-4">
              Our Mission
            </h3>
            <p className="text-avatar-slate leading-relaxed mb-6">
              To empower individuals and organizations with practical, scalable
              AI tools and education — bridging the gap between AI innovation
              and real-world adoption. We build solutions that solve actual
              problems, not just theoretical ones.
            </p>
            <p className="text-avatar-slate leading-relaxed mb-6">
              Through our eight interconnected divisions — from AI Learning and
              Agent Marketplace to Enterprise Solutions and Talent Network — we
              provide end-to-end AI capabilities that grow with our users. Our
              mission is to make AI adoption frictionless, affordable, and
              impactful for all.
            </p>
            <CheckList items={missionPoints} />
          </div>
        </div>
      </div>
    </section>
  );
}

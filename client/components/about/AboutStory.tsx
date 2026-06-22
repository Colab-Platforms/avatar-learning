'use client';

import { useInView } from '@/hooks/useInView';

export default function AboutStory() {
  const { ref, isInView } = useInView();

  return (
    <section className="py-20 lg:py-24 bg-avatar-ice" ref={ref}>
      <div className={`max-w-4xl mx-auto px-6 lg:px-8 text-center transition-all duration-800 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <span className="text-xs font-semibold uppercase tracking-widest text-avatar-accent mb-4 inline-block">
          Our Story
        </span>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-avatar-dark mb-6 leading-tight">
          From a Simple Idea to a Global AI Ecosystem
        </h2>
        <p className="text-avatar-slate leading-relaxed mb-6 text-base">
          Avatar started with a simple but powerful question:{" "}
          <strong className="text-avatar-dark">
            What if anyone — regardless of background, budget, or technical
            expertise — could harness the power of AI?
          </strong>{" "}
          That question sparked a journey to build the most comprehensive AI
          platform in the world.
        </p>
        <p className="text-avatar-slate leading-relaxed text-base">
          Today, Avatar serves thousands of individuals, hundreds of
          businesses, and dozens of enterprise clients across 35+ countries.
          Our ecosystem spans AI education, intelligent automation, a
          marketplace of deployable AI agents, SaaS products, cloud workspaces,
          talent networks, and ongoing research &amp; innovation. And
          we&apos;re just getting started.
        </p>
      </div>
    </section>
  );
}

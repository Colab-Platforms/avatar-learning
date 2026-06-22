'use client';

import Link from "next/link";
import { useInView } from '@/hooks/useInView';

export default function Breadcrumb() {
  const { ref, isInView } = useInView();

  return (
    <section className="bg-avatar-ice border-b border-avatar-light/60" ref={ref}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm transition-all duration-800 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link href="/" className="breadcrumb-link flex items-center gap-1.5">
            <i className="fas fa-home text-xs" />
            Home
          </Link>
          <i className="fas fa-chevron-right text-[10px] text-avatar-steel" />
          <span className="text-avatar-accent font-medium">About Us</span>
        </nav>
      </div>
    </section>
  );
}

"use client";

import React from "react";
import { Clock3 } from "lucide-react";
import { ShinyText } from "@/components/ui";

// ── CUSTOM INLINE STICKERS ──

const StopwatchSticker = () => (
  <svg width="28" height="28" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mb-4">
    <rect x="15" y="1" width="4" height="4" rx="1" fill="#94A3B8" />
    <circle cx="17" cy="4" r="2.5" stroke="#94A3B8" strokeWidth="1.5" />
    <circle cx="17" cy="19" r="12" fill="url(#stopwatchBevel)" />
    <circle cx="17" cy="19" r="10.5" fill="#FFFFFF" />
    <circle cx="17" cy="19" r="9" stroke="#E2E8F0" strokeWidth="1" />
    <line x1="17" y1="10" x2="17" y2="12" stroke="#64748B" strokeWidth="1" />
    <line x1="17" y1="26" x2="17" y2="28" stroke="#64748B" strokeWidth="1" />
    <line x1="8" y1="19" x2="10" y2="19" stroke="#64748B" strokeWidth="1" />
    <line x1="24" y1="19" x2="26" y2="19" stroke="#64748B" strokeWidth="1" />
    <path d="M17 19V13.5" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M17 19L21.5 15.5" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="17" cy="19" r="1.5" fill="#334155" />
    <defs>
      <linearGradient id="stopwatchBevel" x1="5" y1="7" x2="29" y2="31" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E2E8F0" />
        <stop offset="0.5" stopColor="#CBD5E1" />
        <stop offset="1" stopColor="#94A3B8" />
      </linearGradient>
    </defs>
  </svg>
);

const TrendSticker = () => (
  <svg width="28" height="28" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mb-4">
    <rect x="3" y="5" width="28" height="24" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    <line x1="3" y1="11" x2="31" y2="11" stroke="#F1F5F9" strokeWidth="1" />
    <line x1="3" y1="17" x2="31" y2="17" stroke="#F1F5F9" strokeWidth="1" />
    <line x1="3" y1="23" x2="31" y2="23" stroke="#F1F5F9" strokeWidth="1" />
    <line x1="10" y1="5" x2="10" y2="29" stroke="#F1F5F9" strokeWidth="1" />
    <line x1="17" y1="5" x2="17" y2="29" stroke="#F1F5F9" strokeWidth="1" />
    <line x1="24" y1="5" x2="24" y2="29" stroke="#F1F5F9" strokeWidth="1" />
    <path d="M5 25L12 18L19 21L29 9" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 9H29V14" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PuzzleSticker = () => (
  <svg width="28" height="28" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mb-4">
    <path d="M21 9C21 7.34315 19.6569 6 18 6C16.3431 6 15 7.34315 15 9H9V15C7.34315 15 6 16.3431 6 18C6 19.6569 7.34315 21 9 21V27H15V25C15 26.6569 16.3431 28 18 28C19.6569 28 21 26.6569 21 25V27H27V21C28.6569 21 30 19.6569 30 18C30 16.3431 28.6569 15 27 15V9H21Z" fill="#22C55E" stroke="#15803D" strokeWidth="1" />
    <path d="M9 9H15C15 11 17 12 18 12C19 12 21 11 21 9H27V15C25 15 24 17 24 18C24 19 25 21 27 21V27H21V25C21 23 19 22 18 22C17 22 15 23 15 25V27H9V21C11 21 12 19 12 18C12 17 11 15 9 15V9Z" fill="#86EFAC" />
  </svg>
);

export default function AiGapSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-4">
          <Clock3 className="h-3.5 w-3.5 text-blue-600" />
          <ShinyText text="Why Now" color="#1d4ed8" shineColor="#93c5fd" speed={2.5} />
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-10 leading-snug">
          The AI gap is <span className="text-[#1E6BFA] italic font-black relative underline decoration-[#1E6BFA] decoration-[3px] underline-offset-6">widening weekly.</span>
        </h2>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#F4F6FA] rounded-2xl p-6 sm:p-8 hover:shadow-md transition-all duration-200 border-none flex flex-col justify-start">
            <StopwatchSticker />
            <h3 className="font-extrabold text-[#0F172A] text-base mb-2 leading-snug">
              Someone at your office is 3&times; faster
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              They finish in 20 minutes what still takes you three hours &mdash; using tools you already have access to.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#F4F6FA] rounded-2xl p-6 sm:p-8 hover:shadow-md transition-all duration-200 border-none flex flex-col justify-start">
            <TrendSticker />
            <h3 className="font-extrabold text-[#0F172A] text-base mb-2 leading-snug">
              Every time you wait, the gap grows
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              The people who started early keep pulling ahead. Catching up gets harder, not easier.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#F4F6FA] rounded-2xl p-6 sm:p-8 hover:shadow-md transition-all duration-200 border-none flex flex-col justify-start">
            <PuzzleSticker />
            <h3 className="font-extrabold text-[#0F172A] text-base mb-2 leading-snug">
              You don't need to code
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
              You need the right handful of tools and a simple method. That's exactly what this hour gives you.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

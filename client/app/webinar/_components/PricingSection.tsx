"use client";

import React from "react";

const pricingModules = [
  {
    part: "PART 1",
    title: "Choosing & using AI tools",
    originalPrice: "₹699",
    badgeStyle: "bg-[#FEF3C7] text-[#D97706]",
  },
  {
    part: "PART 2",
    title: "Prompt engineering that works",
    originalPrice: "₹899",
    badgeStyle: "bg-[#E0F2FE] text-[#0369A1]",
  },
  {
    part: "PART 3",
    title: "Automating your daily work",
    originalPrice: "₹999",
    badgeStyle: "bg-[#DCFCE7] text-[#15803D]",
  },
  {
    part: "PART 4",
    title: "AI for your career & job hunt",
    originalPrice: "₹499",
    badgeStyle: "bg-[#F3E8FF] text-[#6B21A8]",
  },
];

export default function PricingSection() {
  const scrollToForm = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      const input = document.getElementsByName("fullName")[0];
      if (input) (input as HTMLElement).focus();
    }, 800);
  };

  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Line separator */}
        <div className="flex items-center gap-4 mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1E6BFA] shrink-0">
            &sect; WHAT YOU GET
          </span>
          <div className="h-px bg-[#E2E8F0] w-full"></div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2 leading-snug">
          ₹3,000+ of training. <span className="text-[#1E6BFA] italic font-black relative underline decoration-[#1E6BFA] decoration-[3px] underline-offset-6">Yours for ₹7.</span>
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-2xl mb-10">
          What each part of the session would normally cost on its own. You learn all of it live for ₹7 &mdash; and walk away with a certificate of participation.
        </p>

        {/* 4 Cards Grid (2 columns on mobile, 4 columns on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {pricingModules.map((mod, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
            >
              <div>
                <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full w-fit block ${mod.badgeStyle}`}>
                  {mod.part}
                </span>
                <h3 className="font-extrabold text-[#0F172A] text-xs sm:text-sm md:text-base mt-4 mb-6 leading-snug">
                  {mod.title}
                </h3>
              </div>
              <div className="border-t border-gray-50 pt-3 flex items-baseline gap-1">
                <span className="text-slate-400 font-semibold text-[9px] sm:text-[10px] uppercase">Usually</span>
                <span className="text-lg sm:text-xl font-black text-[#0F172A]">{mod.originalPrice}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom highlighted package bar (Desktop / Mobile switcher) */}
        <div className="bg-[#0B1530] text-white rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden w-full">
          {/* Background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>

          {/* DESKTOP VIEW BANNER */}
          <div className="hidden md:flex items-center justify-between relative z-10">
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-white">
                Add it up &mdash; ₹3,096 of live training.
              </h4>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                You take home a certificate of participation &mdash; no other materials.
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">You pay just</span>
                <span className="text-2xl font-black text-[#10B981]">₹7</span>
              </div>
              <button
                onClick={scrollToForm}
                className="bg-[#1E6BFA] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-600/10 cursor-pointer"
              >
                Reserve my seat &middot; ₹7
              </button>
            </div>
          </div>

          {/* MOBILE VIEW BANNER */}
          <div className="block md:hidden text-center space-y-4 relative z-10">
            <h4 className="font-extrabold text-sm text-white">
              Add it up &mdash; ₹3,096 of training, yours for <span className="text-[#10B981]">just ₹7</span>
            </h4>
            <p className="text-slate-400 text-xs font-medium">
              You take home a certificate of participation &middot; no other materials
            </p>
            <button
              onClick={scrollToForm}
              className="w-full bg-[#1E6BFA] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              Reserve my seat &middot; ₹7
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}

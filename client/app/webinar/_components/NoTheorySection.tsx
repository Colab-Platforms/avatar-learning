"use client";

import React, { useState, useEffect } from "react";
import { Play, Layers, Presentation, BarChart } from "lucide-react";

export default function NoTheorySection() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Slide 1: Global AI Shift",
      icon: BarChart,
      bgColor: "bg-gradient-to-br from-indigo-900 to-slate-900",
      content: (
        <div className="flex flex-col justify-center h-full text-white p-6">
          <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mb-2">Market Growth</div>
          <h4 className="text-xl font-extrabold mb-3 leading-snug">AI adoption is up 250% this year</h4>
          <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
            <div className="bg-indigo-500 h-2 rounded-full w-[82%]"></div>
          </div>
          <p className="text-xs text-slate-300">
            82% of managers prioritize candidates with hands-on AI tools proficiency.
          </p>
        </div>
      ),
    },
    {
      title: "Slide 2: Workflow Automation",
      icon: Layers,
      bgColor: "bg-gradient-to-br from-blue-900 to-slate-900",
      content: (
        <div className="flex flex-col justify-center h-full text-white p-6">
          <div className="text-[10px] uppercase font-bold tracking-widest text-blue-400 mb-2">Work Efficiency</div>
          <h4 className="text-xl font-extrabold mb-2 leading-snug">Automate standard tasks in minutes</h4>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 mt-2">
            <li>Generate weekly email updates</li>
            <li>Summarize 40-page PDF reports</li>
            <li>Analyze spreadsheets automatically</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Slide 3: My AI Roadmap",
      icon: Presentation,
      bgColor: "bg-gradient-to-br from-emerald-900 to-slate-900",
      content: (
        <div className="flex flex-col justify-center h-full text-white p-6">
          <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 mb-2">Career Plan</div>
          <h4 className="text-xl font-extrabold mb-2 leading-snug">From absolute beginner to specialist</h4>
          <p className="text-xs text-slate-300 mb-2">
            A step-by-step career path utilizing prompt engineering and specialized AI agents.
          </p>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">Prompting</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">Automation</span>
          </div>
        </div>
      ),
    },
  ];

  // Auto transition slides
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-10 text-left">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1E6BFA]">
            &sect; NO THEORY
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            You'll watch it <span className="text-blue-600 font-extrabold">built live.</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">
            Real, practical outputs made in front of you &mdash; then you make your own.
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-150">
          
          {/* Left: Slideshow Mockup Preview */}
          <div className="lg:col-span-7 w-full flex flex-col items-center">
            {/* Main Interactive Screen */}
            <div className="w-full aspect-[16/10] bg-[#111] rounded-2xl overflow-hidden shadow-xl border border-white/10 relative group">
              {/* Active Slide Content */}
              <div className={`w-full h-full transition-all duration-500 ${slides[activeSlide].bgColor}`}>
                {slides[activeSlide].content}
              </div>

              {/* Live demo play overlay badge */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-[10px] font-bold text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                LIVE DEMO BUILDER
              </div>
            </div>

            {/* Slider Dots */}
            <div className="flex gap-2 mt-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    index === activeSlide ? "bg-blue-600 w-6" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Live Demo Details */}
          <div className="lg:col-span-5 flex flex-col justify-center text-left">
            <span className="inline-flex self-start items-center bg-blue-50 text-blue-600 text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase mb-4">
              LIVE DEMO
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4 leading-tight">
              A polished deck in 10 minutes
            </h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              No slides about slides. You'll watch a finished presentation built from a blank page in real time &mdash; then rebuild your own with the exact same prompts before the session ends.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import { Wrench } from "lucide-react";
import { ShinyText } from "@/components/ui";

const toolList = [
  {
    name: "ChatGPT",
    sub: "The all-rounder",
    image: "/webinar/chatgpt.png",
  },
  {
    name: "Claude",
    sub: "Best for Coding",
    image: "/webinar/claude.png",
  },
  {
    name: "Gemini",
    sub: "Inside your apps",
    image: "/webinar/gemini.png",
  },
  {
    name: "Perplexity",
    sub: "Answers w/ sources",
    image: "/webinar/perplexity.png",
  },
];

export default function HandsOnSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dark Navy Container */}
        <div className="bg-[#0B1530] text-white rounded-3xl p-8 sm:p-10 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            
            {/* Left Column: Title Block */}
            <div className="lg:col-span-5 text-center lg:text-left space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-blue-300 backdrop-blur-md">
                <Wrench className="h-3.5 w-3.5 text-blue-300" />
                <ShinyText text="Get Hands-On With" color="#93c5fd" shineColor="#ffffff" speed={2.5} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Real tools, <span className="text-white relative underline decoration-[#3B82F6] decoration-[3px] underline-offset-6">opened live.</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
                You won't just hear about AI &mdash; you'll open these in the session and try them yourself.
              </p>
            </div>

            {/* Right Column: Grid and Footer label */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* 2x2 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {toolList.map((tool, idx) => {
                  return (
                    <div
                      key={idx}
                      className="bg-white text-[#0F172A] rounded-2xl p-5 flex items-center gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-200"
                    >
                      <Image
                        src={tool.image}
                        alt={`${tool.name} Logo`}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 object-contain"
                        priority
                      />
                      <div className="flex flex-col">
                        <h3 className="font-extrabold text-[#0F172A] text-sm sm:text-base leading-snug">
                          {tool.name}
                        </h3>
                        <p className="text-slate-400 text-xs font-semibold mt-0.5">
                          {tool.sub}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Footer Text */}
              <div className="text-center sm:text-right text-[11px] text-slate-400 font-semibold tracking-wider pr-1">
                + Canva, Copilot & more
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

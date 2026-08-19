"use client";

import React from "react";
import { ListChecks } from "lucide-react";
import { ShinyText } from "@/components/ui";

const agendaItems = [
  {
    emoji: "🕑",
    title: "Tell the tools apart",
    description: "ChatGPT, Claude & Gemini — what each is best at, in plain words.",
  },
  {
    emoji: "✍️",
    title: "The prompt formula that works",
    description: "A repeatable structure for accurate, useful answers every time.",
  },
  {
    emoji: "⚡",
    title: "Automate your busywork",
    description: "Emails, notes, research and reports — done in minutes, not hours.",
  },
  {
    emoji: "⚒️",
    title: "Build something real",
    description: "Make a small working project during the session, start to finish.",
  },
  {
    emoji: "🎯",
    title: "AI for your job hunt",
    description: "Sharper resume, faster search, better interview prep.",
  },
  {
    emoji: "🚀",
    title: "Your roadmap from here",
    description: "A clear path from beginner to a real AI-driven role.",
  },
];

export default function AgendaSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-4">
          <ListChecks className="h-3.5 w-3.5 text-blue-600" />
          <ShinyText text="The 1-Hour Agenda" color="#1d4ed8" shineColor="#93c5fd" speed={2.5} />
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2 leading-snug">
          Exactly what we'll <span className="text-[#1E6BFA] font-black relative underline decoration-[#1E6BFA] decoration-[3px] underline-offset-6">cover live.</span>
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mb-10">
          Six things &mdash; each one you'll do yourself, not just watch.
        </p>

        {/* 6 Grid items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agendaItems.map((item, index) => {
            return (
              <div
                key={index}
                className="bg-white border border-[#E5E7EB] rounded-2xl p-5 hover:shadow-md transition-all duration-200 flex items-center gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
              >
                <div className="w-10 h-10 rounded-full bg-[#F0F4F8] flex items-center justify-center shrink-0 shadow-inner text-lg select-none">
                  {item.emoji}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-[#0F172A] text-[15px] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

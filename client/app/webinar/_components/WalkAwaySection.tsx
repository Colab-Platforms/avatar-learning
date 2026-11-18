"use client";

import React from "react";
import { Check, Target, Users } from "lucide-react";
import { ShinyText } from "@/components/ui";

const checkList = [
  "Pick the right AI tool for the task in front of you",
  "Write prompts that get accurate, useful answers",
  "Automate repetitive work in minutes",
  "Turn long documents and data into clear decisions",
  "Sharpen your resume and prep for interviews with AI",
  "Follow a clear roadmap toward an AI-driven role",
];

const audienceBadges = [
  { label: "Students", style: "bg-blue-50 text-blue-700 border-blue-100" },
  { label: "Professionals", style: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { label: "Career switchers", style: "bg-amber-50 text-amber-700 border-amber-100" },
  { label: "Job seekers", style: "bg-rose-50 text-rose-700 border-rose-100" },
  { label: "Managers", style: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  { label: "Sales & marketing", style: "bg-teal-50 text-teal-700 border-teal-100" },
  { label: "Non-tech folks", style: "bg-violet-50 text-violet-700 border-violet-100" },
  { label: "Simply curious", style: "bg-gray-50 text-gray-700 border-gray-150" },
];

export default function WalkAwaySection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left Side: Checklist */}
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md">
              <Target className="h-3.5 w-3.5 text-blue-600" />
              <ShinyText text="What You'll Walk Away With" color="#1d4ed8" shineColor="#93c5fd" speed={2.5} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4 mb-6">
              Walk out able to <span className="text-blue-600">do this.</span>
            </h2>

            <ul className="space-y-4">
              {checkList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-gray-700 text-sm sm:text-base leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side: Who It's For */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md w-fit">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              <ShinyText text="Who It's For" color="#1d4ed8" shineColor="#93c5fd" speed={2.5} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4 mb-4">
              If you can use a browser, <span className="text-gray-400 font-medium italic">you're ready.</span>
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              No technical backgrounds required. If you know how to search and navigate, you can easily grasp these concepts.
            </p>

            {/* Badges Cloud */}
            <div className="flex flex-wrap gap-2.5">
              {audienceBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className={`inline-block px-4 py-2 rounded-full text-xs font-semibold border ${badge.style}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

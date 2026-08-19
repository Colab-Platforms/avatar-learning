"use client";

import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { ShinyText } from "@/components/ui";

const testimonials = [
  {
    quote:
      "Avatar India helped me build practical AI skills and prepare for interviews. Today I'm working as a Social Media Executive.",
    name: "Harshita Dhare",
    role: "Social Media Executive",
    image: "/landingpage-images/student-2.png",
  },
  {
    quote:
      "I never imagined AI could make such a difference. I automate the boring parts of my job now &mdash; and got a raise soon after.",
    name: "Amit S.",
    role: "Senior Analyst",
    image: "/landingpage-images/student-1.png",
  },
];

export default function SuccessStories() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-8">
          <Star className="h-3.5 w-3.5 text-blue-600" />
          <ShinyText text="Success Stories" color="#1d4ed8" shineColor="#93c5fd" speed={2.5} />
        </div>

        {/* Grid of Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="bg-[#F4F6FA] rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-all duration-200"
            >
              {/* Text quote */}
              <p
                className="text-[#0F172A] font-semibold text-sm sm:text-base leading-relaxed mb-6"
                dangerouslySetInnerHTML={{ __html: `"${test.quote}"` }}
              />

              {/* User credentials */}
              <div className="flex items-center gap-3 mt-auto">
                {/* Profile Photo */}
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/50 relative shadow-sm">
                  <Image
                    src={test.image}
                    alt={`${test.name} Avatar`}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="flex flex-col">
                  <h4 className="font-extrabold text-[#0F172A] text-xs sm:text-sm leading-snug">
                    {test.name}
                  </h4>
                  <p className="text-slate-400 text-[11px] sm:text-xs font-semibold mt-0.5">
                    {test.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

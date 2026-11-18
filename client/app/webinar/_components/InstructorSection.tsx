"use client";

import React from "react";
import { UserCheck, Award, MessageCircle } from "lucide-react";

export default function InstructorSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dark Box Container */}
        <div className="bg-[#0B0F19] text-white rounded-3xl p-6 sm:p-10 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left: Instructor Photo/Avatar Mockup */}
            <div className="md:col-span-4 flex justify-center w-full">
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-gradient-to-tr from-[#1E6BFA] to-indigo-800 rounded-2xl p-1 shadow-2xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                {/* Silhouette or vector style avatar */}
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 mx-auto flex items-center justify-center text-3xl font-extrabold text-white tracking-widest shadow-inner mb-3">
                    R
                  </div>
                  <div className="text-xs uppercase font-bold tracking-[0.2em] text-blue-300">
                    RANJAN
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">
                    Lead AI Mentor
                  </div>
                </div>

                {/* Micro badge indicator */}
                <div className="absolute bottom-3 right-3 bg-green-500/20 text-green-400 text-[8px] font-bold px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-400 rounded-full animate-ping"></span>
                  ONLINE
                </div>
              </div>
            </div>

            {/* Right: Bio & Quote details */}
            <div className="md:col-span-8 space-y-5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">
                YOUR INSTRUCTOR
              </span>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Meet Ranjan
              </h2>

              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Ranjan is the Lead AI Mentor at{" "}
                <span className="font-semibold text-white">Avatar India</span>,
                an NSE-listed company. He's taught AI to people who'd never
                touched it &mdash; in college classrooms, in offices, and
                one-on-one &mdash; and has walked plenty of them all the way
                into their first AI-driven job.
              </p>

              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                He keeps it refreshingly simple. No jargon, no lectures &mdash;
                just the handful of things that genuinely move the needle for a
                beginner.
              </p>

              {/* Highlighting Quote at bottom */}
              <div className="border-l-4 border-[#1E6BFA] pl-4 py-1.5 bg-white/5 rounded-r-lg">
                <p className="text-sm font-semibold italic text-blue-200">
                  "I don't teach theory. I teach what a complete beginner can
                  use the same day."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

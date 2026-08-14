"use client";

import React from "react";
import Image from "next/image";
import { Award } from "lucide-react";

export default function CertificateSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Certificate (renders 2nd on mobile, 1st on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
            {/* Header with Line separator */}
            <div className="flex items-center gap-4 mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#1E6BFA] shrink-0">
                &sect; CERTIFICATE
              </span>
              <div className="h-px bg-[#E2E8F0] w-full"></div>
            </div>

            {/* Heading */}
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-snug">
              A certificate you can{" "}
              <span className="text-[#1E6BFA] italic font-black relative underline decoration-[#1E6BFA] decoration-[3px] underline-offset-6">
                actually use.
              </span>
            </h2>

            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
              Attend the full session and get an Avatar India certificate of
              participation &mdash; shareable, and built to boost your profile.
            </p>

            {/* Certificate CSS Mockup */}
            <div className="w-full border border-[#E5E7EB] bg-[#F8FAFC] rounded-2xl p-4 sm:p-6 flex items-center justify-center shadow-inner">
              {/* High-fidelity layout */}
              <div className="w-full aspect-[1.414/1] bg-white border-[10px] sm:border-[12px] border-[#1C3A63] rounded-lg shadow-lg p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                {/* Outer border line */}
                <div className="absolute inset-1.5 sm:inset-2 border border-amber-500/20 pointer-events-none"></div>

                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-500/30"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-500/30"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-500/30"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-500/30"></div>

                {/* Header (With integrated Avatar dark logo) */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <Image
                    src="/landingpage-images/Avatar_dark_logo.png"
                    alt="Avatar Logo"
                    width={80}
                    height={20}
                    className="h-7 sm:h-9 w-auto object-contain"
                    priority
                  />
                  <div className="text-[7px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 leading-none">
                    NSE-LISTED COMPANY
                  </div>
                  {/* <div className="flex flex-col text-left">
                    {/* <div className="text-[#1C3A63] text-[8px] sm:text-[9px] font-black tracking-[0.2em] uppercase leading-none">
                      AVATAR INDIA
                    </div> */}

                  {/* </div> */}
                </div>

                {/* Certificate Core Content */}
                <div className="text-center my-auto">
                  <div className="text-amber-600 font-serif text-[9px] sm:text-[10px] tracking-wide italic mb-1.5">
                    Certificate of Participation
                  </div>
                  <div className="text-[7px] text-gray-500 uppercase tracking-widest mb-1">
                    PROUDLY PRESENTED TO
                  </div>
                  <div className="text-gray-900 font-serif font-bold text-sm sm:text-base border-b border-gray-200 pb-1 max-w-[200px] sm:max-w-[260px] mx-auto italic mb-1.5">
                    [Your Name Here]
                  </div>
                  <p className="text-[7px] sm:text-[8px] text-gray-500 max-w-[320px] mx-auto leading-relaxed">
                    for successfully participating in the live 1-hour workshop
                    on
                    <span className="font-semibold text-gray-800">
                      {" "}
                      Use AI Tools to Unlock Better Jobs, Higher Pay & Job
                      Security
                    </span>
                    .
                  </p>
                </div>

                {/* Footer Signature & Seal Row */}
                <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                  {/* Left: Signature */}
                  <div className="text-left">
                    <div className="font-serif text-[9px] sm:text-[10px] italic text-[#1C3A63] leading-none">
                      Ranjan
                    </div>
                    <div className="w-12 sm:w-16 border-b border-gray-300 my-1"></div>
                    <div className="text-[6px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                      Lead AI Mentor
                    </div>
                  </div>

                  {/* Middle: Golden Seal */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500 border-2 border-dashed border-amber-600 flex items-center justify-center shadow-inner">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-1.5 -left-0.5 w-2 h-4.5 bg-amber-600 origin-top rotate-12 -z-10 rounded-b-xs"></div>
                    <div className="absolute -bottom-1.5 -right-0.5 w-2 h-4.5 bg-amber-600 origin-top -rotate-12 -z-10 rounded-b-xs"></div>
                  </div>

                  {/* Right: ID code */}
                  <div className="text-right">
                    <div className="text-[#1C3A63] text-[7px] sm:text-[8px] font-black tracking-wider leading-none">
                      AVATAR
                    </div>
                    <div className="text-[5px] text-gray-400 mt-1 leading-none">
                      Token: #AV-WEB-9831
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom side-by-side cards */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-[#F4F6FA] p-4 rounded-2xl flex flex-col justify-start">
                <h3 className="font-extrabold text-[#0F172A] text-[13px] sm:text-[14px] leading-snug">
                  Easily shareable
                </h3>
                <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
                  Add it to LinkedIn & your resume
                </p>
              </div>

              <div className="bg-[#F4F6FA] p-4 rounded-2xl flex flex-col justify-start">
                <h3 className="font-extrabold text-[#0F172A] text-[13px] sm:text-[14px] leading-snug">
                  Career-shifting
                </h3>
                <p className="text-slate-500 text-xs mt-1 font-medium leading-relaxed">
                  Verified proof of new skills
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Instructor Card (renders 1st on mobile, 2nd on desktop) */}
          <div className="order-1 lg:order-2 lg:col-span-5 bg-[#0B1530] text-white rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden w-full flex flex-col gap-6">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-blue-300">
              YOUR INSTRUCTOR
            </span>

            {/* Photo Placeholder Box */}
            <div className="w-full aspect-[4/3] rounded-2xl bg-[#131E37] flex items-center justify-center border border-white/10 relative overflow-hidden">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 mx-auto flex items-center justify-center text-2xl font-extrabold text-white tracking-widest shadow-inner mb-3">
                  R
                </div>
                <div className="text-[11px] uppercase font-bold tracking-[0.2em] text-blue-300">
                  RANJAN
                </div>
                <div className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider">
                  Lead AI Mentor
                </div>
              </div>
            </div>

            {/* Content info */}
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                Meet Ranjan
              </h2>

              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                Ranjan is the Lead AI Mentor at{" "}
                <span className="font-bold text-white">Avatar India</span>, an
                NSE-listed company. He's taught AI to people who'd never touched
                it &mdash; in college classrooms, in offices, and one-on-one
                &mdash; and has walked plenty of them all the way into their
                first AI-driven job.
              </p>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                He keeps it refreshingly simple. No jargon, no lectures &mdash;
                just the handful of things that genuinely move the needle for a
                beginner.
              </p>
            </div>

            {/* Quote banner */}
            <div className="pt-2">
              <p className="text-xs sm:text-sm font-semibold italic text-blue-300 leading-relaxed">
                &ldquo;I don't teach theory. I teach what a complete beginner
                can use the same day.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

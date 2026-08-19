"use client";

import React from "react";
import Image from "next/image";
import { Award } from "lucide-react";
import { ShinyText } from "@/components/ui";

export default function CertificateSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Certificate (renders 2nd on mobile, 1st on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
            {/* Header */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-200 bg-white/80 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3">
              <Award className="h-3.5 w-3.5 text-blue-600" />
              <ShinyText text="Certificate" color="#1d4ed8" shineColor="#93c5fd" speed={2.5} />
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

            {/* Certificate Image */}
            <div className="w-full border border-[#E5E7EB] bg-[#F8FAFC] rounded-2xl p-4 sm:p-6 flex items-center justify-center shadow-inner">
              <div className="w-full relative aspect-[1045/740] rounded-lg shadow-lg overflow-hidden">
                <Image
                  src="/webinar/certificate.png"
                  alt="Avatar India Certificate of Participation"
                  fill
                  className="object-contain"
                  priority
                />
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

            {/* Instructor Photo */}
            <div className="w-40 sm:w-48 aspect-[407/634] mx-auto rounded-2xl bg-[#131E37] relative overflow-hidden border border-white/10">
              <Image
                src="/webinar/instructor.png"
                alt="Ranjan, Lead AI Mentor"
                fill
                className="object-cover"
              />
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

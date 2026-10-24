"use client";

import React from "react";
import Image from "next/image";
import { Award } from "lucide-react";
import { ShinyText } from "@/components/ui";

export default function CertificateSection() {
  return (
    <section className="bg-white py-12 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Certificate, centred in a single column */}
        <div className="max-w-3xl mx-auto space-y-6 text-center">
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

          <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-xl mx-auto">
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
          <div className="grid grid-cols-2 gap-4 pt-2 text-left">
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
      </div>
    </section>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import RegistrationForm from "./RegistrationForm";

// ── CUSTOM INLINE STICKERS (NO LIBRARIES) ──

const CalendarSticker = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    {/* Page base drop shadow */}
    <rect x="2" y="6" width="30" height="25" rx="5" fill="#E2E8F0" />
    {/* Page main body */}
    <rect x="2" y="5" width="30" height="25" rx="5" fill="#FFFFFF" />
    {/* Red Top Header */}
    <path
      d="M2 10C2 7.23858 4.23858 5 7 5H27C29.7614 5 32 7.23858 32 10V12H2V10Z"
      fill="#C25350"
    />
    {/* Spiral Holes */}
    <circle cx="9" cy="5" r="2.2" fill="#E2E8F0" />
    <circle cx="9" cy="5" r="1.2" fill="#94A3B8" />
    <circle cx="25" cy="5" r="2.2" fill="#E2E8F0" />
    <circle cx="25" cy="5" r="1.2" fill="#94A3B8" />
    {/* "17" Text */}
    <text
      x="17"
      y="24"
      fill="#334155"
      fontSize="12"
      fontWeight="900"
      fontFamily="system-ui, sans-serif"
      textAnchor="middle"
    >
      17
    </text>
  </svg>
);

const ClockSticker = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    {/* Outer bevel ring (Silver-Grey) */}
    <circle cx="17" cy="17" r="14" fill="url(#silverBevel)" />
    <circle cx="17" cy="17" r="12" fill="#FFFFFF" />
    {/* Subtle shading */}
    <circle cx="17" cy="17" r="12" fill="url(#clockDialShade)" />
    {/* Clock Hands (10:10) */}
    <path
      d="M17 17L12 11"
      stroke="#334155"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M17 17L22 17"
      stroke="#334155"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Center Pin */}
    <circle cx="17" cy="17" r="2" fill="#C25350" />
    <defs>
      <linearGradient
        id="silverBevel"
        x1="3"
        y1="3"
        x2="31"
        y2="31"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#E2E8F0" />
        <stop offset="0.5" stopColor="#CBD5E1" />
        <stop offset="1" stopColor="#94A3B8" />
      </linearGradient>
      <radialGradient
        id="clockDialShade"
        cx="17"
        cy="17"
        r="12"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset="1" stopColor="#F1F5F9" />
      </radialGradient>
    </defs>
  </svg>
);

const VideoSticker = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    {/* Top left film reel */}
    <circle cx="11" cy="11" r="5" fill="#334155" />
    <circle cx="11" cy="11" r="2" fill="#E2E8F0" />
    {/* Top right film reel */}
    <circle cx="23" cy="11" r="5" fill="#334155" />
    <circle cx="23" cy="11" r="2" fill="#E2E8F0" />
    {/* Main Camera base body */}
    <rect x="6" y="15" width="20" height="12" rx="3.5" fill="#334155" />
    {/* Front lens cone */}
    <path d="M26 18L31 15.5V26.5L26 24V18Z" fill="#334155" />
    {/* Lens reflection/detail */}
    <path d="M31 17.5L30 18.5V23.5L31 24.5V17.5Z" fill="#E2E8F0" />
  </svg>
);

const CapSticker = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    {/* Mortarboard Tilted Cap Diamond */}
    <path
      d="M17 5L31 11L17 17L3 11L17 5Z"
      fill="#334155"
      stroke="#1E293B"
      strokeWidth="1"
    />
    {/* Inner diamond shadow */}
    <path d="M17 7L28 11L17 15L6 11L17 7Z" fill="#475569" />
    {/* Cap Headband base */}
    <path
      d="M9 16V20.5C9 22.5 12 24.5 17 24.5C22 24.5 25 22.5 25 20.5V16"
      fill="#334155"
      stroke="#1E293B"
      strokeWidth="1"
    />
    {/* Tassel (Orange/Gold) */}
    <path d="M17 11L25.5 14V19" stroke="#E2E8F0" strokeWidth="1" fill="none" />
    <path
      d="M25.5 14L27.5 15.5V19.5"
      stroke="#D97706"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Hanging Tassel Fringe */}
    <polygon points="26,19 29,19 27.5,23" fill="#D97706" />
  </svg>
);

const HourglassSticker = () => (
  <svg
    width="34"
    height="34"
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M8 5H26V7.5C26 12 20.5 16 17 17C20.5 18 26 22 26 26.5V29H8V26.5C8 22 13.5 18 17 17C13.5 16 8 12 8 7.5V5Z"
      fill="#FFFFFF"
      stroke="#334155"
      strokeWidth="2.2"
    />
    {/* Sand Top */}
    <path
      d="M10 7.5H24C24 11 20 13.5 17 13.5C14 13.5 10 11 10 7.5Z"
      fill="#D97706"
    />
    {/* Sand Bottom */}
    <path
      d="M13.5 19.5C13.5 19.5 10 22 10 26.5H24C24 22 20.5 19.5 20.5 19.5H13.5Z"
      fill="#D97706"
    />
    {/* Drip lines */}
    <circle cx="17" cy="15" r="1" fill="#D97706" />
    <circle cx="17" cy="18" r="1" fill="#D97706" />
    <circle cx="17" cy="21" r="1" fill="#D97706" />
  </svg>
);

export default function HeroSection() {
  return (
    <section className="bg-white py-10 sm:py-16 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Headline and details */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Live Badge */}
            <div className="inline-flex items-center gap-1.5 self-start bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
              Live Online Workshop
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-5">
              Use{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                AI tools
              </span>{" "}
              to unlock better jobs, higher pay & job security.
            </h1>

            {/* Sub-badge */}
            <div className="inline-block bg-[#F3F4F6] text-gray-700 text-xs sm:text-sm font-bold tracking-wider px-4 py-2 rounded-lg mb-6 self-start">
              NO PRIOR AI KNOWLEDGE OR EXPERIENCE NEEDED
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed mb-8">
              A hands-on 1-hour live session for complete beginners, use
              ChatGPT, Claude and more, and leave with a clear path to a real AI
              career.
            </p>

            {/* 4 Info Cards Grid - Desktop (Visible only on desktop/tablet) */}
            <div className="hidden sm:grid grid-cols-2 gap-4 mb-8">
              {/* Card 1 */}
              <div className="flex items-center gap-4 bg-white border border-[#E8EFF7] p-4.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <CalendarSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-sm">
                    Sun 23 Aug 2026
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    mark your calendar
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex items-center gap-4 bg-white border border-[#E8EFF7] p-4.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <ClockSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-sm">
                    11:30 AM IST
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">1 hour</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex items-center gap-4 bg-white border border-[#E8EFF7] p-4.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <VideoSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-sm">
                    Live on Meet
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    interactive
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="flex items-center gap-4 bg-white border border-[#E8EFF7] p-4.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <CapSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-sm">
                    Certificate
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    of participation
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Info Cards Grid - Mobile (Visible only on mobile) */}
            <div className="sm:hidden grid grid-cols-2 gap-3 mb-6">
              {/* Card 1 */}
              <div className="flex items-center gap-3 bg-white border border-[#E8EFF7] p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <CalendarSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-xs">
                    Sun 23 Aug
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">2026</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex items-center gap-3 bg-white border border-[#E8EFF7] p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <ClockSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-xs">11:30 AM</h4>
                  <p className="text-[10px] text-slate-400 font-medium">IST</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex items-center gap-3 bg-white border border-[#E8EFF7] p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <HourglassSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-xs">1 hours</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    hands-on
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="flex items-center gap-3 bg-white border border-[#E8EFF7] p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <VideoSticker />
                <div>
                  <h4 className="font-bold text-[#0F172A] text-xs">
                    Live on Meet
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    interactive
                  </p>
                </div>
              </div>
            </div>

            {/* Stats badges - Desktop (Visible only on desktop/tablet) */}
            <div className="hidden sm:flex gap-6 items-center text-xs font-semibold text-gray-600 border-t border-gray-100 pt-6 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-blue-600">
                  10K+
                </span>
                <span>learners trained</span>
              </div>
              <div className="h-4 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-blue-600">
                  96.3%
                </span>
                <span>placement rate</span>
              </div>
              <div className="h-4 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <Image
                  src="/nse-logo.png"
                  alt="NSE"
                  width={24}
                  height={12}
                  className="h-3 w-auto opacity-70"
                  onError={(e) => {
                    // Fallback to text if image isn't available
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="text-lg font-extrabold text-[#0D3B66]">
                  NSE-listed
                </span>
                <span>Avatar India</span>
              </div>
            </div>

            {/* Collage image - Desktop & Mobile */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 mb-8 sm:mb-0">
              <Image
                src="/webinar/hands_typing_ai.jpg"
                alt="AI Tools live workshop"
                width={800}
                height={400}
                className="w-full h-auto object-cover max-h-[360px]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </div>

          {/* Right Column: Registration Card on Desktop */}
          <div className="lg:col-span-5 lg:self-stretch">
            {/* The form card is shown inline here on desktop */}
            <div className="hidden lg:flex lg:sticky lg:top-24 w-full justify-center">
              <RegistrationForm />
            </div>
          </div>
        </div>

        {/* Mobile-only Stacked Form Card */}
        <div className="lg:hidden flex flex-col items-center mt-6">
          <RegistrationForm />
        </div>
      </div>

      {/* Social Proof Full-width Banner */}
      <div className="bg-[#F8FAFC] border-y border-[#E8EFF7] w-full py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
          {/* Overlapping Avatars stack */}
          <div className="flex -space-x-3.5 items-center shrink-0">
            <Image
              src="/landingpage-images/student-1.png"
              alt="Student 1"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border-2 border-white shadow-sm object-cover bg-slate-50"
            />
            <Image
              src="/landingpage-images/student-2.png"
              alt="Student 2"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border-2 border-white shadow-sm object-cover bg-slate-50"
            />
            <Image
              src="/landingpage-images/student-3.png"
              alt="Student 3"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border-2 border-white shadow-sm object-cover bg-slate-50"
            />
            <Image
              src="/landingpage-images/student-4.png"
              alt="Student 4"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full border-2 border-white shadow-sm object-cover bg-slate-50"
            />
            {/* Blue badge */}
            <div className="h-11 w-11 rounded-full bg-[#1E6BFA] border-2 border-white shadow-sm flex items-center justify-center text-white text-[11px] font-black tracking-tighter select-none z-10">
              +10k
            </div>
          </div>

          {/* Text block */}
          <div className="flex flex-col">
            <h3 className="font-extrabold text-[#1E293B] text-sm sm:text-base leading-snug">
              Join 10,000+ professionals already trained
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 font-semibold mt-0.5">
              Students, professionals and career switchers across India
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

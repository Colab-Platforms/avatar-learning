"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, Clock, Lock } from "lucide-react";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export default function FooterCtaSection() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: "09",
    hours: "18",
    minutes: "05",
    seconds: "53",
  });

  // Countdown timer calculation
  useEffect(() => {
    const calculateTimeLeft = () => {
      let targetDate = new Date("2026-08-23T11:30:00+05:30");
      const now = new Date();

      if (now > targetDate) {
        const nextSunday = new Date();
        nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
        nextSunday.setHours(11, 30, 0, 0);
        targetDate = nextSunday;
      }

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);

        setTimeLeft({
          days: d.toString().padStart(2, "0"),
          hours: h.toString().padStart(2, "0"),
          minutes: m.toString().padStart(2, "0"),
          seconds: s.toString().padStart(2, "0"),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const scrollToForm = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      const input = document.getElementsByName("fullName")[0];
      if (input) (input as HTMLElement).focus();
    }, 800);
  };

  return (
    <footer className="bg-[#0B0F19] text-white border-t border-white/5 relative overflow-hidden">
      
      {/* Accent glow blur backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-blue-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-20 text-center relative z-10">
        
        {/* Dynamic header tag */}
        <div className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-blue-300 mb-6">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
          Sun 23 Aug &middot; 11:30 AM IST &middot; 47 seats left
        </div>

        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4">
          Secure your seat before it's <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">gone.</span>
        </h2>

        {/* Subtitle */}
        <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
          One focused hour that could change how you work and where your career goes next.
        </p>

        {/* Timer display */}
        <div className="mb-8 bg-white/5 border border-white/5 rounded-xl px-5 py-3.5 inline-block">
          <div className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1.5">
            STARTS IN
          </div>
          <div className="font-extrabold text-base sm:text-xl text-white tracking-widest flex items-center justify-center gap-1.5">
            <span>{timeLeft.days}d</span>
            <span className="text-gray-600 font-normal">:</span>
            <span>{timeLeft.hours}h</span>
            <span className="text-gray-600 font-normal">:</span>
            <span>{timeLeft.minutes}m</span>
            <span className="text-gray-600 font-normal">:</span>
            <span>{timeLeft.seconds}s</span>
          </div>
        </div>

        {/* Reserve Button */}
        <div className="mb-8">
          <button
            onClick={scrollToForm}
            className="bg-[#1E6BFA] hover:bg-[#1554C7] text-white font-extrabold py-4 px-8 rounded-xl text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-lg transform hover:-translate-y-[1px] active:translate-y-0 w-full sm:w-auto"
          >
            Reserve my seat &middot; ₹7
          </button>
        </div>

        {/* Social Proof trust text */}
        <p className="text-gray-500 text-[10px] sm:text-xs flex items-center justify-center gap-1.5 flex-wrap">
          <span>Instant confirmation on WhatsApp</span>
          <span className="text-gray-700 hidden sm:inline">&middot;</span>
          <span>NSE-listed company trusted by 10,000+ students</span>
        </p>
      </div>

      {/* Under footer copyright bar */}
      <div className="bg-[#070A11] py-6 border-t border-white/5 text-center text-[10px] sm:text-xs text-gray-600">
        &copy; 2026 Avatar India. All rights reserved.
      </div>
    </footer>
  );
}

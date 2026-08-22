"use client";

import React, { useState, useEffect } from "react";
import { useWebinarLiveSchedule } from "@/hooks/queries/useWebinarLiveSchedule";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export default function StickyBottomBar() {
  const { data: schedule } = useWebinarLiveSchedule();
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // Handle scroll trigger visibility
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past 500px (hero section height)
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Countdown to the currently published/live webinar's date.
  useEffect(() => {
    if (!schedule) return;

    const targetDate = new Date(schedule.scheduledAt);

    const calculateTimeLeft = () => {
      const now = new Date();
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
      } else {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [schedule]);

  const scheduledDate = schedule ? new Date(schedule.scheduledAt) : null;
  const dateTimeLabel = scheduledDate
    ? `${scheduledDate.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })} · ${scheduledDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })} IST`
    : "Coming soon";

  const scrollToForm = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      const input = document.getElementsByName("fullName")[0];
      if (input) (input as HTMLElement).focus();
    }, 800);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-[#1C1F22]/95 backdrop-blur-md border-t border-white/10 text-white z-40 transition-transform duration-300 transform shadow-[0_-10px_30px_rgba(0,0,0,0.3)] ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
        
        {/* Desktop Left Pricing & Details */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black">₹7</span>
            <span className="text-xs text-gray-400 line-through">₹499</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <span className="text-xs text-gray-300 font-medium">
            {dateTimeLabel} &middot; <span className="text-red-400 font-semibold">47 seats left</span>
          </span>
        </div>

        {/* Mobile Left Stacked Details */}
        <div className="flex sm:hidden flex-col justify-center">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black">₹7</span>
            <span className="text-[10px] text-gray-400 line-through">₹499</span>
          </div>
          <span className="text-[9px] text-gray-300 mt-0.5">
            47 seats &middot; {timeLeft.days}d {timeLeft.hours}h left
          </span>
        </div>

        {/* Desktop Right Timer & Button */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <span className="text-[9px] text-gray-400 block font-bold tracking-wider uppercase">Starts in</span>
            <span className="text-xs font-semibold tracking-wider text-blue-300">
              {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
            </span>
          </div>
          <button
            onClick={scrollToForm}
            className="bg-[#1E6BFA] hover:bg-[#1554C7] text-white font-bold py-2.5 px-5 rounded-lg text-xs transition-all cursor-pointer shadow-md transform hover:-translate-y-[1px] active:translate-y-0 shrink-0"
          >
            Reserve my seat &middot; ₹7
          </button>
        </div>

        {/* Mobile Right Button */}
        <div className="flex sm:hidden">
          <button
            onClick={scrollToForm}
            className="bg-[#1E6BFA] hover:bg-[#1554C7] text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all cursor-pointer shrink-0"
          >
            Reserve &middot; ₹7
          </button>
        </div>

      </div>
    </div>
  );
}

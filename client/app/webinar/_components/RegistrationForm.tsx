"use client";

import React, { useState, useEffect } from "react";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsApp: "",
  });

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: "09",
    hours: "18",
    minutes: "05",
    seconds: "53",
  });

  // Calculate dynamic countdown to Sun, 23 Aug 2026 11:30 AM IST (or rolling date if passed)
  useEffect(() => {
    const calculateTimeLeft = () => {
      let targetDate = new Date("2026-08-23T11:30:00+05:30");
      const now = new Date();

      // If target date has passed, roll forward to next Sunday 11:30 AM IST
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you ${formData.fullName || "there"}! This is the frontend-only implementation. Registration demo successful.`);
  };

  return (
    <div className="bg-[#1C1F22] border border-white/10 rounded-2xl p-6 text-white w-full max-w-[420px] shadow-2xl relative">
      {/* Reserve title & limited seats badge */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold tracking-widest text-[#E5E7EB] uppercase">
          RESERVE YOUR SEAT
        </h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#1F2C24] text-[#4ADE80] border border-[#22C55E]/20">
          <span className="w-1 h-1 bg-[#22C55E] rounded-full mr-1.5 animate-pulse"></span>
          Limited seats
        </span>
      </div>

      {/* Pricing display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold">₹7</span>
          <span className="text-sm text-gray-400 line-through">₹499</span>
          <span className="text-xs bg-[#1F2C24] text-[#4ADE80] font-semibold px-2 py-0.5 rounded border border-[#22C55E]/10">
            99% OFF
          </span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          A nominal fee just to confirm your seat.
        </p>
      </div>

      {/* Countdown Timer Grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <div className="flex flex-col items-center">
          <div className="bg-white text-black font-extrabold text-xl py-2.5 rounded-xl w-full text-center shadow-md">
            {timeLeft.days}
          </div>
          <span className="text-[9px] font-bold text-gray-400 tracking-wider mt-1.5 uppercase">DAYS</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-white text-black font-extrabold text-xl py-2.5 rounded-xl w-full text-center shadow-md">
            {timeLeft.hours}
          </div>
          <span className="text-[9px] font-bold text-gray-400 tracking-wider mt-1.5 uppercase">HRS</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-white text-black font-extrabold text-xl py-2.5 rounded-xl w-full text-center shadow-md">
            {timeLeft.minutes}
          </div>
          <span className="text-[9px] font-bold text-gray-400 tracking-wider mt-1.5 uppercase">MIN</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-white text-black font-extrabold text-xl py-2.5 rounded-xl w-full text-center shadow-md">
            {timeLeft.seconds}
          </div>
          <span className="text-[9px] font-bold text-gray-400 tracking-wider mt-1.5 uppercase">SEC</span>
        </div>
      </div>

      {/* Registration form inputs */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <div>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full name"
            required
            className="w-full bg-white text-black px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-sm transition-all"
          />
        </div>
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            required
            className="w-full bg-white text-black px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-sm transition-all"
          />
        </div>
        <div>
          <input
            type="tel"
            name="whatsApp"
            value={formData.whatsApp}
            onChange={handleChange}
            placeholder="WhatsApp number"
            required
            className="w-full bg-white text-black px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-sm transition-all"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#1E6BFA] hover:bg-[#1554C7] text-white font-bold py-3.5 px-4 rounded-xl text-center shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-[1px] active:translate-y-0 text-sm tracking-wide"
        >
          Book my seat &middot; ₹7
        </button>
      </form>

      {/* WhatsApp text */}
      <div className="text-center text-[10px] text-gray-400 mb-5">
        Instant confirmation on WhatsApp
      </div>

      {/* Progress & seats footer */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex justify-between text-[11px] text-gray-400 font-medium mb-1.5">
          <span>Batch 76% full</span>
          <span>47 seats left</span>
        </div>
        <div className="w-full bg-[#2C2F33] rounded-full h-1.5 overflow-hidden">
          <div className="bg-[#1E6BFA] h-1.5 rounded-full w-[76%]"></div>
        </div>
      </div>
    </div>
  );
}

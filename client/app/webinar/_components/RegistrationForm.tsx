"use client";

import React, { useState, useEffect } from "react";
import { useWebinarCheckout } from "@/hooks/useWebinarCheckout";

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
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    whatsApp?: string;
  }>({});
  const { register, processing, message } = useWebinarCheckout();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: "09",
    hours: "18",
    minutes: "05",
    seconds: "53",
  });

  // Calculate dynamic countdown to Sat, 22 Aug 2026 11:30 AM IST (or rolling date if passed)
  useEffect(() => {
    const calculateTimeLeft = () => {
      let targetDate = new Date("2026-08-22T11:30:00+05:30");
      const now = new Date();

      // If target date has passed, roll forward to next Saturday 11:30 AM IST
      if (now > targetDate) {
        const nextSaturday = new Date();
        nextSaturday.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
        nextSaturday.setHours(11, 30, 0, 0);
        targetDate = nextSaturday;
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
    // Clear this field's error as soon as the user edits it.
    setFieldErrors((prev) => (prev[name as keyof typeof prev] ? { ...prev, [name]: undefined } : prev));
  };

  const isRegistered = message?.type === "success";

  const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'.-]{1,59}$/;
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(fullName: string, email: string, whatsApp: string) {
    const errors: typeof fieldErrors = {};

    if (!fullName) {
      errors.fullName = "Full name is required.";
    } else if (!NAME_PATTERN.test(fullName)) {
      errors.fullName =
        "Enter a valid name (letters only, at least 2 characters).";
    }

    if (!email) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email)) {
      errors.email = "Enter a valid email address.";
    }

    if (!whatsApp) {
      errors.whatsApp = "WhatsApp number is required.";
    } else {
      // Digits only after stripping formatting characters — rejects
      // symbol-only input like "-------" that a plain character-class
      // regex would otherwise accept.
      const digitsOnly = whatsApp.replace(/[\s\-()]/g, "");
      if (!/^\+?[0-9]{8,15}$/.test(digitsOnly)) {
        errors.whatsApp = "Enter a valid WhatsApp number (8-15 digits).";
      }
    }

    return errors;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const whatsApp = formData.whatsApp.trim();

    const errors = validate(fullName, email, whatsApp);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await register({ name: fullName, email, phoneNumber: whatsApp });
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

      {isRegistered ? (
        /* Success state */
        <div className="mb-4 rounded-xl border border-[#22C55E]/20 bg-[#1F2C24] px-4 py-5 text-center">
          <p className="text-[#4ADE80] font-bold text-sm mb-1">
            You&rsquo;re confirmed! 🎉
          </p>
          <p className="text-gray-300 text-xs">{message?.text}</p>
        </div>
      ) : (
        <>
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
                disabled={processing}
                aria-invalid={!!fieldErrors.fullName}
                className={`w-full bg-white text-black px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 placeholder:text-gray-400 text-sm transition-all disabled:opacity-60 ${
                  fieldErrors.fullName
                    ? "border-[#F87171] focus:ring-[#F87171]"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {fieldErrors.fullName && (
                <p className="text-[#F87171] text-[11px] font-medium mt-1">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                disabled={processing}
                aria-invalid={!!fieldErrors.email}
                className={`w-full bg-white text-black px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 placeholder:text-gray-400 text-sm transition-all disabled:opacity-60 ${
                  fieldErrors.email
                    ? "border-[#F87171] focus:ring-[#F87171]"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-[#F87171] text-[11px] font-medium mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>
            <div>
              <input
                type="tel"
                name="whatsApp"
                value={formData.whatsApp}
                onChange={handleChange}
                placeholder="WhatsApp number"
                required
                disabled={processing}
                aria-invalid={!!fieldErrors.whatsApp}
                className={`w-full bg-white text-black px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 placeholder:text-gray-400 text-sm transition-all disabled:opacity-60 ${
                  fieldErrors.whatsApp
                    ? "border-[#F87171] focus:ring-[#F87171]"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {fieldErrors.whatsApp && (
                <p className="text-[#F87171] text-[11px] font-medium mt-1">
                  {fieldErrors.whatsApp}
                </p>
              )}
            </div>

            {message && message.type === "error" && (
              <p className="text-[#F87171] text-[11px] font-medium">
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full bg-[#1E6BFA] hover:bg-[#1554C7] text-white font-bold py-3.5 px-4 rounded-xl text-center shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-[1px] active:translate-y-0 text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {processing ? "Processing…" : "Book my seat · ₹7"}
            </button>
          </form>

          {/* WhatsApp text */}
          <div className="text-center text-[10px] text-gray-400 mb-5">
            Instant confirmation on WhatsApp
          </div>
        </>
      )}

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

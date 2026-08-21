"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useWebinarCheckout } from "@/hooks/useWebinarCheckout";
import { useWebinarRegistrationStatus } from "@/hooks/queries/useWebinarRegistrationStatus";
import {
  getStoredWebinarRegistrationId,
  setStoredWebinarRegistrationId,
  clearStoredWebinarRegistrationId,
} from "@/lib/webinarStorage";
import AlreadyRegisteredRecovery from "./AlreadyRegisteredRecovery";

interface TimeLeft {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

// Group for confirmed attendees only — joining link/session updates for this
// batch. Distinct from the general WhatsApp community (interaction/
// networking, open to everyone), which is shared via the confirmation email.
const WEBINAR_WHATSAPP_GROUP_LINK =
  "https://chat.whatsapp.com/GzHfq8PjC0u4UyeXaMYxqP?s=cl&p=a&mlu=0";

// useSearchParams() requires a Suspense boundary for static prerendering
// (next build fails without one, even though `next dev` never hits this
// since it doesn't statically prerender) — so the actual form is split into
// an inner component wrapped by this default export.
export default function RegistrationForm() {
  return (
    <Suspense fallback={<RegistrationFormSkeleton />}>
      <RegistrationFormInner />
    </Suspense>
  );
}

function RegistrationFormSkeleton() {
  return (
    <div className="bg-[#1C1F22] border border-white/10 rounded-2xl p-6 text-white w-full max-w-[420px] shadow-2xl relative h-[520px] animate-pulse" />
  );
}

function RegistrationFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRegistrationId = searchParams.get("registrationId");

  // Source of truth for "which registration are we looking at" — seeded from
  // the URL (survives refresh) and falls back to localStorage (survives
  // closing the tab on the same device). Either way, the actual PAID/PENDING/
  // FAILED verdict always comes from the backend status fetch below, never
  // from the URL or localStorage themselves.
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    if (urlRegistrationId) {
      setRegistrationId(urlRegistrationId);
      setCheckedStorage(true);
      return;
    }
    setRegistrationId(getStoredWebinarRegistrationId());
    setCheckedStorage(true);
  }, [urlRegistrationId]);

  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
    isFetching: statusFetching,
  } = useWebinarRegistrationStatus(registrationId, { enabled: checkedStorage && !!registrationId });

  const resetToForm = () => {
    clearStoredWebinarRegistrationId();
    setRegistrationId(null);
    if (urlRegistrationId) router.replace("/webinar", { scroll: false });
  };

  useEffect(() => {
    if (!registrationId) return;
    if (statusError) {
      // Stale/invalid id — don't pretend anything succeeded.
      resetToForm();
      return;
    }
    if (status && status.status === "PAID") {
      setStoredWebinarRegistrationId(registrationId);
      if (!urlRegistrationId) {
        router.replace(`/webinar?registrationId=${registrationId}`, { scroll: false });
      }
    } else if (status && status.status !== "PAID" && !urlRegistrationId) {
      // A stale localStorage id that never completed payment — don't auto-show it.
      clearStoredWebinarRegistrationId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId, status, statusError]);

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

  // Calculate dynamic countdown to Sat, 22 Aug 2026 8:00 PM IST (or rolling date if passed)
  useEffect(() => {
    const calculateTimeLeft = () => {
      let targetDate = new Date("2026-08-22T20:00:00+05:30");
      const now = new Date();

      // If target date has passed, roll forward to next Saturday 8:00 PM IST
      if (now > targetDate) {
        const nextSaturday = new Date();
        nextSaturday.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
        nextSaturday.setHours(20, 0, 0, 0);
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

  const amountLabel = status
    ? `${status.currency === "INR" ? "₹" : status.currency + " "}${(status.amount / 100).toFixed(0)}`
    : null;
  const paidDate = status?.paidAt
    ? new Date(status.paidAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  const showStatusCard = checkedStorage && !!registrationId && !statusError;

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

      {showStatusCard ? (
        <>
          {statusLoading ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-[#202427] px-4 py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-400 text-xs">Checking your registration…</p>
            </div>
          ) : status?.status === "PAID" ? (
            <div className="mb-4 rounded-xl border border-[#22C55E]/20 bg-[#1F2C24] px-4 py-5 text-center">
              <p className="text-[#4ADE80] font-bold text-sm mb-1">
                You&rsquo;re confirmed! 🎉
              </p>
              <p className="text-gray-300 text-xs mb-3">
                Your seat for the AI Webinar is reserved — check your email/WhatsApp for details.
              </p>
              <div className="text-left text-xs text-gray-300 space-y-1.5 border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  <span className="font-medium">{status.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount paid</span>
                  <span className="font-medium">{amountLabel}</span>
                </div>
                {paidDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium">{paidDate}</span>
                  </div>
                )}
              </div>
              <a
                href={WEBINAR_WHATSAPP_GROUP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-2.5 rounded-lg text-xs transition-all"
              >
                Join Webinar Group &rarr;
              </a>
              <p className="text-gray-500 text-[10px] mt-2">
                We&rsquo;ll share the joining link and reminders in the group.
              </p>
            </div>
          ) : status?.status === "PENDING" ? (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-5 text-center">
              <p className="text-amber-400 font-bold text-sm mb-1">
                Payment is being processed
              </p>
              <p className="text-gray-300 text-xs mb-3">
                Please wait a moment — if money was deducted, your seat will confirm shortly.
              </p>
              <button
                type="button"
                onClick={() => refetchStatus()}
                disabled={statusFetching}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 rounded-lg text-xs disabled:opacity-60"
              >
                {statusFetching ? "Checking…" : "Check again"}
              </button>
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-[#F87171]/20 bg-[#2C1F1F] px-4 py-5 text-center">
              <p className="text-[#F87171] font-bold text-sm mb-1">
                Payment didn&rsquo;t go through
              </p>
              <p className="text-gray-300 text-xs mb-3">
                Your registration wasn&rsquo;t completed. You can retry below.
              </p>
              <button
                type="button"
                onClick={resetToForm}
                className="w-full bg-[#1E6BFA] hover:bg-[#1554C7] text-white font-semibold py-2.5 rounded-lg text-xs"
              >
                Retry registration
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <AlreadyRegisteredRecovery />

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

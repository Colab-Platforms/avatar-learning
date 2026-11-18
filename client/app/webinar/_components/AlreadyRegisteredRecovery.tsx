"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequestWebinarRecoveryOtp } from "@/hooks/mutations/useRequestWebinarRecoveryOtp";
import { useVerifyWebinarRecoveryOtp } from "@/hooks/mutations/useVerifyWebinarRecoveryOtp";
import { setStoredWebinarRegistrationId } from "@/lib/webinarStorage";

type Step = "closed" | "email" | "otp";

export default function AlreadyRegisteredRecovery() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("closed");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: requestOtp, isPending: isRequesting } = useRequestWebinarRecoveryOtp();
  const { mutateAsync: verifyOtp, isPending: isVerifying } = useVerifyWebinarRecoveryOtp();

  if (step === "closed") {
    return (
      <button
        type="button"
        onClick={() => setStep("email")}
        className="w-full text-center text-[11px] text-gray-400 hover:text-gray-300 underline underline-offset-2 mb-3"
      >
        Already registered? Check your registration
      </button>
    );
  }

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await requestOtp(email.trim());
      setNotice("If a registration exists for this email, we've sent a verification code.");
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const { registrationId } = await verifyOtp({ email: email.trim(), otp: otp.trim() });
      setStoredWebinarRegistrationId(registrationId);
      router.replace(`/webinar?registrationId=${registrationId}`, { scroll: false });
    } catch {
      setError("Invalid or expired code. Please try again.");
    }
  };

  return (
    <div className="mb-4 rounded-xl border border-white/10 bg-[#232629] px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-200">
          {step === "email" ? "Find your registration" : "Enter verification code"}
        </p>
        <button
          type="button"
          onClick={() => {
            setStep("closed");
            setError(null);
            setNotice(null);
          }}
          className="text-gray-500 hover:text-gray-300 text-xs"
        >
          Cancel
        </button>
      </div>

      {step === "email" && (
        <form onSubmit={handleRequestOtp} className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email used for registration"
            required
            disabled={isRequesting}
            className="w-full bg-white text-black px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-sm disabled:opacity-60"
          />
          {error && <p className="text-[#F87171] text-[11px] font-medium">{error}</p>}
          <button
            type="submit"
            disabled={isRequesting}
            className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 rounded-lg text-xs disabled:opacity-60"
          >
            {isRequesting ? "Sending…" : "Send verification code"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-2">
          {notice && <p className="text-gray-400 text-[11px]">{notice}</p>}
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            required
            disabled={isVerifying}
            className="w-full bg-white text-black px-3 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 text-sm tracking-widest disabled:opacity-60"
          />
          {error && <p className="text-[#F87171] text-[11px] font-medium">{error}</p>}
          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-[#1E6BFA] hover:bg-[#1554C7] text-white font-semibold py-2.5 rounded-lg text-xs disabled:opacity-60"
          >
            {isVerifying ? "Verifying…" : "Verify"}
          </button>
        </form>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OtpInput } from "../OtpInput";
import { GoogleAuthButton } from "../GoogleAuthButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, verifyOtp, resendOtp, clearError } from "@/store/authSlice";

const primaryBtn = [
  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
  "text-[14px] font-semibold text-white",
  "hover:brightness-110 active:scale-95 transition-all duration-200",
  "disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer",
].join(" ");

const inputCls = cn(
  "w-full rounded-xl border px-4 py-3 text-[14px] text-slate-800",
  "placeholder-slate-300 border-slate-200",
  "bg-white",
  "focus:outline-none focus:border-blue-400 focus:bg-white",
  "focus:ring-2 focus:ring-blue-500/15",
  "transition-all duration-200"
);

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error, user, pendingEmail } = useAppSelector((s) => s.auth);

  const [step,           setStep]           = useState<"form" | "otp">("form");
  const [localEmail,     setLocalEmail]     = useState("");
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [showPassword,   setShowPassword]   = useState(false);
  const [otp,            setOtp]            = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess,  setResendSuccess]  = useState(false);

  useEffect(() => { if (user) router.push("/"); }, [user, router]);

  useEffect(() => {
    if (!resendCooldown) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result) && result.payload.requiresVerification) {
      setLocalEmail(email);
      setStep("otp");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\D/g, "");
    if (code.length < 6) return;
    dispatch(clearError());
    dispatch(verifyOtp({ email: localEmail, otp: code, type: "LOGIN" }));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendSuccess(false);
    dispatch(clearError());
    const result = await dispatch(resendOtp({ email: localEmail, type: "LOGIN" }));
    if (resendOtp.fulfilled.match(result)) {
      setResendSuccess(true);
      setResendCooldown(60);
    }
  };

  // ── OTP step ──────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 bg-blue-50"
            style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.10)" }}
          >
            ✉️
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-semibold text-slate-900">Check your email</h2>
          <p className="text-[13px] text-slate-500">
            We sent a 6-digit code to{" "}
            <span className="text-blue-600 font-medium">{localEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />

          {error        && <p className="text-[13px] text-red-500 text-center">{error}</p>}
          {resendSuccess && <p className="text-[13px] text-blue-600 text-center">New code sent!</p>}

          <button
            type="submit"
            disabled={loading || otp.replace(/\D/g, "").length < 6}
            className={primaryBtn}
            style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify &amp; Sign In <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>

        <p className="text-center text-[13px] text-slate-400">
          Didn&apos;t get a code?{" "}
          <button
            type="button" onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className={cn(
              "font-medium transition-colors duration-200",
              resendCooldown > 0 || loading
                ? "text-slate-300 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-700"
            )}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </p>

        <p className="text-center text-[13px]">
          <button
            type="button"
            onClick={() => { setStep("form"); setOtp(""); dispatch(clearError()); }}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
          >
            ← Back to sign in
          </button>
        </p>
      </div>
    );
  }

  // ── Login form ────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Get Back To Your Learning</h2>
        <p className="text-[13px] text-slate-400">Sign in to your Avatar account</p>
      </div>

      <div className="h-px bg-slate-100" />

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">
            Email
          </label>
          <input
            id="email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" className={inputCls}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">
              Password
            </label>
            <Link href="/forgot-password" className="text-[12px] text-blue-500 hover:text-blue-600 transition-colors duration-200">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password" type={showPassword ? "text" : "password"}
              autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className={cn(inputCls, "pr-11")}
            />
            <button
              type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-3.5 py-2.5 text-[13px] text-red-600 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={primaryBtn + " mt-2"}
          style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[12px] text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      <GoogleAuthButton />

      <div className="h-px bg-slate-100" />

      <p className="text-center text-[13px] text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
          Create one
        </Link>
      </p>
    </div>
  );
}

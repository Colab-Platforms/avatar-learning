"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button} from "@/components/ui";
import { OtpInput } from "../OtpInput";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, verifyOtp, resendOtp, clearError } from "@/store/authSlice";

const inputCls = cn(
  "w-full rounded-xl border px-4 py-3 text-[14px] text-white",
  "placeholder-white/20 border-white/10",
  "bg-ink-800/60 backdrop-blur-sm",
  "focus:outline-none focus:border-brand-500/70 focus:bg-ink-800/80",
  "focus:ring-2 focus:ring-brand-500/20 focus:shadow-[0_0_12px_rgba(0,200,255,0.10)]",
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

  // ── OTP step ───────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <div className="w-full space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(0,200,255,0.15) 0%, rgba(0,128,255,0.10) 100%)",
              border: "1px solid rgba(0,200,255,0.20)",
              boxShadow: "0 0 20px rgba(0,200,255,0.10)",
            }}
          >
            ✉️
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="text-[13px] text-white/45">
            We sent a 6-digit code to{" "}
            <span className="text-brand-300 font-medium">{localEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />

          {error        && <p className="text-[13px] text-red-400 text-center">{error}</p>}
          {resendSuccess && <p className="text-[13px] text-brand-300 text-center">New code sent!</p>}

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || otp.replace(/\D/g, "").length < 6}
            className="w-full"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <>Verify &amp; Sign In <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-[13px] text-white/40">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className={cn(
              "font-medium transition-colors duration-200",
              resendCooldown > 0 || loading
                ? "text-white/25 cursor-not-allowed"
                : "text-brand-300 hover:text-brand-200"
            )}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </p>

        <p className="text-center text-[13px]">
          <button
            type="button"
            onClick={() => { setStep("form"); setOtp(""); dispatch(clearError()); }}
            className="text-white/40 hover:text-white/70 transition-colors duration-200"
          >
            ← Back to sign in
          </button>
        </p>
      </div>
    );
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      {/* Header with icon */}
      <div className="text-center space-y-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Get Back To Your Learning</h2>
          <p className="text-[13px] text-white/40">Sign in to your Avatar account</p>
        </div>
      </div>

      {/* Divider */}
      <div className="divider-glow" />

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">
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
            <label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">
              Password
            </label>
            <Link href="/forgot-password" className="text-[12px] text-brand-400/70 hover:text-brand-300 transition-colors duration-200">
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-3.5 py-2.5 text-[13px] text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full mt-2">
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <>Sign In <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <div className="divider-glow" />

      <p className="text-center text-[13px] text-white/35">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors duration-200">
          Create one
        </Link>
      </p>
    </div>
  );
}

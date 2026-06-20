"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2,Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { OtpInput } from "../OtpInput";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { register, verifyOtp, resendOtp, clearError } from "@/store/authSlice";
import { Button } from "@/components/ui/Button";

const inputCls = cn(
  "w-full rounded-xl border px-4 py-3 text-[14px] text-white",
  "placeholder-white/20 border-white/10",
  "bg-ink-800/60 backdrop-blur-sm",
  "focus:outline-none focus:border-brand-500/70 focus:bg-ink-800/80",
  "focus:ring-2 focus:ring-brand-500/20 focus:shadow-[0_0_12px_rgba(0,200,255,0.10)]",
  "transition-all duration-200"
);

// ─── Password strength rules ──────────────────────────────────────────────────

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",  test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",  test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",            test: (p: string) => /\d/.test(p)    },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-1.5 text-[12px]">
            {ok ? <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                : <XIcon  className="h-3 w-3 text-white/25 shrink-0" />}
            <span className={ok ? "text-white/55" : "text-white/25"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error, user } = useAppSelector((s) => s.auth);

  const [step,           setStep]           = useState<"form" | "otp">("form");
  const [pendingEmail,   setPendingEmail]   = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phoneNo: "", state: "", country: "", password: "",
  });
  const [showPassword,   setShowPassword]   = useState(false);
  const [agreed,         setAgreed]         = useState(false);
  const [otp,            setOtp]            = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess,  setResendSuccess]  = useState(false);

  useEffect(() => { if (user) router.push("/"); }, [user, router]);

  useEffect(() => {
    if (!resendCooldown) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isPasswordValid = RULES.every((r) => r.test(form.password));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !agreed) return;
    dispatch(clearError());
    const result = await dispatch(register(form));
    console.log("Register result:", result);
    if (register.fulfilled.match(result)) {
      setPendingEmail(form.email);
      setStep("otp");
    }
    console.log("Switching to OTP screen");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\D/g, "");
    if (code.length < 6) return;
    dispatch(clearError());
    dispatch(verifyOtp({ email: pendingEmail, otp: code, type: "REGISTER" }));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendSuccess(false);
    dispatch(clearError());
    const result = await dispatch(resendOtp({ email: pendingEmail, type: "REGISTER" }));
    if (resendOtp.fulfilled.match(result)) {
      setResendSuccess(true);
      setResendCooldown(60);
    }
  };
  console.log("Current step:", step);
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
          <h2 className="text-xl font-semibold text-white">Verify your email</h2>
          <p className="text-[13px] text-white/45">
            We sent a 6-digit code to{" "}
            <span className="text-brand-300 font-medium">{pendingEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />

          {error        && <p className="text-[13px] text-red-400 text-center">{error}</p>}
          {resendSuccess && <p className="text-[13px] text-brand-300 text-center">New code sent!</p>}

          <Button
            type="submit" variant="primary" size="md"
            disabled={loading || otp.replace(/\D/g, "").length < 6}
            className="w-full"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <>Verify &amp; Create Account <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-[13px] text-white/40">
          Didn&apos;t get a code?{" "}
          <button
            type="button" onClick={handleResend}
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
            ← Back to registration
          </button>
        </p>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      {/* Header with icon */}
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-2">
   
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white tracking-tight">Create your account</h2>
          <p className="text-[13px] text-white/40">Join Avatar and start your AI journey</p>
        </div>
      </div>

      {/* Divider */}
      <div className="divider-glow" />

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">First name</label>
            <input id="firstName" type="text" required autoComplete="given-name"
              value={form.firstName} onChange={set("firstName")} placeholder="John" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Last name</label>
            <input id="lastName" type="text" required autoComplete="family-name"
              value={form.lastName} onChange={set("lastName")} placeholder="Doe" className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Email</label>
          <input id="reg-email" type="email" required autoComplete="email"
            value={form.email} onChange={set("email")} placeholder="you@example.com" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Phone number</label>
          <input id="phone" type="tel" required autoComplete="tel"
            value={form.phoneNo} onChange={set("phoneNo")} placeholder="+91 98765 43210" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="state" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">State</label>
            <input id="state" type="text" required
              value={form.state} onChange={set("state")} placeholder="Maharashtra" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="country" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Country</label>
            <input id="country" type="text" required
              value={form.country} onChange={set("country")} placeholder="India" className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">Password</label>
          <div className="relative">
            <input
              id="reg-password" type={showPassword ? "text" : "password"}
              required autoComplete="new-password"
              value={form.password} onChange={set("password")}
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
          <PasswordStrength password={form.password} />
        </div>

        {error && (
          <div className="rounded-lg px-3.5 py-2.5 text-[13px] text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                "h-4 w-4 rounded border transition-all duration-200 flex items-center justify-center",
                agreed
                  ? "border-brand-500 bg-brand-500/20 shadow-[0_0_8px_rgba(0,200,255,0.3)]"
                  : "border-white/20 bg-white/4 group-hover:border-white/35"
              )}
            >
              {agreed && (
                <svg className="h-2.5 w-2.5 text-brand-400" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-[12px] text-white/45 leading-5">
            I agree to the{" "}
            <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 transition-colors duration-200 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Terms &amp; Conditions
            </a>
            {" "}and{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 transition-colors duration-200 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </span>
        </label>

        <Button type="submit" variant="primary" size="md"
          disabled={loading || !isPasswordValid || !agreed} className="w-full mt-2"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <>Create Account <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <div className="divider-glow" />

      <p className="text-center text-[13px] text-white/35">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors duration-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}

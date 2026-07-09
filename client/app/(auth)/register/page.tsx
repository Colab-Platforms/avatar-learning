"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { OtpInput } from "../OtpInput";
import { Msg91PhoneWidget } from "../Msg91PhoneWidget";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { register, verifyOtp, verifyPhone, resendOtp, clearError } from "@/store/authSlice";

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
            {ok ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                : <XIcon  className="h-3 w-3 text-slate-300 shrink-0" />}
            <span className={ok ? "text-slate-600" : "text-slate-300"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

type RegisterStep = "form" | "choose-method" | "email-otp" | "phone-verify";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { loading, error, user } = useAppSelector((s) => s.auth);

  const [step,           setStep]           = useState<RegisterStep>("form");
  const [localEmail,     setLocalEmail]     = useState("");
  const [localPhone,     setLocalPhone]     = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "",
    phoneNo: "", state: "", country: "", password: "",
  });
  const [showPassword,   setShowPassword]   = useState(false);
  const [agreed,         setAgreed]         = useState(false);
  const [otp,            setOtp]            = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess,  setResendSuccess]  = useState(false);
  const [phoneError,     setPhoneError]     = useState<string | null>(null);

  useEffect(() => { if (user) router.push("/onboarded"); }, [user, router]);

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
    if (register.fulfilled.match(result)) {
      setLocalEmail(form.email);
      setLocalPhone(form.phoneNo);
      setStep("choose-method");
    }
  };

  const handleChooseEmail = async () => {
    dispatch(clearError());
    const result = await dispatch(resendOtp({ email: localEmail, type: "REGISTER" }));
    if (resendOtp.fulfilled.match(result)) {
      setResendCooldown(60);
      setStep("email-otp");
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\D/g, "");
    if (code.length < 6) return;
    dispatch(clearError());
    dispatch(verifyOtp({ email: localEmail, otp: code, type: "REGISTER" }));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendSuccess(false);
    dispatch(clearError());
    const result = await dispatch(resendOtp({ email: localEmail, type: "REGISTER" }));
    if (resendOtp.fulfilled.match(result)) {
      setResendSuccess(true);
      setResendCooldown(60);
    }
  };

  const handlePhoneVerified = useCallback(
    (accessToken: string) => {
      setPhoneError(null);
      dispatch(clearError());
      dispatch(verifyPhone({ email: localEmail, accessToken }));
    },
    [dispatch, localEmail]
  );

  const handlePhoneError = useCallback((message: string) => {
    setPhoneError(message);
  }, []);

  // ── Choose method ─────────────────────────────────────────────────────────
  if (step === "choose-method") {
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 bg-blue-50"
            style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.10)" }}
          >
            🔐
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-semibold text-slate-900">Verify your account</h2>
          <p className="text-[13px] text-slate-500">Choose how you&apos;d like to verify</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleChooseEmail}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-200 group disabled:opacity-50 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">✉️</span>
              <div>
                <p className="text-[14px] font-medium text-slate-800">Email OTP</p>
                <p className="text-[12px] text-slate-400">Send a 6-digit code to {localEmail}</p>
              </div>
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin text-blue-500 ml-auto" />
                : <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />}
            </div>
          </button>

          <button
            type="button"
            onClick={() => { dispatch(clearError()); setStep("phone-verify"); }}
            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-200 group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📱</span>
              <div>
                <p className="text-[14px] font-medium text-slate-800">Mobile OTP</p>
                <p className="text-[12px] text-slate-400">Verify via OTP on {localPhone}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 ml-auto transition-colors" />
            </div>
          </button>
        </div>

        {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}

        <p className="text-center text-[13px]">
          <button
            type="button"
            onClick={() => { setStep("form"); dispatch(clearError()); }}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
          >
            ← Back to registration
          </button>
        </p>
      </div>
    );
  }

  // ── Phone verify ──────────────────────────────────────────────────────────
  if (step === "phone-verify") {
    return (
      <div className="w-full space-y-6">
        <div className="flex justify-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 bg-blue-50"
            style={{ boxShadow: "0 4px 14px rgba(59,130,246,0.10)" }}
          >
            📱
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h2 className="text-xl font-semibold text-slate-900">Verify your phone</h2>
          <p className="text-[13px] text-slate-500">
            Complete OTP verification for{" "}
            <span className="text-blue-600 font-medium">{localPhone}</span>
          </p>
        </div>

        <Msg91PhoneWidget
          phoneNo={localPhone}
          onVerified={handlePhoneVerified}
          onError={handlePhoneError}
        />

        {(error || phoneError) && (
          <p className="text-[13px] text-red-500 text-center">{error ?? phoneError}</p>
        )}

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        )}

        <p className="text-center text-[13px]">
          <button
            type="button"
            onClick={() => { setStep("choose-method"); setPhoneError(null); dispatch(clearError()); }}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
          >
            ← Back to email verification
          </button>
        </p>
      </div>
    );
  }

  // ── Email OTP ─────────────────────────────────────────────────────────────
  if (step === "email-otp") {
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
          <h2 className="text-xl font-semibold text-slate-900">Verify your email</h2>
          <p className="text-[13px] text-slate-500">
            We sent a 6-digit code to{" "}
            <span className="text-blue-600 font-medium">{localEmail}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyEmail} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />

          {error        && <p className="text-[13px] text-red-500 text-center">{error}</p>}
          {resendSuccess && <p className="text-[13px] text-blue-600 text-center">New code sent!</p>}

          <button
            type="submit"
            disabled={loading || otp.replace(/\D/g, "").length < 6}
            className={primaryBtn}
            style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify Email <ArrowRight className="h-4 w-4" /></>}
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
            onClick={() => { setStep("choose-method"); setOtp(""); dispatch(clearError()); }}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
          >
            ← Back
          </button>
        </p>
      </div>
    );
  }

  // ── Register form ─────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Create your account</h2>
        <p className="text-[13px] text-slate-400">Join Avatar and start your AI journey</p>
      </div>

      <div className="h-px bg-slate-100" />

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">First name</label>
            <input id="firstName" type="text" required autoComplete="given-name"
              value={form.firstName} onChange={set("firstName")} placeholder="John" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">Last name</label>
            <input id="lastName" type="text" required autoComplete="family-name"
              value={form.lastName} onChange={set("lastName")} placeholder="Doe" className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-email" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">Email</label>
          <input id="reg-email" type="email" required autoComplete="email"
            value={form.email} onChange={set("email")} placeholder="you@example.com" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">Phone number</label>
          <input id="phone" type="tel" required autoComplete="tel"
            value={form.phoneNo} onChange={set("phoneNo")} placeholder="+91 98765 43210" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="state" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">State</label>
            <input id="state" type="text" required
              value={form.state} onChange={set("state")} placeholder="Maharashtra" className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="country" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">Country</label>
            <input id="country" type="text" required
              value={form.country} onChange={set("country")} placeholder="India" className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reg-password" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">Password</label>
          <div className="relative">
            <input
              id="reg-password" type={showPassword ? "text" : "password"}
              required autoComplete="new-password"
              value={form.password} onChange={set("password")}
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
          <PasswordStrength password={form.password} />
        </div>

        {error && (
          <div className="rounded-lg px-3.5 py-2.5 text-[13px] text-red-600 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

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
                  ? "border-blue-500 bg-blue-50 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                  : "border-slate-300 bg-white group-hover:border-slate-400"
              )}
            >
              {agreed && (
                <svg className="h-2.5 w-2.5 text-blue-600" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-[12px] text-slate-500 leading-5">
            I agree to the{" "}
            <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Terms &amp; Conditions
            </a>
            {" "}and{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !isPasswordValid || !agreed}
          className={primaryBtn + " mt-2"}
          style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="h-px bg-slate-100" />

      <p className="text-center text-[13px] text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, KeyRound, AlertTriangle, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPassword, clearError } from "@/store/authSlice";

const inputCls = cn(
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800",
  "placeholder-slate-300",
  "focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15",
  "transition-all duration-200"
);

const primaryBtn = [
  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
  "text-[14px] font-semibold text-white",
  "hover:brightness-110 active:scale-95 transition-all duration-200",
  "disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer",
].join(" ");

const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",  test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",  test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",            test: (p: string) => /\d/.test(p) },
];

function PasswordRules({ password }: { password: string }) {
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

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const dispatch     = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const token = searchParams.get("token") ?? "";

  const [password,     setPassword]     = useState("");
  const [confirm,      setConfirm]      = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [done,         setDone]         = useState(false);

  const allRulesPassed = RULES.every((r) => r.test(password));
  const mismatch       = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed || mismatch) return;
    dispatch(clearError());
    const result = await dispatch(resetPassword({ token, password }));
    if (resetPassword.fulfilled.match(result)) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    }
  };

  /* ── No token ── */
  if (!token) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-slate-900">Invalid reset link</h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            This link is missing a reset token. Please request a new password reset.
          </p>
        </div>
        <Link href="/forgot-password">
          <button
            className={primaryBtn}
            style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
          >
            Request new link
          </button>
        </Link>
      </div>
    );
  }

  /* ── Success state ── */
  if (done) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-slate-900">Password updated!</h2>
          <p className="text-[13px] text-slate-500">
            Your password has been changed. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-1.5">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
            <KeyRound className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Set a new password</h2>
        <p className="text-[13px] text-slate-500">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <div className="h-px bg-slate-100" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">
            New password
          </label>
          <div className="relative">
            <input
              id="password" type={showPassword ? "text" : "password"}
              autoComplete="new-password" required
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
          <PasswordRules password={password} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirm" type={showConfirm ? "text" : "password"}
              autoComplete="new-password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={cn(inputCls, "pr-11", mismatch && "border-red-300 focus:border-red-400")}
            />
            <button
              type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors duration-200"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && <p className="text-[12px] text-red-500">Passwords don&apos;t match</p>}
        </div>

        {error && (
          <div className="rounded-lg px-3.5 py-2.5 text-[13px] text-red-600 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !allRulesPassed || mismatch}
          className={primaryBtn}
          style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="text-center text-[13px]">
        <Link href="/login" className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

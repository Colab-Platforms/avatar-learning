"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, KeyRound, AlertTriangle, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetPassword, clearError } from "@/store/authSlice";

const inputCls = cn(
  "w-full rounded-xl border px-4 py-3 text-[14px] text-white",
  "placeholder-white/20 border-white/10",
  "bg-ink-800/60 backdrop-blur-sm",
  "focus:outline-none focus:border-brand-500/70 focus:bg-ink-800/80",
  "focus:ring-2 focus:ring-brand-500/20 focus:shadow-[0_0_12px_rgba(0,200,255,0.10)]",
  "transition-all duration-200"
);

/* ── Same rules as register page ── */
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
            {ok
              ? <Check  className="h-3 w-3 text-emerald-400 shrink-0" />
              : <XIcon  className="h-3 w-3 text-white/25 shrink-0" />}
            <span className={ok ? "text-white/55" : "text-white/25"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Inner component — reads searchParams ── */
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

  /* ── No token in URL ── */
  if (!token) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/12 border border-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white">Invalid reset link</h2>
          <p className="text-[13px] text-white/45 leading-relaxed">
            This link is missing a reset token. Please request a new
            password reset from the forgot password page.
          </p>
        </div>
        <Link href="/forgot-password">
          <Button variant="primary" size="md" className="w-full">
            Request new link
          </Button>
        </Link>
      </div>
    );
  }

  /* ── Success state ── */
  if (done) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/25">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white">Password updated!</h2>
          <p className="text-[13px] text-white/45">
            Your password has been changed. Redirecting you to sign in…
          </p>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="w-full space-y-6">
      {/* Icon + heading */}
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 border border-brand-500/25">
            <KeyRound className="h-5 w-5 text-brand-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white">Set a new password</h2>
        <p className="text-[13px] text-white/45">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(inputCls, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordRules password={password} />
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-[12px] font-semibold tracking-wide uppercase text-white/40">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={cn(inputCls, "pr-11", mismatch && "border-red-500/50 focus:border-red-500/60")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-200"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {mismatch && (
            <p className="text-[12px] text-red-400">Passwords don&apos;t match</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg px-3.5 py-2.5 text-[13px] text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={loading || !allRulesPassed || mismatch}
          className="w-full mt-1"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <>Reset Password <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>

      <p className="text-center text-[13px]">
        <Link
          href="/login"
          className="text-white/40 hover:text-white/70 transition-colors duration-200"
        >
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}

/* ── Page export — wraps inner component in Suspense (required for useSearchParams) ── */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

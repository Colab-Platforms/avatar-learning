"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { forgotPassword, clearError } from "@/store/authSlice";

const inputCls = cn(
  "w-full rounded-xl border bg-white/4 px-4 py-2.5 text-[14px] text-white",
  "placeholder-white/25 border-white/10",
  "focus:outline-none focus:border-brand-500/60 focus:bg-white/6 focus:ring-2 focus:ring-brand-500/15",
  "transition-all duration-200"
);

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) {
      setSent(true);
    }
  };

  /* ── Success state ── */
  if (sent) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/25">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white">Check your inbox</h2>
          <p className="text-[13px] text-white/45 leading-relaxed">
            We&apos;ve sent a password reset link to{" "}
            <span className="text-brand-300 font-medium">{email}</span>.
            <br />
            The link expires in 1 hour.
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-4 text-[13px] text-white/40 text-left space-y-1">
          <p>Didn&apos;t receive it? Check your spam folder or</p>
          <button
            type="button"
            onClick={() => { setSent(false); dispatch(clearError()); }}
            className="text-brand-300 hover:text-brand-200 font-medium transition-colors duration-200"
          >
            try a different email address
          </button>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] text-white/40 hover:text-white/70 transition-colors duration-200"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  /* ── Form state ── */
  return (
    <div className="w-full space-y-6">
      {/* Icon + heading */}
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 border border-brand-500/25">
            <Mail className="h-5 w-5 text-brand-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white">Forgot your password?</h2>
        <p className="text-[13px] text-white/45 leading-relaxed">
          Enter the email address on your account and we&apos;ll
          send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[13px] font-medium text-white/60">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={loading}
          className="w-full mt-1"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
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

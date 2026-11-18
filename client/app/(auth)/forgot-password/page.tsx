"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, CheckCircle2, Mail } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { forgotPassword, clearError } from "@/store/authSlice";

const inputCls = [
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-800",
  "placeholder-slate-300",
  "focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15",
  "transition-all duration-200",
].join(" ");

const primaryBtn = [
  "w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
  "text-[14px] font-semibold text-white",
  "hover:brightness-110 active:scale-95 transition-all duration-200",
  "disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer",
].join(" ");

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(result)) setSent(true);
  };

  /* ── Success state ── */
  if (sent) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold text-slate-900">Check your inbox</h2>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            We&apos;ve sent a password reset link to{" "}
            <span className="text-blue-600 font-medium">{email}</span>.
            <br />
            The link expires in 1 hour.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-[13px] text-slate-500 text-left space-y-1">
          <p>Didn&apos;t receive it? Check your spam folder or</p>
          <button
            type="button"
            onClick={() => { setSent(false); dispatch(clearError()); }}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            try a different email address
          </button>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-600 transition-colors duration-200"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  /* ── Form state ── */
  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-1.5">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Forgot your password?</h2>
        <p className="text-[13px] text-slate-500 leading-relaxed">
          Enter the email address on your account and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="h-px bg-slate-100" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-slate-400">
            Email address
          </label>
          <input
            id="email" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" className={inputCls}
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={primaryBtn}
          style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Reset Link <ArrowRight className="h-4 w-4" /></>}
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

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  MessageCircleHeart,
  ShieldCheck,
} from "lucide-react";
import { useAssessmentCounsellingCheckout } from "@/hooks/useAssessmentCounsellingCheckout";
import type { RootState } from "@/store";
import { cn } from "@/lib/utils";

const INCLUDED = [
  {
    icon: ClipboardCheck,
    title: "AI Assessment",
    desc: "A short, LLM-evaluated profile questionnaire that maps your interests and goals to the right Direct2Hire learning path.",
  },
  {
    icon: MessageCircleHeart,
    title: "1-on-1 Counselling",
    desc: "A 30-minute voice or video session with a career counsellor, plus your personalised course recommendation.",
  },
];

export default function AssessmentCounsellingPage() {
  const router = useRouter();
  const { user, hasHydrated } = useSelector((state: RootState) => state.auth);
  const { enroll, processing, message, enrolled, secondsLeft } =
    useAssessmentCounsellingCheckout();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login?redirect=/direct2hire/assessment-counselling");
      return;
    }
    if (user.profileCompleted === false) {
      router.replace("/complete-profile");
    }
  }, [hasHydrated, user, router]);

  const authorized = hasHydrated && Boolean(user);

  const checkoutStarted = useRef(false);
  useEffect(() => {
    if (enrolled && !checkoutStarted.current) {
      router.replace("/dashboard");
    }
  }, [enrolled, router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (processing) {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Processing your payment…</h1>
          <p className="mt-2 text-sm text-slate-500">
            Complete the payment window. Don&apos;t close or refresh this tab.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-mono text-2xl font-semibold text-slate-800 shadow-sm">
          {mm}:{ss}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link
          href="/direct2hire"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Direct2Hire
        </Link>

        <div className="mb-8">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-blue-600 uppercase">
            Direct2Hire Programme
          </span>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Assessment + Counselling
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Try the first two steps of Direct2Hire on their own — no
            commitment to the full programme required.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-5">
            {INCLUDED.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <item.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">₹99</span>
              <span className="text-sm text-slate-400">one-time</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Credited toward the full ₹999 Direct2Hire programme if you
              upgrade later — pay only ₹900 more.
            </p>

            <button
              type="button"
              onClick={() => enroll()}
              disabled={processing}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Pay ₹99 &amp; Continue
            </button>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Payments are secured and verified server-side.
            </p>

            {message && (
              <div
                className={cn(
                  "mt-4 rounded-xl border px-4 py-3 text-sm",
                  message.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800",
                )}
              >
                {message.text}
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Want the full learning path, internship & placement too?{" "}
          <Link
            href="/direct2hire/enroll"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Get the full Direct2Hire programme for ₹999
          </Link>
        </p>
      </div>
    </div>
  );
}

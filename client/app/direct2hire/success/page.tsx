"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const D2H_PRICE_INR = 999;

export default function Direct2HireSuccessPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);
  const { data: statusData, isLoading } = useD2HStatus({
    enabled: hasHydrated && Boolean(user),
  });
  const firedRef = useRef(false);

  const paid = statusData?.enrollment?.status === "PAID";

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login?redirect=/direct2hire/enroll");
      return;
    }
    if (isLoading) return;
    if (!paid) {
      // Someone landed here without a verified payment — don't claim success.
      router.replace("/direct2hire/enroll");
      return;
    }

    if (!firedRef.current) {
      firedRef.current = true;
      window.fbq?.("track", "Purchase", { value: D2H_PRICE_INR, currency: "INR" });
    }
  }, [hasHydrated, user, isLoading, paid, router]);

  if (!paid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center px-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Checking your enrollment…</p>
      </div>
    );
  }

  const paidDate = statusData?.enrollment?.updatedAt
    ? new Date(statusData.enrollment.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Payment successful!</h1>
        <p className="mt-2 text-sm text-slate-500">
          Welcome to Direct2Hire — your enrollment is confirmed.
        </p>

        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 text-left text-sm">
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium text-slate-800">Direct2Hire Programme</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-slate-500">Amount paid</span>
            <span className="font-medium text-slate-800">₹{D2H_PRICE_INR.toLocaleString("en-IN")}</span>
          </div>
          {paidDate && (
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Date</span>
              <span className="font-medium text-slate-800">{paidDate}</span>
            </div>
          )}
          {user?.email && (
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Billed to</span>
              <span className="font-medium text-slate-800 truncate max-w-45">{user.email}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 text-left">
          <Mail className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            A payment receipt has been sent to your email by our payment partner.
            Check your inbox (and spam folder) for the confirmation.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

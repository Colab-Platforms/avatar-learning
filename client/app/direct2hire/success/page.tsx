"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

    const t = setTimeout(() => router.replace("/dashboard"), 1200);
    return () => clearTimeout(t);
  }, [hasHydrated, user, isLoading, paid, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center px-6">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-sm text-slate-500">
        {paid ? "Payment successful! Redirecting to your dashboard…" : "Checking your enrollment…"}
      </p>
    </div>
  );
}

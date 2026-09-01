"use client";

import { Suspense, use, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useEnrollment } from "@/hooks/queries/useEnrollment";
import { useCourse } from "@/hooks/queries/useCourse";
import { basicCourseRoutes, dashboardRoutes } from "@/lib/dashboardRoutes";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
}

function CourseSuccessContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = (searchParams.get("plan") ?? "basic").toLowerCase();
  const amountParam = searchParams.get("amount");
  const amount = amountParam ? parseInt(amountParam, 10) : null;

  const { user, hasHydrated } = useAppSelector((s) => s.auth);
  const { data: course } = useCourse(id);
  const { data: enrollmentData, isLoading } = useEnrollment(id);
  const firedRef = useRef(false);

  const enrolled = enrollmentData?.enrolled ?? false;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace(`/login?redirect=/courses/${id}/success`);
      return;
    }
    if (isLoading) return;
    if (!enrolled) {
      router.replace(`/courses/${id}/enroll`);
    }
  }, [hasHydrated, user, isLoading, enrolled, id, router]);

  useEffect(() => {
    if (enrolled && !firedRef.current) {
      firedRef.current = true;
      window.fbq?.("track", "Purchase", {
        value: amount ?? undefined,
        currency: "INR",
      });
    }
  }, [enrolled, amount]);

  if (!enrolled || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center px-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Verifying your enrollment…</p>
      </div>
    );
  }

  const isD2H = plan === "d2h";
  const planLabel = isD2H ? "Direct2Hire 5-Step Program" : "Basic Course Plan";
  // Land them in the track they just paid for. An upgrader now owns both, so
  // a bare /dashboard/{id} would be ambiguous.
  const dashboardHref = isD2H
    ? dashboardRoutes(id).root
    : basicCourseRoutes(id).root;
  const purchaseDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-lg">
        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 w-full bg-brand-500" />

          <div className="p-8 text-center">
            {/* Success icon */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 border border-brand-200">
              <CheckCircle2 className="h-10 w-10 text-brand-500" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              Payment Successful!
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Your enrollment is confirmed. Welcome aboard!
            </p>

            {/* Order Summary */}
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 text-left overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Order Summary
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Course */}
                <div className="flex items-start justify-between px-4 py-3 gap-3">
                  <span className="text-sm text-slate-500 shrink-0">
                    Course
                  </span>
                  <div className="flex items-center gap-2 text-right">
                    {isD2H ? (
                      <Briefcase className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    ) : (
                      <BookOpen className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    )}
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      {course?.title ?? "Your Course"}
                    </span>
                  </div>
                </div>

                {/* Plan */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-500">Plan</span>
                  <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
                    {planLabel}
                  </span>
                </div>

                {/* Amount */}
                {amount !== null && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-slate-500">Amount Paid</span>
                    <span className="text-base font-bold text-slate-900">
                      ₹{amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-slate-500">Date</span>
                  <span className="text-sm font-medium text-slate-700">
                    {purchaseDate}
                  </span>
                </div>

                {/* Email */}
                {user?.email && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-slate-500">Billed to</span>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                      {user.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Email notice */}
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 p-3.5 text-left">
              <Mail className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
              <p className="text-xs text-slate-700 leading-relaxed">
                A payment confirmation has been sent to your email. Check your
                inbox (and spam folder).
              </p>
            </div>

            {/* CTA */}
            <Link
              href={dashboardHref}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white transition-all shadow-md shadow-brand-500/20 cursor-pointer"
            >
              {isD2H ? "Go to Direct2Hire Dashboard" : "Go to Your Course"}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <p className="mt-4 text-xs text-slate-400">
              You can access your course anytime from your dashboard.
            </p>
          </div>
        </div>

        {/* Brand footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Avatar India · Secure Payment by Razorpay / Cashfree
        </p>
      </div>
    </div>
  );
}

export default function CourseSuccessPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-center px-6">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      }
    >
      <CourseSuccessContent {...props} />
    </Suspense>
  );
}

"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Award,
  ShieldCheck,
  Loader2,
  Sparkles,
  Zap,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { enrollCourse } from "@/lib/coursesApi";
import { useCourse } from "@/hooks/queries/useCourse";
import { useEnrollment } from "@/hooks/queries/useEnrollment";
import { useAppSelector } from "@/store/hooks";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCashfree } from "@/hooks/useCashfree";
import { useCreateOrder } from "@/hooks/mutations/useCreateOrder";
import { useVerifyPayment } from "@/hooks/mutations/useVerifyPayment";
import { applyCoupon } from "@/lib/paymentApi";
import type { CreateOrderResponse } from "@/lib/paymentApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_BASIC_PRICE = 499;
const DEFAULT_D2H_PRICE = 4999;

export default function CourseEnrollPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") === "d2h" ? "D2H" : "BASIC";

  const { user, hasHydrated } = useAppSelector((s) => s.auth);
  const razorpayLoaded = useRazorpay();
  const cashfreeLoaded = useCashfree();
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: verifyPayment } = useVerifyPayment();

  const { data: course, isLoading, isError } = useCourse(id);
  const { data: enrollmentData, refetch: refetchEnrollment } = useEnrollment(
    course?.id ?? "",
  );
  const enrolled = enrollmentData?.enrolled ?? false;

  const [selectedPlan, setSelectedPlan] = useState<"BASIC" | "D2H">(initialPlan);
  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState<number | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null,
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace(`/login?redirect=/courses/${id}/enroll?plan=${selectedPlan.toLowerCase()}`);
    }
  }, [hasHydrated, user, id, selectedPlan, router]);

  useEffect(() => {
    if (enrolled) {
      router.replace(`/courses/${id}/learn`);
    }
  }, [enrolled, id, router]);

  const handlePlanSelect = (plan: "BASIC" | "D2H") => {
    setSelectedPlan(plan);
    const url = new URL(window.location.href);
    url.searchParams.set("plan", plan.toLowerCase());
    window.history.replaceState({}, "", url.toString());
  };

  const basicPrice = DEFAULT_BASIC_PRICE;
  const d2hPrice = DEFAULT_D2H_PRICE;
  const originalPrice = selectedPlan === "BASIC" ? basicPrice : d2hPrice;

  const discountAmount = appliedDiscountPercent
    ? Math.round((originalPrice * appliedDiscountPercent) / 100)
    : 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setCouponSuccess("");
    try {
      const res = await applyCoupon(couponCode.trim());
      setAppliedDiscountPercent(res.discountPercent);
      setCouponSuccess(`Coupon applied! ${res.discountPercent}% OFF`);
    } catch (err: any) {
      setAppliedDiscountPercent(null);
      setCouponError(err.response?.data?.message || "Invalid coupon code");
    }
  };

  const showMsg = (text: string, type: "success" | "error" = "success") =>
    setMessage({ text, type });

  const handleRazorpayCheckout = useCallback(
    async (order: CreateOrderResponse) => {
      if (!course || !user) return;

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Avatar India",
          description: `${course.title} (${selectedPlan === "BASIC" ? "Basic Course" : "Direct2Hire Program"})`,
          image: course.thumbnail ?? undefined,
          order_id: order.orderId,
          prefill: {
            name: `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim(),
            email: (user as any).email ?? "",
          },
          theme: { color: "#00C8FF" },
          retry: { enabled: true, max_count: 3 },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyPayment({
                courseId: course.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refetchEnrollment();
              showMsg("Payment successful! Redirecting to your course…", "success");
              setTimeout(() => router.push(`/courses/${id}/learn`), 1500);
              resolve();
            } catch (verifyErr: unknown) {
              const e = verifyErr as { response?: { data?: { message?: string } } };
              reject(
                new Error(e?.response?.data?.message ?? "Payment verification failed"),
              );
            }
          },
          modal: {
            ondismiss: () => reject(new Error("cancelled")),
          },
        });

        rzp.open();
      });
    },
    [course, user, selectedPlan, verifyPayment, refetchEnrollment, id, router],
  );

  const handleCashfreeCheckout = useCallback(
    async (order: CreateOrderResponse) => {
      if (!course) return;
      if (!order.paymentSessionId) throw new Error("Missing Cashfree payment session");
      if (!window.Cashfree) throw new Error("Cashfree SDK not loaded");

      const cashfree = window.Cashfree({ mode: order.mode ?? "sandbox" });
      const result = await cashfree.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_modal",
      });
      if (result.error) throw new Error(result.error.message ?? "Payment failed");

      await verifyPayment({ courseId: course.id, order_id: order.orderId });
      await refetchEnrollment();
      showMsg("Payment successful! Redirecting to your course…", "success");
      setTimeout(() => router.push(`/courses/${id}/learn`), 1500);
    },
    [course, verifyPayment, refetchEnrollment, id, router],
  );

  const handleCheckout = useCallback(async () => {
    if (!course || !user) return;
    setProcessing(true);
    setMessage(null);

    try {
      const order = await createOrder({
        courseId: course.id,
        plan: selectedPlan,
        couponCode: couponCode.trim() || undefined,
      });

      if (order.provider === "cashfree") {
        if (!cashfreeLoaded) {
          showMsg("Payment SDK is still loading. Please try again.", "error");
          return;
        }
        await handleCashfreeCheckout(order);
        return;
      }

      if (!razorpayLoaded) {
        showMsg("Payment SDK is still loading. Please try again.", "error");
        return;
      }
      await handleRazorpayCheckout(order);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg =
        e?.response?.data?.message ??
        (err instanceof Error ? err.message : "Payment checkout failed");
      if (msg.toLowerCase().includes("already enrolled")) {
        await refetchEnrollment();
        router.push(`/courses/${id}/learn`);
      } else if (msg === "cancelled") {
        showMsg("Payment was cancelled. You can retry anytime.", "error");
      } else {
        showMsg(msg, "error");
      }
    } finally {
      setProcessing(false);
    }
  }, [
    course,
    user,
    selectedPlan,
    couponCode,
    createOrder,
    cashfreeLoaded,
    razorpayLoaded,
    handleCashfreeCheckout,
    handleRazorpayCheckout,
    refetchEnrollment,
    id,
    router,
  ]);

  const authorized = hasHydrated && Boolean(user);

  if (!authorized || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !course) return notFound();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans pb-16">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link
            href={`/courses/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course Overview
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            100% Secure Checkout
          </div>
        </div>
      </header>

      {/* Main Payment Overview Container */}
      <main className="mx-auto max-w-6xl px-6 pt-8">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Checkout & Payment</span>
          <h1 className="mt-1 text-3xl font-extrabold text-white">Choose Your Learning Track</h1>
          <p className="mt-1 text-sm text-slate-400">
            Select the plan that fits your learning goal for <span className="text-white font-medium">{course.title}</span>.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* LEFT SIDE: Plan Selector Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* PLAN 1: BASIC COURSE (₹499) */}
            <div
              onClick={() => handlePlanSelect("BASIC")}
              className={cn(
                "relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300",
                selectedPlan === "BASIC"
                  ? "border-blue-500 bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 shadow-xl ring-2 ring-blue-500/30"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">Direct Course Learning</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        Basic Plan
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Compact 60–90 min course videos + assessment</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-white">₹{basicPrice}</span>
                  <span className="block text-[11px] text-slate-400">One-time payment</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Full access to 60–90 min compact course video series</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Course learning assessment & quiz evaluation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-blue-400 shrink-0" />
                  <span>Verified Course Completion Certificate</span>
                </li>
              </ul>
            </div>

            {/* PLAN 2: DIRECT2HIRE 5-STEP (₹4999) */}
            <div
              onClick={() => handlePlanSelect("D2H")}
              className={cn(
                "relative rounded-2xl border-2 p-6 cursor-pointer transition-all duration-300 overflow-hidden",
                selectedPlan === "D2H"
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 shadow-xl ring-2 ring-emerald-500/30"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900",
              )}
            >
              {/* Recommended Badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Career Transformation
              </div>

              <div className="flex items-start justify-between gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">Direct2Hire 5-Step Program</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Full Track
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">120-Day structured hiring & career program</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-white">₹{d2hPrice}</span>
                  <span className="block text-[11px] text-slate-400">Complete Program</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                <li className="flex items-center gap-2.5 font-medium text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Everything in Basic Plan + 120-Day Detailed Curriculum</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>1-on-1 Career Counselling Session & Personal Roadmap</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>8-Week Real Industry Internship Tasks & Professional Review</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Retakeable Placement Assessment & Hiring Qualification</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Mock Technical Interview with Expert Feedback & Placement Support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Payment Overview & Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl sticky top-24">
              <h2 className="text-lg font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
                Order Summary
              </h2>

              {/* Course & Plan Info */}
              <div className="mt-4 flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                {course.thumbnail ? (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    width={56}
                    height={56}
                    className="rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400 truncate">{course.title}</p>
                  <p className="text-sm font-bold text-white truncate">
                    {selectedPlan === "BASIC" ? "Basic Course Plan (₹499)" : "Direct2Hire 5-Step Program (₹4999)"}
                  </p>
                </div>
              </div>

              {/* Coupon Input */}
              <div className="mt-5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Tag className="h-3.5 w-3.5 text-blue-400" /> Have a Coupon Code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono uppercase text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="mt-1.5 text-xs text-rose-400">{couponError}</p>}
                {couponSuccess && <p className="mt-1.5 text-xs text-emerald-400 font-medium">{couponSuccess}</p>}
              </div>

              {/* Price Calculation */}
              <div className="mt-6 space-y-2 border-t border-slate-800 pt-4 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Plan Price</span>
                  <span>₹{originalPrice}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount ({appliedDiscountPercent}%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Taxes &amp; Fees</span>
                  <span className="text-emerald-400">Included</span>
                </div>
                <div className="flex justify-between items-baseline border-t border-slate-800 pt-3 text-base font-bold text-white">
                  <span>Total Amount</span>
                  <span className="text-2xl font-black text-blue-400">₹{finalPrice}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                disabled={processing}
                onClick={handleCheckout}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Payment…
                  </>
                ) : (
                  <>
                    Proceed to Pay ₹{finalPrice}
                  </>
                )}
              </button>

              {message && (
                <div
                  className={cn(
                    "mt-4 rounded-xl border px-4 py-3 text-xs font-medium text-center",
                    message.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-300",
                  )}
                >
                  {message.text}
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-5 border-t border-slate-800/80 pt-4 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Razorpay / Cashfree
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-amber-400" /> Certificate Included
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

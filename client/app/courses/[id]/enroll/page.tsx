"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Briefcase, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { enrollCourse } from "@/lib/coursesApi";
import { useCourse } from "@/hooks/queries/useCourse";
import { useEnrollment } from "@/hooks/queries/useEnrollment";
import { useAppSelector } from "@/store/hooks";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCashfree } from "@/hooks/useCashfree";
import { useCreateOrder } from "@/hooks/mutations/useCreateOrder";
import { useVerifyPayment } from "@/hooks/mutations/useVerifyPayment";
import type { CreateOrderResponse } from "@/lib/paymentApi";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DIRECT2HIRE_FULL_ACCESS_PRICE = 4999;
const DIRECT2HIRE_ENROLL_PATH = "/direct2hire/enroll";

export default function CourseEnrollPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
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
  const isFree = course?.price === 0;

  const [tier, setTier] = useState<"COURSE" | "FULL">("COURSE");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(
    null,
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace(`/login?redirect=/courses/${id}/enroll`);
    }
  }, [hasHydrated, user, id, router]);

  useEffect(() => {
    if (enrolled) {
      router.replace(`/courses/${id}/learn`);
    }
  }, [enrolled, id, router]);

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
          description: course.title,
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
    [course, user, verifyPayment, refetchEnrollment, id, router],
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

  const handleEnrollThisCourse = useCallback(async () => {
    if (!course || !user) return;
    setProcessing(true);
    setMessage(null);

    try {
      if (isFree) {
        await enrollCourse(course.id);
        await refetchEnrollment();
        showMsg("You're enrolled! Redirecting to your course…", "success");
        setTimeout(() => router.push(`/courses/${id}/learn`), 1000);
        return;
      }

      const order = await createOrder(course.id);

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
        (err instanceof Error ? err.message : "Enrollment failed");
      if (msg.toLowerCase().includes("already enrolled")) {
        await refetchEnrollment();
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
    isFree,
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !course) return notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/courses/${id}`}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to course
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Enroll in {course.title}</h1>
          <p className="mt-2 text-sm text-slate-600">Choose how you want to get started.</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTier("COURSE")}
            className={cn(
              "rounded-2xl border p-6 text-left transition",
              tier === "COURSE"
                ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <BookOpen className="h-5 w-5 text-slate-600" />
              </div>
              {tier === "COURSE" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">This Course Only</h3>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {isFree ? "Free" : `₹${course.price}`}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Full course access and a certificate after completing its assessment.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTier("FULL")}
            className={cn(
              "rounded-2xl border p-6 text-left transition",
              tier === "FULL"
                ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              {tier === "FULL" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                  <Check className="h-3.5 w-3.5 text-white" />
                </span>
              )}
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Direct2Hire Full Access
            </h3>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ₹{DIRECT2HIRE_FULL_ACCESS_PRICE}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Everything in Course Only, plus your Direct2Hire dashboard —
              internship tasks, mock interview, and job placement journey.
            </p>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <button
            type="button"
            disabled={processing}
            onClick={tier === "COURSE" ? handleEnrollThisCourse : () => router.push(DIRECT2HIRE_ENROLL_PATH)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold
                       text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : tier === "COURSE" ? (
              <>Pay {isFree ? "" : `₹${course.price}`} &amp; Continue</>
            ) : (
              <>Continue to Direct2Hire</>
            )}
          </button>

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
    </div>
  );
}

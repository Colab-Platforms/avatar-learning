"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useSelector } from "react-redux";
import {
  emptyLeadFormValues,
  leadSchema,
  type LeadFormValues,
} from "@/lib/counselling/counsellingSchema";
import { useDirect2HireCheckout } from "@/hooks/useDirect2HireCheckout";
import type { RootState } from "@/store";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

export default function Direct2HireEnrollPage() {
  const router = useRouter();
  const { user, hasHydrated } = useSelector((state: RootState) => state.auth);
  const { enroll, processing, message, enrolled } = useDirect2HireCheckout();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login?redirect=/direct2hire/enroll");
    }
  }, [hasHydrated, user, router]);

  const authorized = hasHydrated && Boolean(user);

  useEffect(() => {
    if (enrolled) {
      router.replace("/dashboard");
    }
  }, [enrolled, router]);

  const defaultValues = useMemo<LeadFormValues>(() => {
    const fullName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      fullName,
      email: user?.email ?? "",
      phoneNumber: user?.phoneNo ?? "",
      institutionName: "",
      currentEducation: "",
      city: user?.state ?? "",
      state: user?.state ?? "",
    };
  }, [user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyLeadFormValues,
    values: defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    await enroll(values);
  });

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/direct2hire"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Direct2Hire
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Enroll in Direct2Hire
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Fill in your details, then complete a one-time payment of ₹999 to
            unlock your Direct2Hire dashboard.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="text-lg font-bold text-slate-800">Basic Details</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tell us a little about yourself before proceeding to payment.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className={labelCls}>
                Full Name
              </label>
              <input
                id="fullName"
                {...register("fullName")}
                placeholder="Your full name"
                className={inputCls}
              />
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={labelCls}>
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className={inputCls}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className={labelCls}>
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                {...register("phoneNumber")}
                placeholder="+91"
                className={inputCls}
              />
              {errors.phoneNumber && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="institutionName" className={labelCls}>
                School / College
              </label>
              <input
                id="institutionName"
                {...register("institutionName")}
                placeholder="Institution name"
                className={inputCls}
              />
              {errors.institutionName && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.institutionName.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="currentEducation" className={labelCls}>
                Grade / Year of Study
              </label>
              <input
                id="currentEducation"
                {...register("currentEducation")}
                placeholder="e.g. Class 12 / 2nd Year B.Com"
                className={inputCls}
              />
              {errors.currentEducation && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.currentEducation.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="city" className={labelCls}>
                City
              </label>
              <input
                id="city"
                {...register("city")}
                placeholder="Your city"
                className={inputCls}
              />
              {errors.city && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="state" className={labelCls}>
                State
              </label>
              <input
                id="state"
                {...register("state")}
                placeholder="Your state"
                className={inputCls}
              />
              {errors.state && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.state.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">Payment</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Complete your enrollment with a one-time payment of ₹999.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Payment…
                </>
              ) : (
                <>Pay ₹999 &amp; Continue</>
              )}
            </button>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Payments are secured and verified server-side. Your details are
              only saved after a successful payment.
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
        </form>
      </div>
    </div>
  );
}

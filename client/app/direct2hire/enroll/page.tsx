"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CreditCard, Loader2, Lock } from "lucide-react";
import { useSelector } from "react-redux";
import {
  emptyLeadFormValues,
  leadSchema,
  type LeadFormValues,
} from "@/lib/counselling/counsellingSchema";
import { useDirect2HireLead } from "@/hooks/queries/useDirect2HireLead";
import {
  useDevContinueAsPaid,
  useUpsertDirect2HireLead,
} from "@/hooks/mutations/useDirect2HireLead";
import type { RootState } from "@/store";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

export default function Direct2HireEnrollPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [authorized, setAuthorized] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const { data: lead, isLoading: leadLoading } = useDirect2HireLead();
  const upsertLead = useUpsertDirect2HireLead();
  const devContinue = useDevContinueAsPaid();
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) {
        router.replace("/login?redirect=/direct2hire/enroll");
        return;
      }
      setAuthorized(true);
    } catch {
      router.replace("/login?redirect=/direct2hire/enroll");
    }
  }, [router]);

  const defaultValues = useMemo<LeadFormValues>(() => {
    const fullName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      fullName: lead?.fullName ?? fullName,
      email: lead?.email ?? user?.email ?? "",
      phoneNumber: lead?.phoneNumber ?? user?.phoneNo ?? "",
      institutionName: lead?.institutionName ?? "",
      currentEducation: lead?.currentEducation ?? "",
      city: lead?.city ?? user?.state ?? "",
      state: lead?.state ?? user?.state ?? "",
    };
  }, [lead, user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyLeadFormValues,
    values: defaultValues,
  });

  useEffect(() => {
    if (lead) {
      setDetailsSaved(true);
    }
  }, [lead]);

  const onSubmit = handleSubmit(async (values) => {
    await upsertLead.mutateAsync(values);
    setDetailsSaved(true);
  });

  const handleDevContinue = async () => {
    await devContinue.mutateAsync();
    router.push("/dashboard/assessment");
  };

  if (!authorized || leadLoading) {
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
            Complete your basic details to begin your career journey. Payment
            will be enabled once our gateway integration is live.
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

          <button
            type="submit"
            disabled={upsertLead.isPending}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {upsertLead.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Details"
            )}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <CreditCard className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">Payment</h2>
              <p className="mt-1 text-sm text-slate-500">
                Complete your enrollment with a one-time payment of ₹499.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              Payment integration coming soon.
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Our payment gateway is being set up. You&apos;ll be able to pay
              securely once verification is complete.
            </p>
          </div>

          <button
            type="button"
            disabled
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed sm:w-auto"
          >
            <Lock className="h-4 w-4" />
            Pay ₹499 — Coming Soon
          </button>

          {isDev && detailsSaved && (
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                Development only
              </p>
              <button
                type="button"
                onClick={handleDevContinue}
                disabled={devContinue.isPending}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {devContinue.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Continuing...
                  </>
                ) : (
                  "Continue as Paid User"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

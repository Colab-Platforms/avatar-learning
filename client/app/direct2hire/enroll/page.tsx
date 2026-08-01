"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CreditCard, Loader2, ShieldCheck, Tag, X } from "lucide-react";
import { useSelector } from "react-redux";
import {
  emptyLeadFormValues,
  leadSchema,
  type LeadFormValues,
} from "@/lib/counselling/counsellingSchema";
import { useDirect2HireCheckout } from "@/hooks/useDirect2HireCheckout";
import { upsertDirect2HireLead } from "@/lib/direct2hire/leadApi";
import {
  applyCoupon,
  getReferralDiscount,
  type ApplyCouponResponse,
  type ReferralDiscountResponse,
} from "@/lib/paymentApi";
import type { RootState } from "@/store";
import { cn } from "@/lib/utils";
import {
  getCountries,
  getStatesForCountry,
  getCitiesForState,
  getCountryIsoCode,
  getStateIsoCode,
  DEFAULT_COUNTRY_CODE,
} from "@/data/countries";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";

/* Fetched-from-profile values are shown read-only instead of asked again. */
function FetchedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className={cn(inputCls, "bg-slate-50 text-slate-500")}>{value}</div>
    </div>
  );
}

export default function Direct2HireEnrollPage() {
  const router = useRouter();
  const { user, hasHydrated } = useSelector((state: RootState) => state.auth);
  const { enroll, processing, message, enrolled, secondsLeft } = useDirect2HireCheckout();
  const [savingLead, setSavingLead] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [referralDiscount, setReferralDiscount] =
    useState<ReferralDiscountResponse | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login?redirect=/direct2hire/enroll");
      return;
    }
    if (user.profileCompleted === false) {
      router.replace("/complete-profile");
    }
  }, [hasHydrated, user, router]);

  const authorized = hasHydrated && Boolean(user);

  // Referred users get their discount auto-applied — nothing to type. Only
  // relevant when no coupon is in play; a manually applied coupon always wins.
  useEffect(() => {
    if (!authorized) return;
    getReferralDiscount()
      .then(setReferralDiscount)
      .catch(() => setReferralDiscount(null));
  }, [authorized]);

  const activeDiscount = appliedCoupon ?? referralDiscount;

  // Guards against landing on this page while already enrolled (e.g. a stale
  // bookmark). The checkout flow itself navigates to /direct2hire/success on
  // completion, so it flips `checkoutStarted` first to skip this redirect.
  const checkoutStarted = useRef(false);
  useEffect(() => {
    if (enrolled && !checkoutStarted.current) {
      router.replace("/dashboard");
    }
  }, [enrolled, router]);

  const hasProfileCity = Boolean(user?.city);
  const hasProfileState = Boolean(user?.state);
  const hasProfileCountry = Boolean(user?.country);

  // Country/state are edited as isoCode (matches the register page); city is
  // edited as its plain name. Already-known profile values are stored as-is
  // and shown read-only, so they never need an isoCode round-trip.
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
      country: hasProfileCountry ? user!.country! : DEFAULT_COUNTRY_CODE,
      state: hasProfileState ? user!.state! : "",
      city: hasProfileCity ? user!.city! : "",
    };
  }, [user, hasProfileCountry, hasProfileState, hasProfileCity]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyLeadFormValues,
    values: defaultValues,
  });

  const countries = useMemo(() => getCountries(), []);

  const countryIso = hasProfileCountry
    ? getCountryIsoCode(user!.country!) || DEFAULT_COUNTRY_CODE
    : watch("country");

  const states = useMemo(
    () => getStatesForCountry(countryIso),
    [countryIso],
  );

  const stateIso = hasProfileState
    ? getStateIsoCode(countryIso, user!.state!)
    : watch("state");

  const cities = useMemo(
    () => getCitiesForState(countryIso, stateIso),
    [countryIso, stateIso],
  );

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("country", e.target.value, { shouldValidate: true });
    setValue("state", "", { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("state", e.target.value, { shouldValidate: true });
    setValue("city", "", { shouldValidate: true });
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError("");
    setCouponApplying(true);
    try {
      const result = await applyCoupon(code);
      setAppliedCoupon(result);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAppliedCoupon(null);
      setCouponError(e?.response?.data?.message ?? "Invalid coupon code");
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const onSubmit = handleSubmit(async (values) => {
    setLeadError("");
    setSavingLead(true);

    // Country/state are isoCode while editable — resolve to the display name
    // before persisting, same as the register page. Already-known profile
    // values are the name already, so they pass through untouched.
    const resolvedValues: LeadFormValues = {
      ...values,
      country: hasProfileCountry
        ? values.country
        : (countries.find((c) => c.isoCode === values.country)?.name ?? values.country),
      state: hasProfileState
        ? values.state
        : (states.find((s) => s.isoCode === values.state)?.name ?? values.state),
    };

    try {
      // Persist details before touching the payment gateway, so we still have
      // a lead on file even if the user abandons or the payment fails.
      await upsertDirect2HireLead(resolvedValues);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setSavingLead(false);
      setLeadError(e?.response?.data?.message ?? "Couldn't save your details. Please try again.");
      return;
    }
    setSavingLead(false);

    checkoutStarted.current = true;
    await enroll(resolvedValues, appliedCoupon?.code);
  });

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
            Complete the payment in the Razorpay window. Don&apos;t close or refresh this tab.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-mono text-2xl font-semibold text-slate-800 shadow-sm">
          {mm}:{ss}
        </div>
        <p className="text-xs text-slate-400">
          {secondsLeft > 0
            ? "We'll flag this if it takes longer than expected."
            : "This is taking longer than expected — check your dashboard shortly for the payment status."}
        </p>
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

            {hasProfileCountry ? (
              <FetchedField label="Country" value={user!.country!} />
            ) : (
              <div>
                <label htmlFor="country" className={labelCls}>
                  Country
                </label>
                <select
                  id="country"
                  value={watch("country")}
                  onChange={handleCountryChange}
                  className={cn(inputCls, "cursor-pointer")}
                >
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.country.message}
                  </p>
                )}
              </div>
            )}

            {hasProfileState ? (
              <FetchedField label="State" value={user!.state!} />
            ) : (
              <div>
                <label htmlFor="state" className={labelCls}>
                  State
                </label>
                <select
                  id="state"
                  value={watch("state")}
                  onChange={handleStateChange}
                  disabled={states.length === 0}
                  className={cn(inputCls, "cursor-pointer disabled:opacity-50")}
                >
                  <option value="">
                    {states.length === 0 ? "No states" : "Select state"}
                  </option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.state.message}
                  </p>
                )}
              </div>
            )}

            {hasProfileCity ? (
              <FetchedField label="City" value={user!.city!} />
            ) : (
              <div>
                <label htmlFor="city" className={labelCls}>
                  City
                </label>
                <select
                  id="city"
                  value={watch("city")}
                  onChange={(e) =>
                    setValue("city", e.target.value, { shouldValidate: true })
                  }
                  disabled={!watch("state") || cities.length === 0}
                  className={cn(inputCls, "cursor-pointer disabled:opacity-50")}
                >
                  <option value="">
                    {!watch("state")
                      ? "Select state"
                      : cities.length === 0
                        ? "No cities"
                        : "Select city"}
                  </option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="mt-1.5 text-xs text-red-600">
                    {errors.city.message}
                  </p>
                )}
              </div>
            )}
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

            {referralDiscount && !appliedCoupon && (
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <Tag className="h-4 w-4" />
                <span>
                  Referral discount applied automatically — {referralDiscount.discountPercent}% off
                </span>
              </div>
            )}

            {/* coupon code */}
            <div className="mt-6">
              <label htmlFor="couponCode" className={labelCls}>
                Coupon Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-800">
                    <Tag className="h-4 w-4" />
                    <span className="font-semibold">{appliedCoupon.code}</span>
                    <span>applied — {appliedCoupon.discountPercent}% off</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
                    aria-label="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="couponCode"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className={cn(inputCls, "flex-1")}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponApplying || !couponInput.trim()}
                    className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {couponApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-1.5 text-xs text-red-600">{couponError}</p>
              )}
            </div>

            {activeDiscount && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Original amount</span>
                  <span className="line-through">
                    ₹{activeDiscount.originalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-emerald-700">
                  <span>Discount ({activeDiscount.discountPercent}%)</span>
                  <span>-₹{activeDiscount.discountAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 font-bold text-slate-800">
                  <span>You pay</span>
                  <span>₹{activeDiscount.finalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={processing || savingLead}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {savingLead ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Details…
                </>
              ) : processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Payment…
                </>
              ) : (
                <>
                  Pay ₹{(activeDiscount?.finalAmount ?? 999).toLocaleString("en-IN")} &amp; Continue
                </>
              )}
            </button>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your details are saved as soon as you submit, before payment —
              payments themselves are secured and verified server-side.
            </p>

            {leadError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {leadError}
              </div>
            )}

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

"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Percent,
  Briefcase,
  LayoutDashboard,
  MessageCircle,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  Loader2,
  Check,
  User,
  GraduationCap,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollReveal, AnimateOnScroll, ShinyText } from "@/components/ui";
import { useAppSelector } from "@/store/hooks";
import {
  applyAsPartner,
  getMyPartner,
  PARTNER_ONBOARDING_DRAFT_KEY,
  type Partner,
  type PartnerType,
} from "@/lib/partnersApi";
import {
  getCountries,
  getStatesForCountry,
  DEFAULT_COUNTRY_CODE,
} from "@/data/countries";

const SUPPORT_EMAIL = "support@avatarindia.com";

const PURPOSE_PLACEHOLDER: Record<PartnerType, string> = {
  INDIVIDUAL: "e.g. I mentor students and want to refer them to Direct2Hire",
  INSTITUTE: "e.g. Placement support for our final-year students",
  CORPORATE: "e.g. Hiring pipeline for entry-level AI roles",
};

/* ─── data ─────────────────────────────────────────────────────────── */

const STEPS = [
  "Apply in 2 minutes",
  "Get your referral code",
  "Earn on every success",
];

const BENEFITS = [
  {
    icon: Percent,
    title: "Earn Attractive Referral Bonuses",
    desc: "Register as an Avatar India Partner, receive your exclusive partner code, and earn rewards on every successful enrollment.",
  },
  {
    icon: Briefcase,
    title: "Enhance Student Placement Outcomes",
    desc: "Boost Student Employability Help your students become AI job-ready through expert-led training, real-world projects, internship opportunities, and placement support—completely free for your organization.",
  },
  {
    icon: LayoutDashboard,
    title: "Dedicated Partner Dashboard",
    desc: "Track your referrals and earnings in real time through your exclusive partner dashboard.",
  },
];

const INSTITUTE_TYPES = [
  "Engineering College",
  "University",
  "Polytechnic / Diploma College",
  "Management Institute",
  "Arts & Science College",
  "Other",
];

const PROFESSIONS = [
  "Student",
  "Working Professional",
  "Educator / Faculty",
  "Freelancer / Consultant",
  "Other",
];

const PARTNER_TABS: { id: PartnerType; label: string; icon: typeof User }[] = [
  { id: "INDIVIDUAL", label: "Individual", icon: User },
  { id: "INSTITUTE", label: "College / Institute", icon: GraduationCap },
  { id: "CORPORATE", label: "Corporate", icon: Building2 },
];

const FAQS = [
  {
    q: "How long does it take to get approved?",
    a: "Most applications are reviewed within 48 hours. Once approved, you'll receive your unique referral code immediately.",
  },
  {
    q: "How do the referral bonuses work?",
    a: "Every successful enrollment through your unique partner code earns your organization or you as an individual partner attractive rewards. Track enrollments, rewards, and payouts through your partner dashboard, with settlements processed monthly.",
  },
  {
    q: "Is there any cost to partner with you?",
    a: "No. Joining the Avatar India Partner Program is completely free. There are no registration fees, subscription charges, or hidden costs to become a partner, receive your unique partner code, or access your Partner Dashboard.",
  },
  {
    q: "Will I get access to a dashboard?",
    a: "Yes. Approved partners get a dedicated dashboard to track referrals, enrollments, and earnings in real time.",
  },
  {
    q: "What is your Referral Reward Policy?",
    a: (
      <div className="space-y-2">
        <p>
          Referral rewards become eligible for withdrawal 15 days after the
          referred learner successfully enrolls. This verification period helps
          ensure that the enrollment is genuine and active.
        </p>
        <p>
          If the referred learner cancels their enrollment, requests a refund,
          or leaves the program within the first 15 days, the referral will be
          considered cancelled, and the corresponding reward will not be
          eligible for withdrawal.
        </p>
        <div className="mt-3 p-3 rounded-lg  border border-gray-300 text-[12.5px] text-amber-800">
          <strong className="font-semibold text-amber-900">Note: </strong>
          Avatar India reserves the right to review and reject referral rewards
          in cases of fraudulent, duplicate, or invalid referrals, or if the
          referral does not comply with our Partner Program Terms & Conditions.
        </div>
      </div>
    ),
  },
];

const inputCls = cn(
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3",
  "text-[14px] text-slate-800 placeholder-slate-400",
  "focus:outline-none focus:border-blue-500/40 focus:bg-white",
  "focus:ring-2 focus:ring-blue-500/10 transition-all duration-200",
);

/* ─── page ──────────────────────────────────────────────────────────── */

export default function PartnersPage() {
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<PartnerType>("INDIVIDUAL");
  const [form, setForm] = useState({
    organizationName: "",
    contactPerson: "",
    designation: "",
    email: "",
    phone: "",
    instituteType: "",
    country: DEFAULT_COUNTRY_CODE,
    state: "",
    city: "",
    profession: "",
    linkedin: "",
    website: "",
    purpose: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [existingPartner, setExistingPartner] = useState<
    Partner | null | undefined
  >(undefined);

  const switchTab = (tab: PartnerType) => setActiveTab(tab);

  const countries = useMemo(() => getCountries(), []);
  const states = useMemo(
    () => getStatesForCountry(form.country),
    [form.country],
  );

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm((p) => ({ ...p, country: e.target.value, state: "" }));

  useEffect(() => {
    if (!user) {
      setExistingPartner(null);
      return;
    }
    getMyPartner()
      .then(setExistingPartner)
      .catch(() => setExistingPartner(null));
  }, [user]);

  // Convenience prefill only — Individual tab only, field stays fully editable.
  useEffect(() => {
    if (activeTab === "INDIVIDUAL" && user?.email) {
      setForm((p) => ({ ...p, email: user.email }));
    }
  }, [activeTab, user?.email]);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  // Digits only, capped at 10 — matches backend's 10-digit Indian mobile check.
  const setPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({
      ...p,
      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
    }));

  const resetForm = () => {
    setForm({
      organizationName: "",
      contactPerson: "",
      designation: "",
      email: user?.email ?? "",
      phone: "",
      instituteType: "",
      country: "India",
      state: "",
      city: "",
      profession: "",
      linkedin: "",
      website: "",
      purpose: "",
    });
  };

  const needsKyc = activeTab === "INDIVIDUAL" || activeTab === "INSTITUTE";

  // Corporate has no KYC — applies directly from this page.
  const submitCorporateApplication = async () => {
    setErrorMsg("");
    setSubmitting(true);
    try {
      await applyAsPartner({
        type: "CORPORATE",
        organizationName: form.organizationName || undefined,
        contactPerson: form.contactPerson || undefined,
        designation: form.designation || undefined,
        phone: form.phone,
        email: form.email,
        website: form.website || undefined,
        purpose: form.purpose,
      });
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        `Corporate Partnership — ${form.organizationName || form.contactPerson}`,
      )}`;
      setSubmitted(true);
      resetForm();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent("/partners")}`);
      return;
    }

    if (activeTab === "CORPORATE") {
      await submitCorporateApplication();
      return;
    }

    // Individual/Institute: hand off these details to the onboarding page
    // to complete KYC (Aadhar/PAN/bank) — native required-field validation
    // on this form already ran since this is a real submit event. Resolve
    // country/state from ISO codes to display names here, since the
    // onboarding page only composes a plain "City, State, Country" string.
    sessionStorage.setItem(
      PARTNER_ONBOARDING_DRAFT_KEY,
      JSON.stringify({
        type: activeTab,
        ...form,
        country:
          countries.find((c) => c.isoCode === form.country)?.name ??
          form.country,
        state: states.find((s) => s.isoCode === form.state)?.name ?? form.state,
      }),
    );
    router.push("/partners/onboarding");
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen overflow-x-hidden bg-white text-slate-800">
        {/* ── HERO ── */}
        <section className="relative container-x max-w-7xl pt-28 pb-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <ScrollReveal animation="fade-up">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight text-slate-900 mb-4">
                Partner With Us.
                <br />
                Grow Together.
              </h1>
              <p className="text-slate-500 text-[15px] leading-relaxed max-w-lg mb-8">
                Empower your students or workforce with industry-ready AI skills
                while earning attractive rewards through your organization's
                exclusive partner code.
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-10">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-600">
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-4/3 max-w-lg">
                <Image
                  src="/partner-images/partnerimg1.png"
                  alt="Institute partnership"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </ScrollReveal>

            {/* ── APPLY CARD ── */}
            <ScrollReveal animation="fade-left" delay={120}>
              <div
                id="apply"
                className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm scroll-mt-24"
              >
                <h2 className="text-lg font-bold text-slate-800 mb-1">
                  Apply for Partnership
                </h2>
                <p className="text-[13px] text-slate-500 mb-5">
                  Get your unique referral code and start earning.
                </p>

                {user && existingPartner === undefined ? (
                  <div className="py-10 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : user && existingPartner ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center space-y-3">
                    {existingPartner.status === "APPROVED" ? (
                      <>
                        <p className="text-[14px] font-semibold text-slate-800">
                          You&apos;re an approved partner!
                        </p>
                        <p className="text-[13px] text-slate-500">
                          Head to your dashboard for your referral link and
                          earnings.
                        </p>
                        <Link
                          href="/partner-dashboard"
                          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[13px] font-bold text-white
                                     hover:brightness-110 active:scale-[0.98] transition-all duration-250 cursor-pointer shadow-sm"
                          style={{
                            background:
                              "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                          }}
                        >
                          Go to Partner Dashboard{" "}
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </>
                    ) : existingPartner.status === "PENDING" ? (
                      <>
                        <p className="text-[14px] font-semibold text-slate-800">
                          Application under review
                        </p>
                        <p className="text-[13px] text-slate-500">
                          We&apos;re reviewing your partnership application.
                          You&apos;ll hear from us within 48 hours.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-[14px] font-semibold text-slate-800">
                          Application not approved
                        </p>
                        <p className="text-[13px] text-slate-500">
                          Your application wasn&apos;t approved. Reach out if
                          you&apos;d like to discuss.
                        </p>
                        {existingPartner.reviewNote && (
                          <p className="text-[13px] text-slate-600 bg-slate-100 rounded-lg px-4 py-2.5 text-left">
                            <span className="font-bold">Reason: </span>
                            {existingPartner.reviewNote}
                          </p>
                        )}
                        <Link
                          href="/contact"
                          className="inline-block text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Contact Support →
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1 mb-6">
                      {PARTNER_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => switchTab(tab.id)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg py-2.5 px-1 text-[11px] font-bold transition-all duration-200 cursor-pointer",
                            activeTab === tab.id
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-700",
                          )}
                        >
                          <tab.icon className="h-4 w-4" />
                          <span className="text-center leading-tight">
                            {tab.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    {submitted && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 mb-5 font-semibold">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        Application submitted! We&apos;ll be in touch shortly.
                      </div>
                    )}
                    {errorMsg && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mb-5 font-semibold">
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      {activeTab === "INDIVIDUAL" ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={form.contactPerson}
                              onChange={set("contactPerson")}
                              required
                              placeholder="Full Name"
                              className={inputCls}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Email Address *
                              </label>
                              <input
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                                required
                                placeholder="you@example.com"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Phone Number *
                              </label>
                              <input
                                type="tel"
                                inputMode="numeric"
                                value={form.phone}
                                onChange={setPhone}
                                required
                                pattern="[6-9]\d{9}"
                                maxLength={10}
                                title="Enter a valid 10-digit mobile number"
                                placeholder="98765 43210"
                                className={inputCls}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Country
                              </label>
                              <select
                                value={form.country}
                                onChange={handleCountryChange}
                                className={cn(
                                  inputCls,
                                  "appearance-none cursor-pointer",
                                )}
                              >
                                {countries.map((c) => (
                                  <option key={c.isoCode} value={c.isoCode}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                State
                              </label>
                              <select
                                value={form.state}
                                onChange={set("state")}
                                disabled={states.length === 0}
                                className={cn(
                                  inputCls,
                                  "appearance-none cursor-pointer disabled:opacity-50",
                                )}
                              >
                                <option value="">
                                  {states.length === 0
                                    ? "No states available"
                                    : "Select state"}
                                </option>
                                {states.map((s) => (
                                  <option key={s.isoCode} value={s.isoCode}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              City
                            </label>
                            <input
                              type="text"
                              value={form.city}
                              onChange={set("city")}
                              placeholder="City"
                              className={inputCls}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              Current Role / Profession *
                            </label>
                            <select
                              value={form.profession}
                              onChange={set("profession")}
                              required
                              className={cn(
                                inputCls,
                                "appearance-none cursor-pointer",
                              )}
                            >
                              <option value="" disabled>
                                Current Role / Profession
                              </option>
                              {PROFESSIONS.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              LinkedIn Profile
                            </label>
                            <input
                              type="url"
                              value={form.linkedin}
                              onChange={set("linkedin")}
                              placeholder="LinkedIn Profile (optional)"
                              className={inputCls}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              {activeTab === "INSTITUTE"
                                ? "Institute Name"
                                : "Company Name"}{" "}
                              *
                            </label>
                            <input
                              type="text"
                              value={form.organizationName}
                              onChange={set("organizationName")}
                              required
                              placeholder={
                                activeTab === "INSTITUTE"
                                  ? "Institute Name"
                                  : "Company Name"
                              }
                              className={inputCls}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Contact Person *
                              </label>
                              <input
                                type="text"
                                value={form.contactPerson}
                                onChange={set("contactPerson")}
                                required
                                placeholder="Full Name"
                                className={inputCls}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Designation *
                              </label>
                              <input
                                type="text"
                                value={form.designation}
                                onChange={set("designation")}
                                required
                                placeholder="e.g. Principal"
                                className={inputCls}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              Official Email *
                            </label>
                            <input
                              type="email"
                              value={form.email}
                              onChange={set("email")}
                              required
                              placeholder="you@example.com"
                              className={inputCls}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                              Phone Number *
                            </label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              value={form.phone}
                              onChange={setPhone}
                              required
                              pattern="[6-9]\d{9}"
                              maxLength={10}
                              title="Enter a valid 10-digit mobile number"
                              placeholder="98765 43210"
                              className={inputCls}
                            />
                          </div>

                          {activeTab === "INSTITUTE" ? (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                  Institute Type *
                                </label>
                                <select
                                  value={form.instituteType}
                                  onChange={set("instituteType")}
                                  required
                                  className={cn(
                                    inputCls,
                                    "appearance-none cursor-pointer",
                                  )}
                                >
                                  <option value="" disabled>
                                    Institute Type
                                  </option>
                                  {INSTITUTE_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                    Country
                                  </label>
                                  <select
                                    value={form.country}
                                    onChange={handleCountryChange}
                                    className={cn(
                                      inputCls,
                                      "appearance-none cursor-pointer",
                                    )}
                                  >
                                    {countries.map((c) => (
                                      <option key={c.isoCode} value={c.isoCode}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                    State
                                  </label>
                                  <select
                                    value={form.state}
                                    onChange={set("state")}
                                    disabled={states.length === 0}
                                    className={cn(
                                      inputCls,
                                      "appearance-none cursor-pointer disabled:opacity-50",
                                    )}
                                  >
                                    <option value="">
                                      {states.length === 0
                                        ? "No states available"
                                        : "Select state"}
                                    </option>
                                    {states.map((s) => (
                                      <option key={s.isoCode} value={s.isoCode}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={form.city}
                                  onChange={set("city")}
                                  placeholder="City"
                                  className={inputCls}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                Company Website
                              </label>
                              <input
                                type="url"
                                value={form.website}
                                onChange={set("website")}
                                placeholder="Company Website (optional)"
                                className={inputCls}
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          Purpose of Partnership *
                        </label>
                        <textarea
                          value={form.purpose}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, purpose: e.target.value }))
                          }
                          required
                          rows={3}
                          placeholder={PURPOSE_PLACEHOLDER[activeTab]}
                          className={cn(inputCls, "resize-none")}
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3
                                     text-[14px] font-bold text-white hover:brightness-110 active:scale-[0.98]
                                     disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                                     transition-all duration-250 cursor-pointer shadow-sm"
                          style={{
                            background:
                              "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                          }}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Submitting…
                            </>
                          ) : needsKyc ? (
                            "Continue to Onboarding"
                          ) : (
                            "Submit Application"
                          )}
                        </button>
                      </div>

                      <p className="text-center text-[11px] text-slate-400 font-medium">
                        {needsKyc &&
                          "Next: verify your identity with Aadhar, PAN & bank details"}
                        {activeTab === "CORPORATE" &&
                          `Our team will connect within 48 hours to explore partnership opportunities · also emails ${SUPPORT_EMAIL}`}
                      </p>
                    </form>
                  </>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── BENEFITS ── */}
        <div className="h-px w-full bg-slate-200" />
        <section className="container-x max-w-7xl pt-8 pb-14">
          <ScrollReveal animation="fade-up">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Benefits of Partnering With Us
            </h2>
            <p className="text-slate-500 text-[14px] mb-10">
              Empowering organizations. Transforming careers. Growing together.
            </p>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-10 items-stretch">
            <div className="space-y-4 order-2 lg:order-1">
              {BENEFITS.map((b, i) => (
                <AnimateOnScroll key={b.title} delay={i * 80}>
                  <div className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                      <b.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-slate-800 mb-1">
                        {b.title}
                      </h3>
                      <p className="text-[13px] text-slate-500 leading-relaxed">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>

            <ScrollReveal
              animation="fade-left"
              delay={100}
              className="order-1 lg:order-2 h-72 lg:h-full"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src="/partner-images/partnerimg2.png"
                  alt="Students in classroom"
                  className="absolute inset-0 w-full h-full object-cover block"
                />
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <div className="h-px w-full bg-slate-200" />
        <section className="container-x max-w-7xl py-6">
          <ScrollReveal animation="fade-up">
            <div className="rounded-3xl bg-blue-50/70 border border-blue-100 px-8 py-14 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-3">
                <Building2 className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                <ShinyText
                  text="Partner With Us"
                  color="#1d4ed8"
                  shineColor="#93c5fd"
                  speed={2.5}
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 max-w-2xl mx-auto mb-4">
                Ready to empower future talent while creating a new{" "}
                <span className="text-blue-600">revenue opportunity</span>?
              </h2>
              <p className="text-slate-500 text-[14px] mb-8">
                Join 100+ partner organizations already transforming careers
                through the Avatar India Direct2Hire Partner Program.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    router.push(
                      `/login?returnTo=${encodeURIComponent("/partners")}`,
                    );
                    return;
                  }
                  document
                    .getElementById("apply")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[14px] font-bold text-white
                           hover:brightness-110 active:scale-[0.98] transition-all duration-250 cursor-pointer shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)",
                }}
              >
                Apply For Partnership <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </ScrollReveal>
        </section>

        {/* ── FAQ ── */}
        <div className="h-px w-full bg-slate-200" />
        <section className="container-x max-w-7xl py-16">
          <ScrollReveal animation="fade-up">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-xs backdrop-blur-md mb-2">
              <MessageCircle className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
              <ShinyText
                text="Frequently Asked Questions"
                color="#1d4ed8"
                shineColor="#93c5fd"
                speed={2.5}
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-10 max-w-lg">
              Got Questions? We&apos;ve Got You Covered.
            </h2>
          </ScrollReveal>

          <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
            <ScrollReveal animation="fade-up" delay={80}>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 mb-4">
                  <MessageCircle className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-1.5">
                  Still have questions?
                </h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                  We&apos;re here to help — reach out to our team and we&apos;ll
                  help you.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Contact Support <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </ScrollReveal>

            <div className="space-y-3">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <AnimateOnScroll key={faq.q} delay={i * 60}>
                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? -1 : i)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
                      >
                        <span className="text-[14px] font-semibold text-slate-800">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-[13px] text-slate-500 leading-relaxed">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

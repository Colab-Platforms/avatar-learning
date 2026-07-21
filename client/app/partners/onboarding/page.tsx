"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Upload, ArrowLeft, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAppSelector } from "@/store/hooks";
import {
  applyAsPartner,
  getMyPartner,
  uploadPartnerKycFile,
  PARTNER_ONBOARDING_DRAFT_KEY,
  type PartnerType,
} from "@/lib/partnersApi";

interface OnboardingDraft {
  type: PartnerType;
  organizationName: string;
  contactPerson: string;
  designation: string;
  email: string;
  phone: string;
  instituteType: string;
  country: string;
  state: string;
  city: string;
  profession: string;
  linkedin: string;
  website: string;
  purpose: string;
}

const inputCls = cn(
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3",
  "text-[14px] text-slate-800 placeholder-slate-400",
  "focus:outline-none focus:border-blue-500/40 focus:bg-white",
  "focus:ring-2 focus:ring-blue-500/10 transition-all duration-200",
);

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);

  const [draft, setDraft] = useState<OnboardingDraft | null | undefined>(undefined);
  const [kyc, setKyc] = useState({
    aadharNumber: "",
    panNumber: "",
    bankAccountNumber: "",
    bankIfsc: "",
  });
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);
  const [aadharFileUrl, setAadharFileUrl] = useState("");
  const [panFileUrl, setPanFileUrl] = useState("");
  const [bankProofFileUrl, setBankProofFileUrl] = useState("");
  const [uploadingField, setUploadingField] = useState<"aadhar" | "pan" | "bank" | null>(null);
  const [uploadErr, setUploadErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auth guard
  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace(`/login?returnTo=${encodeURIComponent("/partners/onboarding")}`);
    }
  }, [hasHydrated, user, router]);

  // Load the step-1 draft; bounce back to /partners if it's missing, or to
  // the dashboard if this account already has a partner application.
  useEffect(() => {
    if (!user) return;
    getMyPartner()
      .then((existing) => {
        if (existing) {
          router.replace("/partner-dashboard");
          return;
        }
        const raw = sessionStorage.getItem(PARTNER_ONBOARDING_DRAFT_KEY);
        if (!raw) {
          router.replace("/partners");
          return;
        }
        setDraft(JSON.parse(raw));
      })
      .catch(() => router.replace("/partners"));
  }, [user, router]);

  const setKycField =
    (field: keyof typeof kyc) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setKyc((p) => ({ ...p, [field]: e.target.value }));

  const handleKycFileChange =
    (kind: "aadhar" | "pan" | "bank") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadErr("");
      setUploadingField(kind);
      try {
        const url = await uploadPartnerKycFile(file);
        if (kind === "aadhar") {
          setAadharFile(file);
          setAadharFileUrl(url);
        } else if (kind === "pan") {
          setPanFile(file);
          setPanFileUrl(url);
        } else {
          setBankProofFile(file);
          setBankProofFileUrl(url);
        }
      } catch {
        setUploadErr("File upload failed. Please try again.");
      } finally {
        setUploadingField(null);
      }
    };

  const handleBack = () => router.push("/partners");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!aadharFileUrl || !panFileUrl || !bankProofFileUrl) {
      setErrorMsg("Please upload all three KYC documents before submitting.");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      await applyAsPartner({
        type: draft.type,
        organizationName: draft.organizationName || undefined,
        contactPerson: draft.contactPerson || undefined,
        designation: draft.designation || undefined,
        instituteType: draft.type === "INSTITUTE" ? draft.instituteType : undefined,
        phone: draft.phone,
        email: draft.email,
        location:
          [draft.city, draft.state, draft.country].filter(Boolean).join(", ") ||
          undefined,
        profession: draft.type === "INDIVIDUAL" ? draft.profession || undefined : undefined,
        linkedin: draft.type === "INDIVIDUAL" ? draft.linkedin || undefined : undefined,
        purpose: draft.purpose,
        aadharNumber: kyc.aadharNumber,
        aadharFileUrl,
        panNumber: kyc.panNumber,
        panFileUrl,
        bankAccountNumber: kyc.bankAccountNumber,
        bankIfsc: kyc.bankIfsc,
        bankProofFileUrl,
      });
      sessionStorage.removeItem(PARTNER_ONBOARDING_DRAFT_KEY);
      router.push("/partner-dashboard");
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ?? "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasHydrated || !user || draft === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!draft) return null; // redirect already in-flight

  const docFields: {
    kind: "aadhar" | "pan" | "bank";
    label: string;
    file: File | null;
    url: string;
  }[] = [
    { kind: "aadhar", label: "Aadhar Card", file: aadharFile, url: aadharFileUrl },
    { kind: "pan", label: "PAN Card", file: panFile, url: panFileUrl },
    { kind: "bank", label: "Passbook / Cancelled Cheque", file: bankProofFile, url: bankProofFileUrl },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen overflow-x-hidden bg-white text-slate-800 pt-28 pb-16">
        <div className="container-x max-w-xl mx-auto">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-700 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                <Handshake className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Complete Your Onboarding</h1>
                <p className="text-[13px] text-slate-500">
                  Verify your identity to finish your partner application
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 mt-5 font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Aadhar Number *
                </label>
                <input
                  type="text"
                  value={kyc.aadharNumber}
                  onChange={setKycField("aadharNumber")}
                  required
                  maxLength={12}
                  placeholder="12-digit Aadhar number"
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  PAN Number *
                </label>
                <input
                  type="text"
                  value={kyc.panNumber}
                  onChange={setKycField("panNumber")}
                  required
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  className={cn(inputCls, "uppercase")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    value={kyc.bankAccountNumber}
                    onChange={setKycField("bankAccountNumber")}
                    required
                    placeholder="Account number"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    value={kyc.bankIfsc}
                    onChange={setKycField("bankIfsc")}
                    required
                    maxLength={11}
                    placeholder="e.g. SBIN0001234"
                    className={cn(inputCls, "uppercase")}
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {docFields.map((d) => (
                <div key={d.kind} className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Upload {d.label} *
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-all duration-200">
                    <Upload className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-[13px] text-slate-500 truncate flex-1">
                      {uploadingField === d.kind ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                        </span>
                      ) : d.url ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                          <Check className="h-3.5 w-3.5" /> {d.file?.name}
                        </span>
                      ) : (
                        "Click to upload (PDF, JPG, PNG)"
                      )}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                      className="sr-only"
                      onChange={handleKycFileChange(d.kind)}
                    />
                  </label>
                </div>
              ))}

              {uploadErr && <p className="text-[12px] text-red-600 font-medium">{uploadErr}</p>}

              <button
                type="submit"
                disabled={submitting || uploadingField !== null}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3
                           text-[14px] font-bold text-white hover:brightness-110 active:scale-[0.98]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100
                           transition-all duration-250 cursor-pointer shadow-sm"
                style={{ background: "linear-gradient(135deg, #153C66 0%, #2A78CC 100%)" }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Submit Application"
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400 font-medium">
                We&apos;ll review and get back within 48 hours
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

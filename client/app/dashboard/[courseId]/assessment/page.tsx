"use client";

import { useState } from "react";
import { ClipboardCheck, Loader2, ArrowRight } from "lucide-react";
import CounsellingForm from "@/components/counselling/CounsellingForm";
import CounsellingRecommendation from "@/components/counselling/CounsellingRecommendation";
import { useCounsellingProfile } from "@/hooks/queries/useCounsellingProfile";
import { AdvisorIllustration } from "@/components/illustrations/AdvisorIllustration";

export default function AssessmentPage() {
  const { data, isLoading } = useCounsellingProfile();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const profile = data?.profile ?? null;

  if (profile?.isSubmitted) {
    return (
      <div className="mx-auto w-full max-w-5xl p-8">
        <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
          <ClipboardCheck size={20} className="text-blue-600" />
          AI Assessment
        </h1>
        <CounsellingRecommendation
          profile={profile}
          recommendation={data?.recommendation ?? null}
          recommendationStatus={data?.recommendationStatus ?? "none"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <ClipboardCheck size={20} className="text-blue-600" />
          AI Assessment
        </h1>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {!showForm ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Before we meet, help us understand you
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                A short, ten-question assessment so we can map your interests,
                goals, and personality to the right learning path. Takes about 5
                minutes — then our AI will recommend the best Direct2Hire course
                for you.
              </p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Start AI Assessment
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <CounsellingForm onCancel={() => setShowForm(false)} />
          )}
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex w-full justify-center rounded-xl border border-slate-100 bg-slate-50 p-4">
              <AdvisorIllustration className="h-auto w-full max-w-[240px]" />
            </div>
            <h3 className="mt-4 text-center text-base font-semibold text-slate-800">
              Personalized Course Match
            </h3>
            <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
              Your answers power an AI recommendation that compares your profile
              against our Direct2Hire courses and picks the single best fit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

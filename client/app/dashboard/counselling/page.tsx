"use client";

import { Loader2, MessageCircleHeart } from "lucide-react";
import CounsellingForm from "@/components/counselling/CounsellingForm";
import CounsellingSubmitted from "@/components/counselling/CounsellingSubmitted";
import { useCounsellingProfile } from "@/hooks/queries/useCounsellingProfile";

export default function CounsellingPage() {
  const { data: profile, isLoading } = useCounsellingProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (profile?.isSubmitted) {
    return (
      <div className="p-8 max-w-5xl">
        <h1 className="mb-6 flex items-center gap-2 text-xl font-bold text-slate-800">
          <MessageCircleHeart size={20} className="text-blue-600" />
          Counselling
        </h1>
        <CounsellingSubmitted profile={profile} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <MessageCircleHeart size={20} className="text-blue-600" />
          Counselling
        </h1>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Before we meet, help us understand you
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            A short, ten-question form so your counsellor can prepare a session
            that&apos;s actually about you — your career direction and the person
            you are outside of it. Takes about 5 minutes.
          </p>
        </div>
      </div>

      <CounsellingForm />
    </div>
  );
}

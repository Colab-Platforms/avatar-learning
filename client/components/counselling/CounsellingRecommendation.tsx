import { useState } from "react";
import type {
  CourseRecommendation,
  CounsellingProfile,
  RecommendationStatus,
} from "@/lib/counselling/counsellingApi";
import { buildCounsellingResponseSections } from "@/lib/counselling/counsellingResponses";
import {
  Sparkles,
  BookOpen,
  TrendingUp,
  Target,
  FileText,
  X,
} from "lucide-react";

interface CounsellingRecommendationProps {
  profile: CounsellingProfile;
  recommendation: CourseRecommendation | null;
  recommendationStatus: RecommendationStatus;
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CounsellingRecommendation({
  profile,
  recommendation,
  recommendationStatus,
}: CounsellingRecommendationProps) {
  const [showResponses, setShowResponses] = useState(false);
  const sections = buildCounsellingResponseSections(profile);
  const submittedAt = formatDate(profile.submittedAt);
  const generatedAt = formatDate(recommendation?.generatedAt ?? null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Your responses have been saved successfully.
          </p>
          {submittedAt && (
            <p className="mt-1 text-xs text-emerald-700">
              Submitted on {submittedAt}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowResponses(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
        >
          <FileText className="h-4 w-4" />
          View Your Responses
        </button>
      </div>

      {showResponses && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setShowResponses(false)}
        >
          <section
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Your Responses
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Everything you shared in your AI assessment questionnaire.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResponses(false)}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-sm font-semibold text-slate-700">
                    {section.title}
                  </h3>
                  <dl className="mt-3 space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={`${section.id}-${item.label}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {item.label}
                        </dt>
                        <dd className="mt-1 text-sm text-slate-700">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">AI Recommendation</h2>
        </div>

        {recommendationStatus === "pending" && !recommendation && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-medium text-amber-800">
              Your responses have been saved successfully. Our AI recommendation
              is being generated. Please refresh after a few moments.
            </p>
          </div>
        )}

        {recommendation && (
          <div className="mt-6 space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Recommended Course
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-slate-900">
                    {recommendation.recommendedCourseTitle}
                  </h3>
                  {recommendation.summary && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {recommendation.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Generated Date
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {generatedAt ?? "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 px-4 py-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-800">Reasoning</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {recommendation.reasoning}
              </p>
            </div>

            {recommendation.studentStrengths &&
              recommendation.studentStrengths.length > 0 && (
                <div className="rounded-xl border border-slate-100 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-slate-800">
                      Strengths
                    </p>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {recommendation.studentStrengths.map((item) => (
                      <li
                        key={item}
                        className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {recommendation.growthAreas &&
              recommendation.growthAreas.length > 0 && (
                <div className="rounded-xl border border-slate-100 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Growth Areas
                  </p>
                  <ul className="mt-3 space-y-2">
                    {recommendation.growthAreas.map((item) => (
                      <li
                        key={item}
                        className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Sparkles, X } from "lucide-react";
import { useAdminDirect2HireStudent } from "@/hooks/queries/useAdminDirect2HireStudent";
import type { AdminD2HStudentProfile } from "@/lib/adminApi";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-ink-800 border border-white/6 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}
    >
      {title && (
        <h2 className="text-sm font-semibold text-white/80 mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-sm text-white/80 whitespace-pre-wrap">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit transition-colors ${
        active ? "bg-brand-500/10 text-brand-400" : "bg-white/5 text-white/30"
      }`}
    >
      {label}
    </span>
  );
}

const COUNSELLING_TABS = [
  { key: "career", label: "Career Goals" },
  { key: "ai", label: "AI Awareness" },
  { key: "personality", label: "Personality" },
] as const;

type CounsellingTabKey = (typeof COUNSELLING_TABS)[number]["key"];

function CounsellingTabs({
  counselling,
}: {
  counselling: NonNullable<AdminD2HStudentProfile["counselling"]>;
}) {
  const [active, setActive] = useState<CounsellingTabKey>("career");

  const fields: Record<
    CounsellingTabKey,
    { label: string; value?: string | null }[]
  > = {
    career: [
      {
        label: "Career Field",
        value: counselling.careerFieldOther || counselling.careerField,
      },
      {
        label: "Future Goal",
        value: counselling.futureGoalOther || counselling.futureGoal,
      },
      {
        label: "Career Priority",
        value: counselling.careerPriorityOther || counselling.careerPriority,
      },
      {
        label: "Study Stream",
        value: counselling.studyStreamOther || counselling.studyStream,
      },
      {
        label: "Planning Challenge",
        value:
          counselling.planningChallengeOther || counselling.planningChallenge,
      },
    ],
    ai: [
      {
        label: "AI Understanding",
        value: counselling.aiUnderstandingOther || counselling.aiUnderstanding,
      },
      {
        label: "AI Field Impact",
        value: counselling.aiFieldImpactOther || counselling.aiFieldImpact,
      },
      {
        label: "AI Skill Building",
        value: counselling.aiSkillBuildingOther || counselling.aiSkillBuilding,
      },
      {
        label: "AI Everyday Use",
        value: counselling.aiEverydayUseOther || counselling.aiEverydayUse,
      },
      {
        label: "AI Curiosity",
        value: counselling.aiCuriosityOther || counselling.aiCuriosity,
      },
    ],
    personality: [
      {
        label: "Free Time Activity",
        value: counselling.freeTimeOther || counselling.freeTimeActivity,
      },
      {
        label: "Social Setting",
        value: counselling.socialSettingOther || counselling.socialSetting,
      },
      {
        label: "Work Environment",
        value: counselling.workEnvironmentOther || counselling.workEnvironment,
      },
      {
        label: "Stress Handling",
        value: counselling.stressHandlingOther || counselling.stressHandling,
      },
      {
        label: "Proud Moment",
        value: counselling.proudMomentOther || counselling.proudMoment,
      },
    ],
  };

  return (
    <Card>
      <div className="flex items-center gap-1 border-b border-white/6 mb-5 -mt-1">
        {COUNSELLING_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
              active === tab.key
                ? "text-brand-400"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-400 rounded-full animate-in fade-in duration-200" />
            )}
          </button>
        ))}
      </div>

      <div
        key={active}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-1 duration-200"
      >
        {fields[active].map((f) => (
          <Field key={f.label} label={f.label} value={f.value} />
        ))}
      </div>
    </Card>
  );
}

function RecommendationModal({
  recommendation,
  onClose,
}: {
  recommendation: NonNullable<AdminD2HStudentProfile["recommendation"]>;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-ink-800 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-brand-400" />
            <h2 className="text-base font-bold text-white">
              AI Recommendation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Generated At"
            value={formatDate(recommendation.generatedAt)}
          />
        </div>

        {recommendation.confidenceScore != null && (
          <div>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
              Confidence Score
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      Math.max(recommendation.confidenceScore * 100, 0),
                      100,
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs text-white/60 font-semibold">
                {Math.round(recommendation.confidenceScore * 100)}%
              </span>
            </div>
          </div>
        )}

        <Field label="Reasoning" value={recommendation.reasoning} />

        {Array.isArray(recommendation.studentStrengths) &&
          recommendation.studentStrengths.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
                Student Strengths
              </p>
              <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                {(recommendation.studentStrengths as string[]).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

        {Array.isArray(recommendation.growthAreas) &&
          recommendation.growthAreas.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
                Growth Areas
              </p>
              <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                {(recommendation.growthAreas as string[]).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

        <Field label="Summary" value={recommendation.summary} />
      </div>
    </div>
  );
}

export default function AdminDirect2HireStudentPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { data, isLoading, isError, error } =
    useAdminDirect2HireStudent(userId);
  const [showRecommendation, setShowRecommendation] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-6 w-40 rounded bg-ink-700/40 animate-pulse" />
        <div className="h-24 rounded-2xl bg-ink-700/40 animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-ink-700/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    const status = (
      error as { response?: { status?: number; data?: { message?: string } } }
    )?.response?.status;
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (status === 401 || status === 403
        ? "You are not authorized to view this page."
        : status === 404
          ? "Student not found."
          : "Failed to load student profile. Please try again.");

    return (
      <div className="p-8 space-y-4">
        <Link
          href="/admin/direct2hire"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80"
        >
          <ChevronLeft size={16} />
          Back to Direct2Hire
        </Link>
        <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
          {message}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, lead, enrollment, counselling, recommendation } = data;
  const fullName =
    lead?.fullName ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    "Unnamed";

  return (
    <div className="p-8 space-y-6">
      <Link
        href="/admin/direct2hire"
        className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Direct2Hire
      </Link>

      <div className="bg-ink-800 border border-white/6 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{fullName}</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {lead?.email ?? user.email}
              {(lead?.phoneNumber ?? user.phoneNo) &&
                ` · ${lead?.phoneNumber ?? user.phoneNo}`}
            </p>
          </div>
          {/* <div className="flex flex-wrap items-center gap-2"> */}
          {/* <StatusPill
              label={
                (lead?.paymentCompleted ?? false) ? "Paid" : "Payment Pending"
              }
              active={lead?.paymentCompleted ?? false}
            /> */}
          {/* <StatusPill
              label={
                enrollment ? `Enrollment: ${enrollment.status}` : "Not Enrolled"
              }
              active={enrollment?.status === "PAID"}
            /> */}
          {/* </div> */}
          <p className="text-xs text-white/30 mt-3">
            Joined {formatDate(lead?.createdAt ?? user.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Institution" value={lead?.institutionName} />
            <Field label="Education" value={lead?.currentEducation} />
            <Field label="City" value={lead?.city} />
            <Field label="State" value={lead?.state} />
            <Field
              label="Current Study Level"
              value={user.currentStudyLevel ?? undefined}
            />
          </div>
        </Card>

        <Card title="Personal Note">
          <p className="text-sm text-white/80 whitespace-pre-wrap">
            {counselling?.personalNote?.trim() || "—"}
          </p>
        </Card>
      </div>

      {!counselling ? (
        <Card>
          <p className="text-sm text-white/35">
            Student has not completed the counselling questionnaire yet.
          </p>
        </Card>
      ) : (
        <CounsellingTabs counselling={counselling} />
      )}

      <Card title="AI Recommendation">
        {!recommendation ? (
          <p className="text-sm text-white/35">
            AI recommendation has not been generated yet.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">
                  {recommendation.recommendedCourseTitle}
                </p>
                {/* {recommendation.confidenceScore != null && (
                  <p className="text-xs text-white/40">
                    {Math.round(recommendation.confidenceScore * 100)}%
                    confidence
                  </p>
                )} */}
              </div>
            </div>
            <button
              onClick={() => setShowRecommendation(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold
                         bg-brand-500 text-ink-950 hover:bg-brand-400 transition-colors"
            >
              View Full Recommendation
            </button>
          </div>
        )}
      </Card>

      {showRecommendation && recommendation && (
        <RecommendationModal
          recommendation={recommendation}
          onClose={() => setShowRecommendation(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  GraduationCap,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AssessmentCard } from "@/components/assessment/AssessmentCard";
import { LearningBreadcrumbs } from "@/components/learning/LearningBreadcrumbs";
import { useLearningRoutes } from "@/components/learning/LearningRouteContext";
import { useAssessments } from "@/hooks/queries/useAssessment";
import { useStartAssessmentAttempt } from "@/hooks/mutations/useStartAssessmentAttempt";
import { useAppSelector } from "@/store/hooks";

export function AssessmentHubView({ courseId }: { courseId: string }) {
  const routes = useLearningRoutes();
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const [startingId, setStartingId] = useState<string | null>(null);

  const { data: assessments, isLoading, isError, error } = useAssessments(courseId);
  const startAttempt = useStartAssessmentAttempt(courseId);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const weeklies = (assessments ?? []).filter((a) => a.type === "WEEKLY");
  const finals = (assessments ?? []).filter((a) => a.type === "FINAL");
  const practiced = weeklies.filter((a) => a.totalAttempts > 0).length;
  const passedWeeklies = weeklies.filter((a) => a.status === "PASSED").length;

  const handleStart = async (assessmentId: string) => {
    setStartingId(assessmentId);
    try {
      const attempt = await startAttempt.mutateAsync(assessmentId);
      router.push(routes.attempt(attempt.id));
    } catch {
      // surfaced via mutation error if needed
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-4xl mx-auto">
      <LearningBreadcrumbs current="assessments" className="mb-6" />

      <header className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
          <ClipboardList size={22} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Assessments
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
          Practice weekly quizzes as many times as you need, track your
          improvement, then take the final assessment when you&apos;re ready.
        </p>

        {weeklies.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600 shadow-sm">
              <Sparkles size={13} className="text-brand-500" />
              {practiced}/{weeklies.length} weeklies practiced
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600 shadow-sm">
              <GraduationCap size={13} className="text-emerald-500" />
              {passedWeeklies} passed at least once
            </div>
          </div>
        )}
      </header>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-200/70 animate-pulse h-44" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert size={32} className="mx-auto text-amber-500 mb-3" />
          <p className="text-sm text-slate-600">
            {(error as any)?.response?.data?.message ??
              "Assessments are not available yet."}
          </p>
        </div>
      )}

      {assessments && assessments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <ClipboardList size={28} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">
            No published assessments for this course yet.
          </p>
        </div>
      )}

      {weeklies.length > 0 && (
        <section className="mb-10">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Weekly Assessments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unlimited practice · Best score is always kept
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {weeklies.map((a) => (
              <AssessmentCard
                key={a.id}
                courseId={courseId}
                assessment={a}
                onStart={handleStart}
                starting={startingId === a.id}
              />
            ))}
          </div>
        </section>
      )}

      {finals.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Final Assessment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Limited attempts · Unlock after all weekly assessments
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {finals.map((a) => (
              <AssessmentCard
                key={a.id}
                courseId={courseId}
                assessment={a}
                onStart={handleStart}
                starting={startingId === a.id}
              />
            ))}
          </div>
        </section>
      )}

      {startAttempt.isError && (
        <p className="mt-4 text-sm text-red-600">
          {(startAttempt.error as any)?.response?.data?.message ??
            "Failed to start attempt."}
        </p>
      )}
    </div>
  );
}

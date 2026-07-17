"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList, Clock, HelpCircle, ShieldAlert, Target } from "lucide-react";
import { useCourseSelection } from "@/hooks/queries/useCourseSelection";
import { usePlacementAssessment } from "@/hooks/queries/usePlacementAssessment";
import { useStartPlacementAttempt } from "@/hooks/mutations/useStartPlacementAttempt";
import { useAppSelector } from "@/store/hooks";

export default function PlacementAssessmentIntroPage() {
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const { data: selection, isLoading: selectionLoading } = useCourseSelection();
  const courseId = selection?.selectedCourse?.id ?? "";

  const { data: assessment, isLoading, isError, error } = usePlacementAssessment(courseId);
  const startAttempt = useStartPlacementAttempt(courseId);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const handleStart = async () => {
    try {
      const attempt = await startAttempt.mutateAsync();
      router.push(`/dashboard/placement/assessment/attempt/${attempt.id}`);
    } catch {
      // surfaced via startAttempt.error below
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm mb-6">
          <Link
            href="/dashboard/placement"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft size={14} />
            Back to Placement
          </Link>
        </div>

        {(selectionLoading || isLoading) && <div className="rounded-2xl bg-slate-200 animate-pulse h-64" />}

        {!selectionLoading && !selection?.selectedCourse && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <ShieldAlert size={32} className="mx-auto text-amber-500 mb-3" />
            <p className="text-sm text-slate-600">Select your Direct2Hire course first.</p>
            <Link href="/dashboard/counselling" className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700">
              ← Go to Counselling
            </Link>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <ShieldAlert size={32} className="mx-auto text-amber-500 mb-3" />
            <p className="text-sm text-slate-600">
              {(error as any)?.response?.data?.message ?? "This assessment is not available yet."}
            </p>
            <Link href="/dashboard/placement" className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700">
              ← Back to Placement
            </Link>
          </div>
        )}

        {assessment && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-5">
              <ClipboardList size={22} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">{assessment.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock size={14} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">Time Limit</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{assessment.timeLimitMinutes} min</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <HelpCircle size={14} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">Questions</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{assessment.questionsPerAttempt}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Target size={14} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">Passing Score</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{assessment.passingScorePercent}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <ShieldAlert size={14} />
                  <span className="text-[11px] font-semibold uppercase tracking-wide">Tab Switches</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{assessment.maxTabSwitchWarnings} max</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 mb-4 text-xs text-slate-600 leading-relaxed space-y-1">
              <p>
                &bull; {assessment.questionsPerAttempt} questions are randomly selected from a larger question bank
                for every attempt.
              </p>
              <p>&bull; All questions are multiple choice.</p>
              <p>&bull; The timer auto-submits your attempt when it reaches zero.</p>
              <p>&bull; Refreshing the page will not change your selected questions or reset the timer.</p>
              <p>&bull; Results are shown immediately after submission.</p>
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 mb-6 text-xs text-amber-800 leading-relaxed">
              Once started, stay on this tab — switching away is tracked and repeated switches will auto-submit
              your attempt. The timer cannot be paused.
            </div>

            {startAttempt.isError && (
              <p className="text-red-500 text-sm mb-4">
                {(startAttempt.error as any)?.response?.data?.message ?? "Failed to start attempt."}
              </p>
            )}

            {assessment.currentStatus === "EXHAUSTED" && (
              <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 mb-4 text-sm text-orange-800">
                <p className="font-semibold">Maximum assessment attempts reached.</p>
                <p className="text-xs text-orange-700 mt-1">
                  You have used all {assessment.effectiveMaxAttempts} attempts. Contact your administrator if you
                  experienced a technical issue.
                </p>
              </div>
            )}

            {assessment.hasPassed && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-4 text-sm text-emerald-800">
                <p className="font-semibold">Assessment passed — no further attempts allowed.</p>
                <Link
                  href={`/dashboard/placement/assessment/results/${assessment.latestAttempt?.id}`}
                  className="text-xs text-emerald-700 underline mt-1 inline-block"
                >
                  View your results
                </Link>
              </div>
            )}

            {!assessment.attempt && assessment.remainingAttempts > 0 && !assessment.hasPassed && (
              <button
                type="button"
                onClick={handleStart}
                disabled={startAttempt.isPending || assessment.totalQuestionCount < assessment.questionsPerAttempt}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {startAttempt.isPending ? "Starting…" : "Start Assessment"}
                {!startAttempt.isPending && <ChevronRight size={16} />}
              </button>
            )}

            {assessment.attempt?.status === "IN_PROGRESS" && (
              <Link
                href={`/dashboard/placement/assessment/attempt/${assessment.attempt.id}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Resume Attempt
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

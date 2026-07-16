"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { AssessmentResultView } from "@/components/assessment/AssessmentResultView";
import { usePlacementResult } from "@/hooks/queries/usePlacementResult";
import { usePlacementAssessment } from "@/hooks/queries/usePlacementAssessment";
import { useCourseSelection } from "@/hooks/queries/useCourseSelection";
import { useStartPlacementAttempt } from "@/hooks/mutations/useStartPlacementAttempt";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function PlacementResultPage({ params }: PageProps) {
  const { attemptId } = use(params);
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);
  const { data: selection } = useCourseSelection();
  const courseId = selection?.selectedCourse?.id ?? "";

  const { data: result, isLoading, isError, error } = usePlacementResult(attemptId);
  const { data: placement } = usePlacementAssessment(courseId);
  const startAttempt = useStartPlacementAttempt(courseId);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const handleRetake = async () => {
    try {
      const attempt = await startAttempt.mutateAsync();
      router.push(`/dashboard/placement/assessment/attempt/${attempt.id}`);
    } catch {
      // surfaced via startAttempt.error below
    }
  };

  const passed = result?.attempt.isPassed;
  // Prefer remainingAttempts over canStartNewAttempt — the latter is false while an
  // in-progress attempt is still in the cache (common right after submit before refetch).
  const canRetake =
    !!placement &&
    !placement.hasPassed &&
    placement.remainingAttempts > 0;
  const attemptsExhausted =
    !!placement &&
    !placement.hasPassed &&
    placement.remainingAttempts <= 0;

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

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-red-500">
              {(error as any)?.response?.data?.message ?? "Failed to load results."}
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            <AssessmentResultView result={result} />

            {passed === false && canRetake && (
              <>
                {startAttempt.isError && (
                  <p className="text-red-500 text-sm">
                    {(startAttempt.error as any)?.response?.data?.message ?? "Failed to start a new attempt."}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={startAttempt.isPending || !courseId}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  <RotateCcw size={16} />
                  {startAttempt.isPending ? "Starting…" : "Retake Assessment"}
                </button>
              </>
            )}

            {passed === false && attemptsExhausted && (
              <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm text-orange-800">
                <p className="font-semibold">No attempts remaining</p>
                <p className="text-xs text-orange-700 mt-1">
                  Maximum assessment attempts reached. Contact your administrator if you experienced a
                  technical issue.
                </p>
              </div>
            )}

            {passed === true && (
              <Link
                href="/dashboard/placement/mock-interview"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                Continue to Mock Interview
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

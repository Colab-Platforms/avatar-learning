"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList, Clock, HelpCircle, ShieldAlert, Target } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAssessment } from "@/hooks/queries/useAssessment";
import { useStartAssessmentAttempt } from "@/hooks/mutations/useStartAssessmentAttempt";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssessmentIntroPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);

  const { data: assessment, isLoading, isError, error } = useAssessment(id);
  const startAttempt = useStartAssessmentAttempt(id);

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const handleStart = async () => {
    try {
      const attempt = await startAttempt.mutateAsync();
      router.push(`/courses/${id}/assessment/attempt/${attempt.id}`);
    } catch {
      // surfaced via startAttempt.error below
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen mt-8 bg-slate-50">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm mb-6">
            <Link
              href={`/courses/${id}/learn`}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ChevronLeft size={14} />
              Back to course
            </Link>
          </div>

          {isLoading && (
            <div className="rounded-2xl bg-slate-200 animate-pulse h-64" />
          )}

          {isError && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <ShieldAlert size={32} className="mx-auto text-amber-500 mb-3" />
              <p className="text-sm text-slate-600">
                {(error as any)?.response?.data?.message ?? "This assessment is not available yet."}
              </p>
              <Link href={`/courses/${id}/learn`} className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700">
                ← Back to course
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
                  <p className="text-lg font-bold text-slate-800">{assessment.questionCount}</p>
                </div>
                {assessment.passingScorePercent != null && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Target size={14} />
                      <span className="text-[11px] font-semibold uppercase tracking-wide">Passing Score</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{assessment.passingScorePercent}%</p>
                  </div>
                )}
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <ShieldAlert size={14} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Tab Switches</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{assessment.maxTabSwitchWarnings} max</p>
                </div>
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

              {!assessment.attempt && (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={startAttempt.isPending || assessment.questionCount === 0}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {startAttempt.isPending ? "Starting…" : "Start Assessment"}
                  {!startAttempt.isPending && <ChevronRight size={16} />}
                </button>
              )}

              {assessment.attempt?.status === "IN_PROGRESS" && (
                <Link
                  href={`/courses/${id}/assessment/attempt/${assessment.attempt.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  Resume Attempt
                  <ChevronRight size={16} />
                </Link>
              )}

              {assessment.attempt && assessment.attempt.status !== "IN_PROGRESS" && (
                <Link
                  href={`/courses/${id}/assessment/results/${assessment.attempt.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 transition-colors"
                >
                  View Results
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

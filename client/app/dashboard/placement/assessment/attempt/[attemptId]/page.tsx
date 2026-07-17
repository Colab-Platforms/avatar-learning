"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Send,
  AlertTriangle,
  BookOpen,
} from "lucide-react";
import { AssessmentShell } from "@/components/assessment/AssessmentShell";
import { QuestionRenderer } from "@/components/assessment/QuestionRenderer";
import { QuestionNavigator } from "@/components/assessment/QuestionNavigator";
import { TabSwitchWarningModal } from "@/components/assessment/TabSwitchWarningModal";
import { AutoSubmitModal } from "@/components/assessment/AutoSubmitModal";
import { usePlacementAttempt } from "@/hooks/queries/usePlacementAttempt";
import { useSavePlacementAnswer } from "@/hooks/mutations/useSavePlacementAnswer";
import { useReportPlacementTabSwitchViolation } from "@/hooks/mutations/useReportPlacementTabSwitchViolation";
import { useSubmitPlacementAttempt } from "@/hooks/mutations/useSubmitPlacementAttempt";
import { useTabVisibility } from "@/hooks/useTabVisibility";
import { useAppSelector } from "@/store/hooks";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function PlacementAssessmentAttemptPage({ params }: PageProps) {
  const { attemptId } = use(params);
  const router = useRouter();
  const { user: authUser } = useAppSelector((s) => s.auth);

  const { data, isLoading, isError } = usePlacementAttempt(attemptId);
  const saveAnswer = useSavePlacementAnswer(attemptId);
  const reportViolation = useReportPlacementTabSwitchViolation(attemptId);
  const submitAttempt = useSubmitPlacementAttempt(attemptId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [warning, setWarning] = useState<{ count: number; max: number } | null>(null);
  const [autoSubmitReason, setAutoSubmitReason] = useState<"timeout" | "violation" | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const attempt = data?.attempt;
  const inProgress = attempt?.status === "IN_PROGRESS" && !autoSubmitReason;

  // Questions already arrive pre-ordered (randomized order snapshotted at attempt-start)
  const sortedQuestions = useMemo(
    () => [...(data?.assessment.questions ?? [])].sort((a, b) => a.questionOrder - b.questionOrder),
    [data?.assessment.questions],
  );

  const currentQuestion = sortedQuestions[currentIndex] ?? null;

  useEffect(() => {
    if (attempt && attempt.status !== "IN_PROGRESS" && !autoSubmitReason) {
      router.replace(`/dashboard/placement/assessment/results/${attemptId}`);
    }
  }, [attempt, autoSubmitReason, router, attemptId]);

  useTabVisibility(
    () => {
      reportViolation.mutate(undefined, {
        onSuccess: (result) => {
          if (result.autoSubmitted) {
            setAutoSubmitReason("violation");
            setTimeout(
              () => router.replace(`/dashboard/placement/assessment/results/${attemptId}`),
              2000,
            );
          } else {
            setWarning({ count: result.tabSwitchCount, max: result.maxTabSwitchWarnings });
          }
        },
      });
    },
    { enabled: inProgress },
  );

  const handleExpire = useCallback(() => {
    if (!inProgress) return;
    submitAttempt.mutate(undefined, {
      onSuccess: () => {
        setAutoSubmitReason("timeout");
        setTimeout(
          () => router.replace(`/dashboard/placement/assessment/results/${attemptId}`),
          2000,
        );
      },
    });
  }, [inProgress, submitAttempt, router, attemptId]);

  const [localAnswers, setLocalAnswers] = useState<Record<string, string | null>>({});

  const mergedAnswers = useMemo(
    () => ({ ...(data?.answers ?? {}), ...localAnswers }),
    [data?.answers, localAnswers],
  );

  const handleSelect = useCallback(
    (optionId: string) => {
      if (!inProgress || !currentQuestion) return;
      const qid = currentQuestion.id;
      const currentAnswer = mergedAnswers[qid] ?? null;
      const newAnswer = currentAnswer === optionId ? null : optionId;
      setLocalAnswers((prev) => ({ ...prev, [qid]: newAnswer }));
      saveAnswer.mutate({ questionId: qid, selectedOptionId: newAnswer });
    },
    [inProgress, currentQuestion, mergedAnswers, saveAnswer],
  );

  const handleJump = useCallback((targetId: string) => {
    const idx = sortedQuestions.findIndex((q) => q.id === targetId);
    if (idx >= 0) setCurrentIndex(idx);
  }, [sortedQuestions]);

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const handleNext = () => setCurrentIndex((i) => Math.min(sortedQuestions.length - 1, i + 1));

  const handleManualSubmit = () => {
    submitAttempt.mutate(undefined, {
      onSuccess: () => router.replace(`/dashboard/placement/assessment/results/${attemptId}`),
    });
  };

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-full max-w-3xl px-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`rounded-2xl bg-slate-200 animate-pulse ${i === 0 ? "h-48" : "h-16"}`} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center px-4">
        <p className="text-red-500 text-sm">Failed to load this attempt.</p>
      </div>
    );
  }

  const answeredCount = Object.values(mergedAnswers).filter(Boolean).length;
  const totalCount = sortedQuestions.length;
  const unansweredCount = totalCount - answeredCount;
  const progressPct = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <>
      <AssessmentShell
        courseTitle={data.assessment.title}
        deadline={attempt!.deadline}
        tabSwitchCount={attempt!.tabSwitchCount}
        maxTabSwitchWarnings={data.assessment.maxTabSwitchWarnings}
        onExpire={handleExpire}
        enableFullscreen={false}
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-5 items-start max-w-6xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              {currentQuestion ? (
                <QuestionRenderer
                  key={currentQuestion.id}
                  question={currentQuestion}
                  selectedOptionId={mergedAnswers[currentQuestion.id] ?? null}
                  onSelect={handleSelect}
                  totalQuestions={totalCount}
                />
              ) : (
                <p className="text-slate-400 text-sm text-center py-8">No questions available.</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex-1 flex flex-col items-center gap-1.5 px-2">
                <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums">
                  {answeredCount}/{totalCount} answered
                </span>
              </div>

              {currentIndex < totalCount - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(true)}
                  disabled={!inProgress || submitAttempt.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send size={14} />
                  Submit
                </button>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex flex-col gap-5 lg:sticky lg:top-[72px]">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-brand-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-800">Questions</h3>
              <span className="ml-auto text-xs font-semibold text-slate-500 tabular-nums">
                {currentIndex + 1}/{totalCount}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Progress</span>
                <span className="text-xs font-bold text-brand-700 tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <QuestionNavigator
              questions={sortedQuestions}
              answers={mergedAnswers}
              currentId={currentQuestion?.id ?? ""}
              onJump={handleJump}
            />

            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={!inProgress || submitAttempt.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors"
            >
              {submitAttempt.isPending ? (
                "Submitting…"
              ) : (
                <>
                  <Send size={14} />
                  Submit Assessment
                </>
              )}
            </button>

            {unansweredCount > 0 && (
              <p className="text-[11px] text-amber-600 text-center -mt-2">
                {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} unanswered
              </p>
            )}
          </aside>
        </div>
      </AssessmentShell>

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-2">Submit Assessment?</h3>
            <p className="text-sm text-slate-500 text-center mb-1">
              You have answered <strong className="text-slate-800">{answeredCount}</strong> of{" "}
              <strong className="text-slate-800">{totalCount}</strong> questions.
            </p>
            {unansweredCount > 0 && (
              <p className="text-sm text-amber-600 text-center mb-5">
                {unansweredCount} question{unansweredCount !== 1 ? "s" : ""} will be left unanswered.
              </p>
            )}
            {unansweredCount === 0 && (
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-sm mb-5 font-medium">
                <CheckCircle2 size={16} />
                All questions answered
              </div>
            )}
            <p className="text-xs text-slate-400 text-center mb-5">
              You cannot change your answers after submitting.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleManualSubmit();
                }}
                disabled={submitAttempt.isPending}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                {submitAttempt.isPending ? "Submitting…" : "Confirm Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {warning && (
        <TabSwitchWarningModal count={warning.count} max={warning.max} onDismiss={() => setWarning(null)} />
      )}
      {autoSubmitReason && <AutoSubmitModal reason={autoSubmitReason} />}
    </>
  );
}

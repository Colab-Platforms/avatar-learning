"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ClipboardList,
  Lock,
  Mic,
  Target,
  XCircle,
} from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { PlacementAttemptCard } from "@/components/placement/PlacementAttemptCard";
import { useCourseSelection } from "@/hooks/queries/useCourseSelection";
import { usePlacementAssessment } from "@/hooks/queries/usePlacementAssessment";
import { usePlacementAttemptHistory } from "@/hooks/queries/usePlacementAttemptHistory";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function StatusBadge({
  status,
  hasPassed,
}: {
  status: string;
  hasPassed?: boolean;
}) {
  if (hasPassed || status === "PASSED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide bg-emerald-50 text-emerald-700 border-emerald-200">
        <CheckCircle2 size={12} />
        Passed
      </span>
    );
  }
  if (status === "EXHAUSTED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide bg-orange-50 text-orange-700 border-orange-200">
        <AlertCircle size={12} />
        Attempts Exhausted
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide bg-red-50 text-red-700 border-red-200">
        <XCircle size={12} />
        Not Passed
      </span>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 uppercase tracking-wide">
        In Progress
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wide">
      Unlocked
    </span>
  );
}

export default function DashboardPlacementPage() {
  const { data: selection, isLoading: selectionLoading } = useCourseSelection();
  const courseId = selection?.selectedCourse?.id ?? "";

  const {
    data: placement,
    isLoading: placementLoading,
    isError,
    error,
  } = usePlacementAssessment(courseId);

  const { data: attemptHistory, isLoading: historyLoading } = usePlacementAttemptHistory(courseId);

  const isLoading = selectionLoading || (!!courseId && placementLoading);

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-8 w-48 rounded bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!selection?.selectedCourse) {
    return (
      <div className="p-6 sm:p-8 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Target size={20} className="text-blue-600" />
          Placement
        </h1>
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm px-6">
          <Target size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-600 font-medium mb-1">
            Select your Direct2Hire course first
          </p>
          <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
            Placement assessment and mock interview unlock after counselling is
            complete and you choose a course.
          </p>
          <Link
            href="/dashboard/counselling"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-blue-500"
          >
            Go to Counselling
          </Link>
        </div>
      </div>
    );
  }

  if (isError) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Placement assessment is not available for this course yet.";
    return (
      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Target size={20} className="text-blue-600" />
          Placement
        </h1>
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm px-6">
          <ClipboardList size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      </div>
    );
  }

  if (!placement) return null;

  const attempt = placement.attempt;
  const latestAttempt = placement.latestAttempt;
  const assessmentPassed = placement.hasPassed;
  const exhausted = placement.currentStatus === "EXHAUSTED";
  const canStart = !assessmentPassed && placement.remainingAttempts > 0 && !attempt;

  const assessmentAction = attempt
    ? { label: "Resume Assessment", href: `/dashboard/placement/assessment/attempt/${attempt.id}`, show: true }
    : assessmentPassed && latestAttempt
      ? {
          label: "View Results",
          href: `/dashboard/placement/assessment/results/${latestAttempt.id}`,
          show: true,
        }
      : canStart
        ? { label: placement.attemptsUsed > 0 ? "Retake Assessment" : "Start Assessment", href: `/dashboard/placement/assessment`, show: true }
        : latestAttempt
          ? {
              label: "View Last Results",
              href: `/dashboard/placement/assessment/results/${latestAttempt.id}`,
              show: !exhausted,
            }
          : { label: "Start Assessment", href: `/dashboard/placement/assessment`, show: false };

  const stagesCompleted = assessmentPassed ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="p-6 sm:p-8 max-w-6xl mx-auto w-full space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <span className="inline-block bg-[#E6F0FA] text-[#1E6BFF] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
            DIRECT2HIRE PROGRAMME
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Placement</h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xl">
            Clear the pre-placement assessment to unlock your mock interview with an industry mentor.
          </p>
          <p className="text-xs text-slate-400 mt-1 font-medium bg-slate-100 w-fit px-2 py-0.5 rounded">
            Course: {selection.selectedCourse.title}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-slate-800">Your Placement Progress</h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {stagesCompleted} of 2 stages unlocked
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
            <motion.div
              className="h-full rounded-full bg-[#1E6BFF]"
              initial={{ width: 0 }}
              animate={{ width: `${(stagesCompleted / 2) * 100}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[320px]"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ClipboardList size={20} />
                </div>
                <StatusBadge status={placement.currentStatus} hasPassed={assessmentPassed} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">Pre-Placement Assessment</h3>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {placement.questionsPerAttempt} randomized MCQs, {placement.timeLimitMinutes} minutes, pass at{" "}
                  {placement.passingScorePercent}% or higher.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Highest Score", value: placement.highestScore != null ? `${placement.highestScore.toFixed(0)}%` : "—" },
                  { label: "Latest Score", value: placement.latestScore != null ? `${placement.latestScore.toFixed(0)}%` : "—" },
                  { label: "Attempts Used", value: `${placement.attemptsUsed} / ${placement.effectiveMaxAttempts}` },
                  { label: "Remaining", value: String(placement.remainingAttempts) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{stat.value}</p>
                  </div>
                ))}
              </div>

              {placement.assessmentCompleted && placement.assessmentCompletionDate && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  Assessment completed on {formatDateTime(placement.assessmentCompletionDate)}
                </p>
              )}

              {exhausted && (
                <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm text-orange-800 leading-relaxed">
                  <p className="font-semibold mb-1">Maximum attempts reached</p>
                  <p className="text-orange-700/90 text-xs">
                    You have used all {placement.effectiveMaxAttempts} available attempts without passing.
                    Contact your administrator if you experienced a technical issue.
                  </p>
                </div>
              )}
            </div>

            {assessmentAction.show && (
              <Link
                href={assessmentAction.href}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-sm font-bold py-2.5 transition-colors shadow-sm shadow-blue-100"
              >
                {assessmentAction.label}
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className={cn(
              "relative rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between min-h-[320px] overflow-hidden",
              "border-slate-200",
            )}
          >
            <div className={cn(!assessmentPassed && "opacity-40 pointer-events-none select-none")}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Mic size={20} />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wide">
                  {assessmentPassed ? "Unlocked" : "Locked"}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800">Mock Interview</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                A live-style mock interview with an industry mentor to sharpen your placement readiness.
              </p>
            </div>
            {assessmentPassed ? (
              <Link
                href="/dashboard/placement/mock-interview"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white text-sm font-bold py-2.5 transition-colors shadow-sm shadow-blue-100"
              >
                View Mock Interview
              </Link>
            ) : (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shadow-sm border border-slate-200/60 mb-2">
                  <Lock size={16} />
                </div>
                <p className="text-xs font-bold text-slate-700">Pass the assessment to unlock</p>
              </div>
            )}
          </motion.div>
        </div>

        {(attemptHistory?.length ?? 0) > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CollapsibleSection
              title="View Attempt History"
              subtitle={`${attemptHistory?.length ?? 0} attempt${attemptHistory?.length === 1 ? "" : "s"}`}
              className="border-slate-200 bg-white shadow-sm"
              headerClassName="text-slate-800"
            >
              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {attemptHistory?.map((item) => (
                    <PlacementAttemptCard key={item.id} attempt={item} showResultLink />
                  ))}
                </div>
              )}
            </CollapsibleSection>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="rounded-3xl overflow-hidden border border-slate-200/70 shadow-sm flex flex-col md:flex-row min-h-[200px] bg-slate-100"
        >
          <div className="flex-1 bg-[#1A52B8] p-8 md:p-10 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
            <div>
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                <Award size={24} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Placement Readiness</h3>
              <p className="text-xs md:text-sm text-white/80 mt-2 max-w-sm leading-relaxed font-medium">
                Clear both stages to be considered placement-ready for our hiring partners.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

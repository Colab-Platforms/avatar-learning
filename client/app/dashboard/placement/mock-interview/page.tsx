"use client";

import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  ChevronLeft,
  Clock,
  Lightbulb,
  Lock,
  Mic,
  Sparkles,
  Users,
} from "lucide-react";
import { useCourseSelection } from "@/hooks/queries/useCourseSelection";
import { usePlacementAssessment } from "@/hooks/queries/usePlacementAssessment";

const PREP_TIPS = [
  "Revisit fundamentals covered in your course modules — mentors often start with concept-check questions.",
  "Prepare a 2-minute introduction covering your background, skills, and what you're looking for.",
  "Have 2-3 project examples ready to discuss in depth, including challenges you solved.",
  "Research common interview questions for your target role and practice answering out loud.",
  "Test your camera, microphone, and internet connection ahead of time.",
];

export default function MockInterviewPage() {
  const { data: selection, isLoading: selectionLoading } = useCourseSelection();
  const courseId = selection?.selectedCourse?.id ?? "";
  const { data: placement, isLoading: placementLoading } = usePlacementAssessment(courseId);

  const isLoading = selectionLoading || (!!courseId && placementLoading);
  const unlocked = placement?.mockInterviewUnlocked ?? false;

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 rounded bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard/placement"
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to Placement
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Mic size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pre-Placement Mock Interview</h1>
                <p className="text-sm text-slate-500 mt-1">
                  A live-style mock interview with an industry mentor to sharpen your placement readiness.
                </p>
              </div>
            </div>
          </div>

          {/* Status card */}
          <div
            className={`mt-6 rounded-xl border px-4 py-3.5 flex items-center gap-3 ${
              unlocked ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
            }`}
          >
            {unlocked ? (
              <>
                <BadgeCheck size={18} className="text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-800 font-medium">
                  Unlocked — you passed the Pre-Placement Assessment. Scheduling opens soon.
                </p>
              </>
            ) : (
              <>
                <Lock size={18} className="text-slate-400 shrink-0" />
                <p className="text-sm text-slate-600">
                  Locked — pass the Pre-Placement Assessment to unlock mock interview scheduling.
                </p>
              </>
            )}
          </div>
        </div>

        {!unlocked ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Lock size={28} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-600 font-medium mb-1">Complete the assessment first</p>
            <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
              You need to pass the Pre-Placement Assessment before mock interview details unlock.
            </p>
            <Link
              href="/dashboard/placement/assessment"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-brand-700"
            >
              Go to Assessment
            </Link>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Overview</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                The Pre-Placement Mock Interview is a one-on-one session with an industry mentor from our hiring
                partner network. It simulates a real technical + HR interview so you walk into actual placement
                interviews with confidence, structured feedback, and a clear sense of what to improve.
              </p>
            </div>

            {/* What to expect / Duration / Mentor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">What to Expect</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  A mix of technical questions from your course track, behavioural questions, and a resume walkthrough,
                  followed by structured feedback.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Clock size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Duration</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Approximately 30-45 minutes, conducted over a live video call.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                  <Users size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Industry Mentor</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Matched with a working professional from our hiring partner network relevant to your course track.
                </p>
              </div>
            </div>

            {/* Preparation tips */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} className="text-amber-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Preparation Tips</h2>
              </div>
              <ul className="space-y-2.5">
                {PREP_TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Schedule (placeholder) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-center">
              <Calendar size={24} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-600 font-medium mb-1">Scheduling is not open yet</p>
              <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
                We're finalizing mentor availability. You'll be able to pick a slot here soon.
              </p>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-200 text-slate-500 text-sm font-semibold px-5 py-2.5 cursor-not-allowed"
              >
                <Calendar size={16} />
                Schedule Interview
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

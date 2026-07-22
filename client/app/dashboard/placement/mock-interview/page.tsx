"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  CalendarClock,
  ChevronLeft,
  Clock,
  ExternalLink,
  Lightbulb,
  Loader2,
  Lock,
  Mic,
  Send,
  Sparkles,
  User2,
  Users,
} from "lucide-react";
import { useMockInterview } from "@/hooks/queries/useMockInterview";
import { useRequestMockInterview } from "@/hooks/mutations/useRequestMockInterview";
import {
  MockInterviewStatusBadge,
  MockInterviewTimelineView,
} from "@/components/mock-interview/MockInterviewShared";
import {
  PERFORMANCE_GRADE_LABELS,
  getPerformanceGradeShortLabel,
  type MockInterview,
  type MockInterviewBundle,
} from "@/lib/direct2hire/mockInterviewApi";

const PREP_TIPS = [
  "Revisit fundamentals covered in your course modules — mentors often start with concept-check questions.",
  "Prepare a 2-minute introduction covering your background, skills, and what you're looking for.",
  "Have 2–3 project examples ready to discuss in depth, including challenges you solved.",
  "Research common interview questions for your target role and practice answering out loud.",
  "Test your camera, microphone, and internet connection ahead of time.",
];

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PageShell({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </main>
  );
}

function HeaderCard({
  unlocked,
  statusLabel,
}: {
  unlocked: boolean;
  statusLabel?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Mic size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Pre-Placement Mock Interview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              A live-style mock interview with an industry mentor to sharpen your
              placement readiness.
            </p>
          </div>
        </div>
        {statusLabel}
      </div>

      <div
        className={`mt-6 rounded-xl border px-4 py-3.5 flex items-center gap-3 ${
          unlocked
            ? "bg-emerald-50 border-emerald-100"
            : "bg-slate-50 border-slate-100"
        }`}
      >
        {unlocked ? (
          <>
            <BadgeCheck size={18} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-800 font-medium">
              Unlocked — you passed the Pre-Placement Assessment.
            </p>
          </>
        ) : (
          <>
            <Lock size={18} className="text-slate-400 shrink-0" />
            <p className="text-sm text-slate-600">
              Locked — pass the Pre-Placement Assessment to unlock mock interview
              scheduling.
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

function LockedState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
    >
      <Lock size={28} className="mx-auto text-slate-300 mb-3" />
      <p className="text-sm text-slate-600 font-medium mb-1">
        Complete the assessment first
      </p>
      <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
        You need to pass the Pre-Placement Assessment before mock interview
        details unlock.
      </p>
      <Link
        href="/dashboard/placement/assessment"
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-brand-700"
      >
        Go to Assessment
      </Link>
    </motion.div>
  );
}

function OverviewSection() {
  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Overview
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          The Pre-Placement Mock Interview is a one-on-one session with an
          industry mentor from our hiring partner network. It simulates a real
          technical + HR interview so you walk into actual placement interviews
          with confidence, structured feedback, and a clear sense of what to
          improve.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Sparkles size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            What to Expect
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            A mix of technical questions from your course track, behavioural
            questions, and a resume walkthrough, followed by structured feedback.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Clock size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Duration</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Approximately 30–45 minutes, conducted over a live video call.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <Users size={18} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            Industry Mentor
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Matched with a working professional from our hiring partner network
            relevant to your course track.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={16} className="text-amber-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Preparation Tips
          </h2>
        </div>
        <ul className="space-y-2.5">
          {PREP_TIPS.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function RequestCard() {
  const requestMutation = useRequestMockInterview();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-center"
    >
      <Calendar size={24} className="mx-auto text-brand-500 mb-3" />
      <p className="text-sm text-slate-800 font-semibold mb-1">
        Ready to request your mock interview?
      </p>
      <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
        Submit a request and our team will schedule a session with an industry
        mentor. You&apos;ll see the details here once confirmed.
      </p>
      <button
        type="button"
        onClick={() => requestMutation.mutate()}
        disabled={requestMutation.isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 hover:bg-brand-700 disabled:opacity-60"
      >
        {requestMutation.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        Request Mock Interview
      </button>
    </motion.div>
  );
}

function WaitingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-100 bg-amber-50/60 p-6 sm:p-8 shadow-sm text-center"
    >
      <CalendarClock size={24} className="mx-auto text-amber-500 mb-3" />
      <p className="text-sm text-amber-900 font-semibold mb-1">
        Waiting for interview schedule
      </p>
      <p className="text-sm text-amber-800/70 max-w-md mx-auto">
        Your request has been received. An admin will assign an interviewer and
        share meeting details shortly.
      </p>
    </motion.div>
  );
}

function ScheduleCard({ interview }: { interview: MockInterview }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-6 sm:p-8 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Your Interview Schedule
        </h2>
        <MockInterviewStatusBadge status={interview.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Interviewer
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <User2 size={15} className="text-brand-600" />
            {interview.interviewerName}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Duration
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Clock size={15} className="text-brand-600" />
            {interview.durationMinutes} minutes
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Date
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Calendar size={15} className="text-brand-600" />
            {formatDate(interview.scheduledAt)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Time
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarClock size={15} className="text-brand-600" />
            {formatTime(interview.scheduledAt)}
          </div>
        </div>
      </div>

      {interview.meetingLink && (
        <a
          href={interview.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white text-sm font-semibold px-4 py-2.5 hover:bg-brand-700"
        >
          Join Meeting
          <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  );
}

function FeedbackPreparingCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-100 bg-violet-50/50 p-6 sm:p-8 shadow-sm text-center"
    >
      <Loader2 size={24} className="mx-auto text-violet-500 mb-3 animate-spin" />
      <p className="text-sm text-violet-900 font-semibold mb-1">
        Feedback is being prepared
      </p>
      <p className="text-sm text-violet-800/70 max-w-md mx-auto">
        Your interview is complete. Your mentor is writing structured feedback —
        it will appear here once published.
      </p>
    </motion.div>
  );
}

function FeedbackReport({
  interview,
  timeline,
}: {
  interview: MockInterview;
  timeline: MockInterviewBundle["timeline"];
}) {
  const gradeLabel = getPerformanceGradeShortLabel(interview.performanceGrade);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Interview Report
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Mock Interview Feedback
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Published {formatDateTime(interview.feedbackPublishedAt)}
            </p>
          </div>
          {interview.performanceGrade && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5">
              {PERFORMANCE_GRADE_LABELS[interview.performanceGrade]}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 p-5 rounded-xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Grade
            </p>
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {gradeLabel ?? "—"}
            </span>
          </div>
          {interview.interviewerName && (
            <div className="sm:ml-auto text-sm text-slate-600">
              Interviewer:{" "}
              <span className="font-semibold text-slate-800">
                {interview.interviewerName}
              </span>
            </div>
          )}
        </div>

        {interview.feedback && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Interviewer Feedback
            </p>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {interview.feedback}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-5">
          Journey Timeline
        </h3>
        <MockInterviewTimelineView timeline={timeline} />
      </div>
    </motion.div>
  );
}

export default function MockInterviewPage() {
  const { data, isLoading, isError, error } = useMockInterview();

  if (isLoading) {
    return (
      <PageShell>
        <div className="h-8 w-48 rounded bg-slate-100 animate-pulse" />
        <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
          {(error as { message?: string })?.message ??
            "Failed to load mock interview details."}
        </div>
      </PageShell>
    );
  }

  const unlocked = data.assessment.assessmentCompleted;
  const interview = data.interview;
  const status = interview?.status;

  return (
    <PageShell>
      <HeaderCard
        unlocked={unlocked}
        statusLabel={
          status ? <MockInterviewStatusBadge status={status} /> : undefined
        }
      />

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <LockedState key="locked" />
        ) : status === "FEEDBACK_PUBLISHED" && interview ? (
          <FeedbackReport
            key="feedback"
            interview={interview}
            timeline={data.timeline}
          />
        ) : (
          <motion.div
            key="flow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <OverviewSection />

            {!interview && data.assessment.canRequest && <RequestCard />}
            {status === "REQUESTED" && <WaitingCard />}
            {status === "SCHEDULED" && interview && (
              <ScheduleCard interview={interview} />
            )}
            {status === "COMPLETED" && (
              <>
                {interview && <ScheduleCard interview={interview} />}
                <FeedbackPreparingCard />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  Link as LinkIcon,
  Mic,
  User2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminMockInterview } from "@/hooks/queries/useAdminMockInterview";
import { useScheduleMockInterview } from "@/hooks/mutations/useScheduleMockInterview";
import { useMarkMockInterviewCompleted } from "@/hooks/mutations/useMarkMockInterviewCompleted";
import { usePublishMockInterviewFeedback } from "@/hooks/mutations/usePublishMockInterviewFeedback";
import { useCancelMockInterview } from "@/hooks/mutations/useCancelMockInterview";
import {
  MockInterviewStatusBadge,
} from "@/components/mock-interview/MockInterviewShared";
import {
  PERFORMANCE_GRADE_LABELS,
  PERFORMANCE_GRADE_OPTIONS,
  countFeedbackWords,
  getPerformanceGradeShortLabel,
  type MockInterview,
  type MockInterviewPerformanceGrade,
  type PublishMockInterviewFeedbackPayload,
} from "@/lib/direct2hire/mockInterviewApi";

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

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-ink-800 border border-white/6 rounded-2xl p-6",
        className,
      )}
    >
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
      <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function ScheduleForm({
  userId,
  interview,
  onDone,
  title,
}: {
  userId: string;
  interview?: MockInterview | null;
  onDone?: () => void;
  title: string;
}) {
  const [interviewerName, setInterviewerName] = useState(
    interview?.interviewerName ?? "",
  );
  const [meetingLink, setMeetingLink] = useState(interview?.meetingLink ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    toDatetimeLocalValue(interview?.scheduledAt),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    interview?.durationMinutes ?? 45,
  );
  const [adminNotes, setAdminNotes] = useState(interview?.adminNotes ?? "");

  const scheduleMutation = useScheduleMockInterview(userId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewerName.trim() || !meetingLink.trim() || !scheduledAt) return;

    scheduleMutation.mutate(
      {
        interviewerName: interviewerName.trim(),
        meetingLink: meetingLink.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        adminNotes: adminNotes.trim() || null,
      },
      { onSuccess: () => onDone?.() },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
          <CalendarClock size={12} className="text-brand-400" />
          {title}
        </span>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
            <User2 size={11} />
            Interviewer Name
          </label>
          <input
            type="text"
            value={interviewerName}
            onChange={(e) => setInterviewerName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            required
            className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
            <CalendarClock size={11} />
            Date &amp; Time
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5 block">
            Duration (minutes)
          </label>
          <input
            type="number"
            min={15}
            max={180}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            required
            className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
            <LinkIcon size={11} />
            Google Meet Link
          </label>
          <input
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            required
            className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5 block">
          Admin Notes (optional)
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={2}
          placeholder="Internal notes…"
          className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={scheduleMutation.isPending}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-500 text-ink-950 hover:bg-brand-400 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {scheduleMutation.isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <CheckCircle2 size={13} />
        )}
        {interview?.status === "SCHEDULED"
          ? "Update Schedule"
          : "Schedule Interview"}
      </button>
    </form>
  );
}

const FEEDBACK_MIN_WORDS = 20;
const FEEDBACK_MAX_CHARS = 1000;

function FeedbackForm({
  userId,
  interview,
}: {
  userId: string;
  interview: MockInterview;
}) {
  const [performanceGrade, setPerformanceGrade] =
    useState<MockInterviewPerformanceGrade | "">(
      interview.performanceGrade ?? "",
    );
  const [feedback, setFeedback] = useState(interview.feedback ?? "");
  const [touched, setTouched] = useState(false);

  const publishMutation = usePublishMockInterviewFeedback(userId);

  const wordCount = countFeedbackWords(feedback);
  const trimmedFeedback = feedback.trim();
  const feedbackError =
    touched && trimmedFeedback.length === 0
      ? "Overall feedback is required"
      : touched && wordCount < FEEDBACK_MIN_WORDS
        ? "Please provide at least 20 words of meaningful feedback."
        : trimmedFeedback.length > FEEDBACK_MAX_CHARS
          ? "Feedback cannot exceed 1000 characters"
          : null;

  const canSubmit =
    !!performanceGrade &&
    wordCount >= FEEDBACK_MIN_WORDS &&
    trimmedFeedback.length <= FEEDBACK_MAX_CHARS &&
    !publishMutation.isPending;

  const handleSubmit = () => {
    setTouched(true);
    if (!performanceGrade || wordCount < FEEDBACK_MIN_WORDS) return;
    if (trimmedFeedback.length > FEEDBACK_MAX_CHARS) return;

    const payload: PublishMockInterviewFeedbackPayload = {
      performanceGrade,
      feedback: trimmedFeedback,
    };
    publishMutation.mutate(payload);
  };

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-5">
      <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
        Interview Evaluation
      </span>

      <fieldset className="space-y-3">
        <legend className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">
          Student Performance Grade <span className="text-red-400">*</span>
        </legend>
        <div className="flex flex-col gap-2.5">
          {PERFORMANCE_GRADE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="radio"
                name="performanceGrade"
                value={opt.value}
                checked={performanceGrade === opt.value}
                onChange={() => setPerformanceGrade(opt.value)}
                className="h-4 w-4 accent-brand-500"
              />
              <span className="text-sm text-white/80 group-hover:text-white transition-colors">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
        {touched && !performanceGrade && (
          <p className="text-xs text-red-400">
            Student performance grade is required
          </p>
        )}
      </fieldset>

      <div>
        <label className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5 block">
          Overall Feedback <span className="text-red-400">*</span>
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={5}
          maxLength={FEEDBACK_MAX_CHARS}
          placeholder="Write at least 20 words of meaningful feedback for the student…"
          className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none focus:border-brand-500/60 resize-none"
        />
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p
            className={`text-xs ${
              feedbackError ? "text-red-400" : "text-white/30"
            }`}
          >
            {feedbackError ??
              `${wordCount} / ${FEEDBACK_MIN_WORDS} words min · ${trimmedFeedback.length} / ${FEEDBACK_MAX_CHARS} chars`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-500 text-ink-950 hover:bg-brand-400 disabled:opacity-60"
      >
        {publishMutation.isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <CheckCircle2 size={13} />
        )}
        {interview.status === "FEEDBACK_PUBLISHED"
          ? "Update Feedback"
          : "Publish Feedback"}
      </button>
    </div>
  );
}

export function AdminMockInterviewSection({ userId }: { userId: string }) {
  const { data, isLoading, isError } = useAdminMockInterview(userId);
  const markCompletedMutation = useMarkMockInterviewCompleted(userId);
  const cancelMutation = useCancelMockInterview(userId);

  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <div className="h-6 w-40 rounded bg-white/5 animate-pulse mb-4" />
        <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <p className="text-sm text-red-400">
          Failed to load mock interview details.
        </p>
      </Card>
    );
  }

  const interview = data.interview;
  const status = interview?.status;
  const assessment = data.assessment;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Mic className="text-brand-400" size={18} />
        <h2 className="text-sm font-semibold text-white/80">Mock Interview</h2>
      </div>
      <p className="text-xs text-white/40 mb-5 leading-relaxed max-w-2xl">
        Manage the student&apos;s pre-placement mock interview — schedule,
        complete, and publish structured feedback.
      </p>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">
            Current Status
          </p>
          {status ? (
            <MockInterviewStatusBadge status={status} variant="dark" />
          ) : (
            <span className="text-sm text-white/40">Not requested</span>
          )}
        </div>
        <Field
          label="Assessment Score"
          value={
            assessment.assessmentScore != null
              ? `${Math.round(assessment.assessmentScore)}%`
              : assessment.assessmentCompleted
                ? "Passed"
                : "Not completed"
          }
        />
        <Field
          label="Request Date"
          value={
            interview && status !== "CANCELLED"
              ? formatDateTime(interview.createdAt)
              : null
          }
        />
      </div>

      {!assessment.assessmentCompleted && (
        <p className="text-sm text-white/35 mb-4">
          Student has not passed the Pre-Placement Assessment yet.
        </p>
      )}

      {!interview && assessment.assessmentCompleted && (
        <p className="text-sm text-white/35">
          Assessment passed — waiting for the student to request a mock
          interview.
        </p>
      )}

      {status === "CANCELLED" && (
        <p className="text-sm text-white/35 mb-4">
          Interview was cancelled. Student can request again.
        </p>
      )}

      {/* Requested → schedule */}
      <AnimatePresence mode="wait">
        {status === "REQUESTED" && (
          <motion.div
            key="request-schedule"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4"
          >
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <ScheduleForm
                userId={userId}
                interview={interview}
                title="Schedule Interview"
              />
            </div>
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10"
            >
              <X size={13} />
              Cancel Request
            </button>
          </motion.div>
        )}

        {(status === "SCHEDULED" ||
          status === "COMPLETED" ||
          status === "FEEDBACK_PUBLISHED") &&
          interview && (
            <motion.div
              key="scheduled-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-5"
            >
              {!isEditingSchedule ? (
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      Interview Details
                    </span>
                    {status === "SCHEDULED" && (
                      <button
                        type="button"
                        onClick={() => setIsEditingSchedule(true)}
                        className="text-xs font-semibold text-white/50 hover:text-brand-400 transition-colors"
                      >
                        Edit / Reschedule
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <Field label="Interviewer Name" value={interview.interviewerName} />
                    <Field
                      label="Interview Date"
                      value={
                        interview.scheduledAt
                          ? new Date(interview.scheduledAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : null
                      }
                    />
                    <Field
                      label="Interview Time"
                      value={
                        interview.scheduledAt
                          ? new Date(interview.scheduledAt).toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : null
                      }
                    />
                    <Field
                      label="Duration"
                      value={
                        interview.durationMinutes
                          ? `${interview.durationMinutes} min`
                          : null
                      }
                    />
                    <Field
                      label="Completion Status"
                      value={
                        status === "FEEDBACK_PUBLISHED"
                          ? "Completed with feedback"
                          : status === "COMPLETED"
                            ? "Completed — feedback pending"
                            : "Scheduled"
                      }
                    />
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
                        Meeting Link
                      </p>
                      {interview.meetingLink ? (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-2 break-all"
                        >
                          {interview.meetingLink}
                        </a>
                      ) : (
                        <p className="text-sm text-white/40">—</p>
                      )}
                    </div>
                    <Field label="Admin Notes" value={interview.adminNotes} />
                    {status === "FEEDBACK_PUBLISHED" && (
                      <>
                        <Field
                          label="Grade"
                          value={
                            interview.performanceGrade
                              ? PERFORMANCE_GRADE_LABELS[
                                  interview.performanceGrade
                                ]
                              : null
                          }
                        />
                        <div className="md:col-span-2 lg:col-span-3">
                          <Field
                            label="Feedback"
                            value={interview.feedback}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
                  <ScheduleForm
                    userId={userId}
                    interview={interview}
                    title="Reschedule Interview"
                    onDone={() => setIsEditingSchedule(false)}
                  />
                </div>
              )}

              {/* Actions */}
              {status === "SCHEDULED" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markCompletedMutation.mutate()}
                    disabled={markCompletedMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-500 text-ink-950 hover:bg-brand-400 disabled:opacity-60"
                  >
                    {markCompletedMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    Mark Interview Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10"
                  >
                    <X size={13} />
                    Cancel
                  </button>
                </div>
              )}

              {(status === "COMPLETED" || status === "FEEDBACK_PUBLISHED") && (
                <FeedbackForm userId={userId} interview={interview} />
              )}

              {status === "FEEDBACK_PUBLISHED" &&
                interview.performanceGrade && (
                  <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 space-y-3">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                      Published Feedback Summary
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-white/80">
                        Grade:{" "}
                        <strong>
                          {getPerformanceGradeShortLabel(
                            interview.performanceGrade,
                          )}
                        </strong>
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                        {PERFORMANCE_GRADE_LABELS[interview.performanceGrade]}
                      </span>
                      <span className="text-xs text-white/40">
                        Published{" "}
                        {formatDateTime(interview.feedbackPublishedAt)}
                      </span>
                    </div>
                    {interview.feedback && (
                      <div>
                        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
                          Interviewer Feedback
                        </p>
                        <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">
                          {interview.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
            </motion.div>
          )}
      </AnimatePresence>

      {/* Cancel confirm dialog */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white mb-2">
              Cancel Mock Interview?
            </h3>
            <p className="text-xs text-white/40 mb-5">
              The student will be able to submit a new request after cancellation.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/5"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() =>
                  cancelMutation.mutate(undefined, {
                    onSuccess: () => setConfirmCancel(false),
                  })
                }
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
              >
                {cancelMutation.isPending && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Confirm Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Card>
  );
}

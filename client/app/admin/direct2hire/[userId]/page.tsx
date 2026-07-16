"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Sparkles,
  X,
  CalendarClock,
  Video,
  User2,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  Phone,
  Briefcase,
  ExternalLink,
  FileText,
  MessageSquareWarning,
} from "lucide-react";
import { useAdminDirect2HireStudent } from "@/hooks/queries/useAdminDirect2HireStudent";
import { useConfirmCounsellingBooking } from "@/hooks/mutations/useConfirmCounsellingBooking";
import { useMarkCounsellingCompleted } from "@/hooks/mutations/useMarkCounsellingCompleted";
import { useReviewInternshipSubmission } from "@/hooks/mutations/useReviewInternshipSubmission";
import type { AdminD2HStudentProfile } from "@/lib/adminApi";
import type { AdminStudentInternshipTask } from "@/lib/internshipApi";
import { AdminPlacementAssessmentSection } from "@/components/admin/AdminPlacementAssessmentSection";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
      <p className="text-sm text-white/80 whitespace-pre-wrap break-words">
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
  { key: "recommendation", label: "AI Recommendation" },
] as const;

type CounsellingTabKey = (typeof COUNSELLING_TABS)[number]["key"];

function CounsellingTabs({
  counselling,
  recommendation,
}: {
  counselling: NonNullable<AdminD2HStudentProfile["counselling"]>;
  recommendation: AdminD2HStudentProfile["recommendation"];
}) {
  const [active, setActive] = useState<CounsellingTabKey>("career");

  const fields: Record<
    Exclude<CounsellingTabKey, "recommendation">,
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
      <div className="flex items-center gap-1 border-b border-white/6 mb-5 -mt-1 overflow-x-auto scrollbar-none">
        {COUNSELLING_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`relative px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
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

      {active === "recommendation" ? (
        !recommendation ? (
          <div className="py-8 text-center text-sm text-white/35 animate-in fade-in duration-200">
            AI recommendation has not been generated yet.
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-1 duration-200">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-500/5 border border-brand-500/10 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-brand-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest block mb-0.5">
                    Recommended Course
                  </span>
                  <p className="text-base font-bold text-white">
                    {recommendation.recommendedCourseTitle}
                  </p>
                </div>
              </div>
              
              {recommendation.confidenceScore != null && (
                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl">
                  <div className="text-right">
                    <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider block">Confidence</span>
                    <span className="text-sm font-bold text-white/90">
                      {Math.round(recommendation.confidenceScore * 100)}%
                    </span>
                  </div>
                  <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${recommendation.confidenceScore * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest block">Summary</span>
                <div className="text-sm text-white/80 bg-white/[0.01] border border-white/5 rounded-xl p-4 leading-relaxed whitespace-pre-wrap break-words">
                  {recommendation.summary || "—"}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest block">Reasoning</span>
                <div className="text-sm text-white/80 bg-white/[0.01] border border-white/5 rounded-xl p-4 leading-relaxed whitespace-pre-wrap break-words">
                  {recommendation.reasoning || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.isArray(recommendation.studentStrengths) && recommendation.studentStrengths.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest block">Student Strengths</span>
                  <ul className="space-y-2 bg-white/[0.01] border border-white/5 rounded-xl p-4">
                    {recommendation.studentStrengths.map((strength: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <span className="text-emerald-400 mt-1 shrink-0">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(recommendation.growthAreas) && recommendation.growthAreas.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest block">Growth Areas</span>
                  <ul className="space-y-2 bg-white/[0.01] border border-white/5 rounded-xl p-4">
                    {recommendation.growthAreas.map((area: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <span className="text-amber-400 mt-1 shrink-0">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div
          key={active}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-1 duration-200"
        >
          {fields[active].map((f) => (
            <Field key={f.label} label={f.label} value={f.value} />
          ))}
        </div>
      )}
    </Card>
  );
}



function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function BookingSection({
  userId,
  booking,
}: {
  userId: string;
  booking: NonNullable<AdminD2HStudentProfile["booking"]>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [counsellorName, setCounsellorName] = useState(
    booking.counsellorName ?? "",
  );
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    toDatetimeLocalValue(booking.scheduledAt),
  );

  const confirmMutation = useConfirmCounsellingBooking(userId);
  const isConfirmed = booking.status === "CONFIRMED";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counsellorName.trim() || !meetingLink.trim() || !scheduledAt) return;

    confirmMutation.mutate(
      {
        counsellorName: counsellorName.trim(),
        meetingLink: meetingLink.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const PreferredModeIcon = booking.preferredMode === "VOICE" ? Phone : Video;
  const preferredModeLabel = booking.preferredMode === "VOICE" ? "Voice Call" : "Video Call";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">
            Preferred Mode
          </p>
          <div className="flex items-center gap-2 text-sm text-white/80 bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2 w-fit">
            <PreferredModeIcon size={14} className="text-brand-400 shrink-0" />
            <span className="font-semibold">{preferredModeLabel}</span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">
            Status
          </p>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 border rounded-xl w-fit transition-colors ${
              isConfirmed
                ? "bg-emerald-500/10 border-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/10 text-amber-400"
            }`}
          >
            {isConfirmed ? <CheckCircle2 size={13} /> : <CalendarClock size={13} />}
            {isConfirmed ? "Confirmed" : "Pending Schedule"}
          </span>
        </div>

        <div className="sm:col-span-2">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2">
            Student Notes / Comments
          </p>
          <div className="text-sm text-white/70 bg-white/[0.015] border border-white/5 rounded-xl p-4 whitespace-pre-wrap break-words leading-relaxed">
            {booking.notes?.trim() || "No additional comments or notes provided by the student."}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {isConfirmed && !isEditing ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  Confirmed Session Details
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-semibold text-white/50 hover:text-brand-400 transition-colors"
                >
                  Edit Details
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest block">Counsellor</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                    <User2 size={14} className="text-brand-400 shrink-0" />
                    <span>{booking.counsellorName}</span>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest block">Scheduled For</span>
                  <div className="flex items-center gap-2 text-sm font-medium text-white/95">
                    <CalendarClock size={14} className="text-brand-400 shrink-0" />
                    <span>{formatDateTime(booking.scheduledAt)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest block">Meeting Link</span>
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <Video size={14} className="text-brand-400 shrink-0" />
                    <a
                      href={booking.meetingLink ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-400 hover:text-brand-300 underline underline-offset-2 truncate"
                    >
                      {booking.meetingLink}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            onSubmit={handleSubmit}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-1">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarClock size={12} className="text-brand-400" />
                  {isConfirmed ? "Reschedule Session" : "Schedule Session Details"}
                </span>
                {isConfirmed && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
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
                    Counsellor Name
                  </label>
                  <input
                    type="text"
                    value={counsellorName}
                    onChange={(e) => setCounsellorName(e.target.value)}
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
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
                  <LinkIcon size={11} />
                  Google Meet URL
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
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={confirmMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold
                             bg-brand-500 text-ink-950 hover:bg-brand-400 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {confirmMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  {isConfirmed ? "Update Details" : "Confirm Appointment"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function CompletionSection({
  userId,
  booking,
}: {
  userId: string;
  booking: NonNullable<AdminD2HStudentProfile["booking"]>;
}) {
  const markCompletedMutation = useMarkCounsellingCompleted(userId);

  if (booking.status !== "CONFIRMED") return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/6">
      {!booking.counsellingCompleted ? (
        <button
          onClick={() => markCompletedMutation.mutate()}
          disabled={markCompletedMutation.isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold
                     bg-brand-500 text-ink-950 hover:bg-brand-400 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {markCompletedMutation.isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <CheckCircle2 size={13} />
          )}
          Mark Counselling Completed
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 w-fit">
          <CheckCircle2 size={13} />
          Counselling Completed
          {booking.selectedCourse && ` · Selected: ${booking.selectedCourse.title}`}
        </span>
      )}
    </div>
  );
}

const INTERNSHIP_STATUS_STYLE: Record<
  string,
  string
> = {
  APPROVED: "bg-emerald-500/10 text-emerald-400",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-400",
  AVAILABLE: "bg-blue-500/10 text-blue-400",
  CHANGES_REQUESTED: "bg-orange-500/10 text-orange-400",
  LOCKED: "bg-white/5 text-white/30",
  NOT_STARTED: "bg-white/5 text-white/40",
};

function InternshipReviewRow({
  userId,
  task,
}: {
  userId: string;
  task: AdminStudentInternshipTask;
}) {
  const reviewMutation = useReviewInternshipSubmission(userId);
  const [feedback, setFeedback] = useState(task.adminFeedback ?? "");
  const [error, setError] = useState("");

  const canReview =
    task.backendStatus === "UNDER_REVIEW" && !!task.submissionId;

  const review = async (status: "APPROVED" | "CHANGES_REQUESTED") => {
    if (!task.submissionId) return;
    setError("");
    if (status === "CHANGES_REQUESTED" && !feedback.trim()) {
      setError("Feedback is required when requesting changes");
      return;
    }
    try {
      await reviewMutation.mutateAsync({
        submissionId: task.submissionId,
        payload: {
          status,
          adminFeedback: feedback.trim() || null,
        },
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? "Review failed");
    }
  };

  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Week {task.weekNumber}
            {!task.isPublished && " · Draft"}
          </p>
          <h3 className="text-sm font-semibold text-white mt-0.5">
            {task.title}
          </h3>
          <p className="text-xs text-white/40 mt-1 line-clamp-2">
            {task.shortDescription}
          </p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            INTERNSHIP_STATUS_STYLE[task.derivedStatus] ??
            "bg-white/5 text-white/30"
          }`}
        >
          {task.derivedStatus.replaceAll("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <Field
          label="Submitted On"
          value={
            task.submittedAt
              ? formatDateTime(task.submittedAt)
              : "—"
          }
        />
        <Field
          label="Reviewed On"
          value={
            task.reviewedAt ? formatDateTime(task.reviewedAt) : "—"
          }
        />
      </div>

      {task.studentNotes && (
        <div>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
            Student Notes
          </p>
          <p className="text-sm text-white/70 whitespace-pre-wrap">
            {task.studentNotes}
          </p>
        </div>
      )}

      {task.adminFeedback && !canReview && (
        <div>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
            Admin Feedback
          </p>
          <p className="text-sm text-white/70 whitespace-pre-wrap">
            {task.adminFeedback}
          </p>
        </div>
      )}

      {task.attachments.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
            Attachments &amp; Links
          </p>
          <ul className="space-y-1.5">
            {task.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"
                >
                  {a.kind === "LINK" ? (
                    <LinkIcon size={12} />
                  ) : (
                    <FileText size={12} />
                  )}
                  {a.label || a.originalFilename || a.url}
                  <ExternalLink size={10} className="opacity-50" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canReview && (
        <div className="pt-2 border-t border-white/6 space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5 block">
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Notes for the student…"
              className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none focus:border-brand-500/60 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => review("APPROVED")}
              disabled={reviewMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-ink-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              {reviewMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} />
              )}
              Approve
            </button>
            <button
              onClick={() => review("CHANGES_REQUESTED")}
              disabled={reviewMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 disabled:opacity-60"
            >
              <MessageSquareWarning size={12} />
              Request Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InternshipProgressSection({
  userId,
  internship,
}: {
  userId: string;
  internship: AdminD2HStudentProfile["internship"];
}) {
  if (!internship?.course) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="text-brand-400" size={18} />
          <h2 className="text-sm font-semibold text-white/80">
            Internship Progress
          </h2>
        </div>
        <p className="text-sm text-white/35">
          Student has not selected a Direct2Hire course yet.
        </p>
      </Card>
    );
  }

  const { progress, tasks, course } = internship;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="text-brand-400" size={18} />
            <h2 className="text-sm font-semibold text-white/80">
              Internship Progress
            </h2>
          </div>
          <p className="text-xs text-white/40">{course.title}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">
            {progress.approvedCount}{" "}
            <span className="text-white/30 font-normal text-sm">/</span>{" "}
            {progress.total}
          </p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">
            Approved
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { label: "Approved", value: progress.approved },
          { label: "Under Review", value: progress.underReview },
          { label: "Available", value: progress.available },
          { label: "Locked", value: progress.locked },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/6 bg-ink-900/40 px-3 py-2.5"
          >
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
              {s.label}
            </p>
            <p className="text-lg font-bold text-white mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-white/35">
          No internship tasks configured for this course yet.
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <InternshipReviewRow
              key={task.taskId}
              userId={userId}
              task={task}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function AdminDirect2HireStudentPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const { data, isLoading, isError, error } =
    useAdminDirect2HireStudent(userId);

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
          <p className="text-xs text-white/30 mt-3">
            Joined {formatDate(lead?.createdAt ?? user.createdAt)}
          </p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-white/80 mb-4">Basic Information</h2>
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
          </div>
          
          <div className="border-t lg:border-t-0 lg:border-l border-white/6 pt-6 lg:pt-0 lg:pl-6">
            <h2 className="text-sm font-semibold text-white/80 mb-4">Personal Note</h2>
            <p className="text-sm text-white/70 whitespace-pre-wrap break-words leading-relaxed bg-white/[0.01] border border-white/5 rounded-xl p-4 min-h-[120px]">
              {counselling?.personalNote?.trim() || "No personal notes provided by the student."}
            </p>
          </div>
        </div>
      </Card>

      {!counselling ? (
        <Card>
          <p className="text-sm text-white/35">
            Student has not completed the counselling questionnaire yet.
          </p>
        </Card>
      ) : (
        <CounsellingTabs counselling={counselling} recommendation={recommendation} />
      )}

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock className="text-brand-400" size={18} />
          <h2 className="text-sm font-semibold text-white/80">1-on-1 Counselling Session</h2>
        </div>
        <p className="text-xs text-white/40 mb-5 leading-relaxed max-w-2xl">
          Schedule and manage the 1-on-1 career counselling session for this student.
          The student will be notified of the counsellor assignment and meeting details in their dashboard.
        </p>
        {!data.booking ? (
          <p className="text-sm text-white/35">No session requested yet.</p>
        ) : (
          <>
            <BookingSection userId={userId} booking={data.booking} />
            <CompletionSection userId={userId} booking={data.booking} />
          </>
        )}
      </Card>

      <InternshipProgressSection
        userId={userId}
        internship={
          data.internship ?? {
            course: null,
            progress: {
              approved: 0,
              underReview: 0,
              available: 0,
              locked: 0,
              total: 0,
              approvedCount: 0,
            },
            tasks: [],
          }
        }
      />

      <AdminPlacementAssessmentSection userId={userId} />
    </div>
  );
}

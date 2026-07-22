"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { useSaveCounsellingFeedback } from "@/hooks/mutations/useSaveCounsellingFeedback";
import {
  ASSESSMENT_ALIGNMENT_OPTIONS,
  COMMUNICATION_RATING_OPTIONS,
  MOTIVATION_LEVEL_OPTIONS,
  OVERALL_POTENTIAL_OPTIONS,
  RECOMMENDED_COURSE_OPTIONS,
  getCounsellingFeedbackLabel,
  type SaveCounsellingFeedbackPayload,
} from "@/lib/counselling/counsellingFeedbackConstants";
import {
  counsellingFeedbackSchema,
  type CounsellingFeedbackFormValues,
} from "@/lib/counselling/counsellingFeedbackSchema";
import type { AdminD2HStudentProfile } from "@/lib/adminApi";

function AdminRadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
      <p className="text-xs font-semibold text-white/70">{label}</p>
      <div className="mt-3 space-y-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`relative flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                selected
                  ? "border-brand-500/50 bg-brand-500/10 text-white"
                  : "border-white/8 bg-ink-900/40 text-white/60 hover:border-white/15 hover:text-white/80"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 border-white/20 bg-ink-900 text-brand-500 focus:ring-brand-500/40"
              />
              <span className={selected ? "font-semibold" : "font-medium"}>
                {option.label}
              </span>
              {selected && (
                <motion.div
                  layoutId={`admin-feedback-${name}`}
                  className="pointer-events-none absolute inset-0 rounded-lg border-2 border-brand-500/60"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mt-2 text-xs font-semibold text-red-400">{error}</p>
      )}
    </div>
  );
}

function ReadOnlyFeedback({
  feedback,
  booking,
}: {
  feedback: NonNullable<AdminD2HStudentProfile["feedback"]>;
  booking: NonNullable<AdminD2HStudentProfile["booking"]>;
}) {
  const fields = [
    {
      label: "Assessment Alignment",
      value: getCounsellingFeedbackLabel(
        "assessmentAlignment",
        feedback.assessmentAlignment,
      ),
    },
    {
      label: "Recommended Learning Path",
      value: getCounsellingFeedbackLabel(
        "recommendedCourse",
        feedback.recommendedCourse,
      ),
    },
    {
      label: "Communication Skills",
      value: getCounsellingFeedbackLabel(
        "communicationRating",
        feedback.communicationRating,
      ),
    },
    {
      label: "Motivation Level",
      value: getCounsellingFeedbackLabel(
        "motivationLevel",
        feedback.motivationLevel,
      ),
    },
    {
      label: "Overall Potential",
      value: getCounsellingFeedbackLabel(
        "overallPotential",
        feedback.overallPotential,
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 w-fit">
        <CheckCircle2 size={13} />
        Counselling Completed
        {booking.selectedCourse && ` · Selected: ${booking.selectedCourse.title}`}
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-lg border border-white/6 bg-white/[0.02] p-3"
          >
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
              {field.label}
            </p>
            <p className="text-sm text-white/80">{field.value}</p>
          </div>
        ))}
      </div>

      {feedback.description?.trim() ? (
        <div className="rounded-lg border border-white/6 bg-white/[0.02] p-3">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">
            Additional Feedback
          </p>
          <p className="text-sm text-white/80 whitespace-pre-wrap">
            {feedback.description}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function CounsellingFeedbackSection({
  userId,
  booking,
  feedback,
}: {
  userId: string;
  booking: NonNullable<AdminD2HStudentProfile["booking"]>;
  feedback: AdminD2HStudentProfile["feedback"];
}) {
  const saveMutation = useSaveCounsellingFeedback(userId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CounsellingFeedbackFormValues>({
    resolver: zodResolver(counsellingFeedbackSchema),
    defaultValues: {
      assessmentAlignment: undefined,
      recommendedCourse: undefined,
      communicationRating: undefined,
      motivationLevel: undefined,
      overallPotential: undefined,
      description: "",
    },
  });

  useEffect(() => {
    if (feedback) {
      reset({
        assessmentAlignment:
          feedback.assessmentAlignment as CounsellingFeedbackFormValues["assessmentAlignment"],
        recommendedCourse:
          feedback.recommendedCourse as CounsellingFeedbackFormValues["recommendedCourse"],
        communicationRating:
          feedback.communicationRating as CounsellingFeedbackFormValues["communicationRating"],
        motivationLevel:
          feedback.motivationLevel as CounsellingFeedbackFormValues["motivationLevel"],
        overallPotential:
          feedback.overallPotential as CounsellingFeedbackFormValues["overallPotential"],
        description: feedback.description ?? "",
      });
    }
  }, [feedback, reset]);

  if (booking.status !== "CONFIRMED") return null;

  if (booking.counsellingCompleted) {
    return (
      <div className="mt-6 pt-6 border-t border-white/6">
        {feedback ? (
          <ReadOnlyFeedback feedback={feedback} booking={booking} />
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

  const onSubmit = handleSubmit((values) => {
    saveMutation.mutate({
      ...(values as SaveCounsellingFeedbackPayload),
      description: values.description?.trim() || null,
    });
  });

  return (
    <div className="mt-6 pt-6 border-t border-white/6">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList size={16} className="text-brand-400" />
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">
          Counselling Feedback
        </h3>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <AdminRadioGroup
          label="Does the assessment result align with the candidate's career goals?"
          name="assessmentAlignment"
          options={ASSESSMENT_ALIGNMENT_OPTIONS}
          value={watch("assessmentAlignment") ?? ""}
          onChange={(value) =>
            setValue(
              "assessmentAlignment",
              value as CounsellingFeedbackFormValues["assessmentAlignment"],
              { shouldValidate: true },
            )
          }
          error={errors.assessmentAlignment?.message}
        />

        <AdminRadioGroup
          label="Which learning path do you recommend?"
          name="recommendedCourse"
          options={RECOMMENDED_COURSE_OPTIONS}
          value={watch("recommendedCourse") ?? ""}
          onChange={(value) =>
            setValue(
              "recommendedCourse",
              value as CounsellingFeedbackFormValues["recommendedCourse"],
              { shouldValidate: true },
            )
          }
          error={errors.recommendedCourse?.message}
        />

        <AdminRadioGroup
          label="How would you rate the candidate's communication skills?"
          name="communicationRating"
          options={COMMUNICATION_RATING_OPTIONS}
          value={watch("communicationRating") ?? ""}
          onChange={(value) =>
            setValue(
              "communicationRating",
              value as CounsellingFeedbackFormValues["communicationRating"],
              { shouldValidate: true },
            )
          }
          error={errors.communicationRating?.message}
        />

        <AdminRadioGroup
          label="How motivated is the candidate to build a career using AI?"
          name="motivationLevel"
          options={MOTIVATION_LEVEL_OPTIONS}
          value={watch("motivationLevel") ?? ""}
          onChange={(value) =>
            setValue(
              "motivationLevel",
              value as CounsellingFeedbackFormValues["motivationLevel"],
              { shouldValidate: true },
            )
          }
          error={errors.motivationLevel?.message}
        />

        <AdminRadioGroup
          label="Based on the counselling session, what is the candidate's overall potential for success in the recommended program?"
          name="overallPotential"
          options={OVERALL_POTENTIAL_OPTIONS}
          value={watch("overallPotential") ?? ""}
          onChange={(value) =>
            setValue(
              "overallPotential",
              value as CounsellingFeedbackFormValues["overallPotential"],
              { shouldValidate: true },
            )
          }
          error={errors.overallPotential?.message}
        />

        <div className="rounded-xl border border-white/6 bg-white/[0.02] p-4">
          <label
            htmlFor="counselling-feedback-description"
            className="text-xs font-semibold text-white/70"
          >
            Additional Feedback (Optional)
          </label>
          <textarea
            id="counselling-feedback-description"
            rows={4}
            placeholder="Custom observations and guidance for the student..."
            className="mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white/90 placeholder-white/25 outline-none transition focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/40"
            {...register("description")}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="submit"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold
                         bg-brand-500 text-ink-950 hover:bg-brand-400 active:scale-98 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              Save Feedback & Mark Counselling Completed
            </button>
          </motion.div>
        </AnimatePresence>
      </form>
    </div>
  );
}

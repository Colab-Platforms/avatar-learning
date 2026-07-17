"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  Clock3,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useCourseSelection } from "@/hooks/queries/useCourseSelection";
import { useSelectCourse } from "@/hooks/mutations/useSelectCourse";
import type { CourseSelectionCourse } from "@/lib/direct2hireApi";

function CourseCard({
  course,
  onSelect,
  disabled,
}: {
  course: CourseSelectionCourse;
  onSelect: () => void;
  disabled: boolean;
}) {
  const learnItems = (course.whatYouLearn ?? []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="h-36 w-full bg-slate-100 overflow-hidden">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Sparkles size={28} />
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <span className="inline-block mb-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase tracking-wide w-fit">
          {course.level}
        </span>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sm text-slate-500 mb-3 line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={13} className="text-slate-400" />
            {course.totalWeeks} week{course.totalWeeks !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BarChart3 size={13} className="text-slate-400" />
            {course.level}
          </span>
        </div>

        {learnItems.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {learnItems.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-slate-600"
              >
                <CheckCircle2
                  size={13}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />
                <span className="line-clamp-1">{item.title}</span>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          className="mt-auto inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Select Course
        </button>
      </div>
    </motion.div>
  );
}

function ConfirmDialog({
  course,
  isPending,
  onCancel,
  onConfirm,
}: {
  course: CourseSelectionCourse;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Confirm your course
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          You&apos;re about to select{" "}
          <span className="font-semibold text-slate-800">{course.title}</span>
          . You can only choose one course. This cannot be changed later.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function CourseSelectionPanel() {
  const router = useRouter();
  const { data, isLoading, isError } = useCourseSelection();
  const selectMutation = useSelectCourse();
  const [pendingCourse, setPendingCourse] =
    useState<CourseSelectionCourse | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Failed to load course selection. Please refresh and try again.
      </div>
    );
  }

  if (!data.counsellingCompleted) {
    return null;
  }

  if (data.selectedCourseId && data.selectedCourse) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Course Selected
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              You&apos;ve chosen{" "}
              <span className="font-semibold">{data.selectedCourse.title}</span>.
              This course is now available in your AI Learning section.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/learning")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
        >
          Go to Learning <ArrowRight size={14} />
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Your counselling has been completed.
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your counsellor has recommended that you continue your journey by
          selecting one of the Direct2Hire learning tracks. Please choose one
          course below. You can only select ONE course. This action cannot be
          changed later.
        </p>
      </div>

      {data.availableCourses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            No Direct2Hire courses are available right now. Please check back
            soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {data.availableCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              disabled={selectMutation.isPending}
              onSelect={() => setPendingCourse(course)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {pendingCourse && (
          <ConfirmDialog
            course={pendingCourse}
            isPending={selectMutation.isPending}
            onCancel={() => setPendingCourse(null)}
            onConfirm={() =>
              selectMutation.mutate(pendingCourse.id, {
                onSuccess: () => {
                  setPendingCourse(null);
                  router.push("/dashboard/learning");
                },
                onError: () => setPendingCourse(null),
              })
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

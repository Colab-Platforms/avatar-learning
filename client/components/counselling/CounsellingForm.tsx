"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FormFieldRenderer from "@/components/counselling/FormFieldRenderer";
import { useSubmitCounselling } from "@/hooks/mutations/useSubmitCounselling";
import {
  counsellingFormSections,
  emptyCounsellingFormValues,
  type CounsellingFormValues,
  type FormFieldConfig,
} from "@/lib/counselling/formConfig";
import {
  counsellingSchema,
  toCounsellingPayload,
} from "@/lib/counselling/counsellingSchema";
import PretextAnimatedHeight, {
  AnimatedHeight,
} from "./PretextAnimatedHeight";

interface CounsellingFormProps {
  onCancel?: () => void;
}

export default function CounsellingForm({ onCancel }: CounsellingFormProps) {
  const submitMutation = useSubmitCounselling();
  const [activeStep, setActiveStep] = useState(0);
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const activeSection = counsellingFormSections[activeStep];

  const isLastStep =
    activeStep === counsellingFormSections.length - 1 &&
    activeFieldIndex === activeSection.fields.length - 1;

  const formTopRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const defaultValues = useMemo<CounsellingFormValues>(
    () => emptyCounsellingFormValues,
    [],
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<CounsellingFormValues>({
    resolver: zodResolver(counsellingSchema),
    defaultValues,
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const stepLabels = ["Goals", "Personality", "Notes"];

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    formTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [activeStep, activeFieldIndex]);

  const getFieldNames = (field: FormFieldConfig) => {
    const names = [field.name];
    if (field.otherField) {
      names.push(field.otherField);
    }
    return names as Array<keyof CounsellingFormValues>;
  };

  const handleNext = async () => {
    const currentField = activeSection.fields[activeFieldIndex];
    const fieldNames = getFieldNames(currentField);
    const valid = await trigger(fieldNames, { shouldFocus: true });
    if (valid) {
      if (activeFieldIndex < activeSection.fields.length - 1) {
        setActiveFieldIndex((prev) => prev + 1);
      } else if (activeStep < counsellingFormSections.length - 1) {
        setActiveStep((prev) => prev + 1);
        setActiveFieldIndex(0);
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 0 && activeFieldIndex === 0) {
      if (onCancel) {
        onCancel();
      }
      return;
    }
    if (activeFieldIndex > 0) {
      setActiveFieldIndex((prev) => prev - 1);
    } else {
      const prevStep = activeStep - 1;
      setActiveStep(prevStep);
      setActiveFieldIndex(counsellingFormSections[prevStep].fields.length - 1);
    }
  };

  const submitForm = handleSubmit(
    async (values) => {
      try {
        await submitMutation.mutateAsync(toCounsellingPayload(values));
      } catch {
        // Error toast handled in mutation hook.
      }
    },
    async () => {
      // Find first invalid question and navigate to it
      for (let i = 0; i < counsellingFormSections.length; i++) {
        const section = counsellingFormSections[i];
        for (let j = 0; j < section.fields.length; j++) {
          const field = section.fields[j];
          const fieldNames = getFieldNames(field);
          const valid = await trigger(fieldNames, { shouldFocus: true });
          if (!valid) {
            setActiveStep(i);
            setActiveFieldIndex(j);
            return;
          }
        }
      }
    },
  );

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleSubmitClick = () => {
    if (!isLastStep) return;
    void submitForm();
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement;
    const tagName = target.tagName;

    // Allow newline in textarea; block implicit form submit elsewhere.
    if (tagName === "TEXTAREA") return;

    event.preventDefault();

    // Trigger next or submit when Enter is pressed
    if (isLastStep) {
      void submitForm();
    } else {
      void handleNext();
    }
  };

  const totalQuestions = useMemo(() => {
    return counsellingFormSections.reduce((sum, sec) => sum + sec.fields.length, 0);
  }, []);

  const currentQuestionIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < activeStep; i++) {
      count += counsellingFormSections[i].fields.length;
    }
    return count + activeFieldIndex;
  }, [activeStep, activeFieldIndex]);

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div
      ref={formTopRef}
      className="scroll-mt-6 relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/40"
    >
      <div className="h-1.5 w-full bg-slate-100">
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-6 sm:p-10">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {Math.round(progressPercent)}% complete
            </span>
          </div>

          <div className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="relative mt-7">
            <div
              aria-hidden
              className="absolute left-[calc(16.67%-8px)] right-[calc(16.67%-8px)] top-3.5 h-px bg-slate-200"
            />
            <div className="grid grid-cols-3 gap-2">
              {stepLabels.map((label, idx) => {
                const isActive = idx === activeStep;
                const isCompleted = idx < activeStep;
                return (
                  <div
                    key={label}
                    className="relative flex flex-col items-center gap-2 text-center"
                  >
                    <div
                      className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200/80 ring-4 ring-blue-50"
                          : isCompleted
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200/60"
                            : "border border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`hidden text-[11px] font-bold uppercase tracking-wider transition-colors duration-300 sm:inline ${
                        isActive
                          ? "text-blue-600"
                          : isCompleted
                            ? "text-emerald-600"
                            : "text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/80 to-white px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-200/60">
              {activeSection.badge}
            </span>
            <div className="min-w-0 flex-1">
              <PretextAnimatedHeight
                text={activeSection.title}
                font="bold 20px Inter"
                lineHeight={28}
              >
                <h2 className="text-lg font-bold leading-tight text-slate-800 sm:text-xl">
                  {activeSection.title}
                </h2>
              </PretextAnimatedHeight>
              <PretextAnimatedHeight
                text={activeSection.subtitle}
                font="13px Inter"
                lineHeight={20}
                className="mt-1.5"
              >
                <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
                  {activeSection.subtitle}
                </p>
              </PretextAnimatedHeight>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleFormSubmit}
          onKeyDown={handleFormKeyDown}
          noValidate
          className="space-y-6"
        >
          <AnimatedHeight durationMs={360}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeStep}-${activeFieldIndex}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="space-y-4 sm:space-y-5">
                  <FormFieldRenderer
                    config={activeSection.fields[activeFieldIndex]}
                    control={control}
                    errors={errors}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </AnimatedHeight>

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="min-w-[88px]">
              {(activeStep > 0 || activeFieldIndex > 0 || onCancel) && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {activeStep === 0 && activeFieldIndex === 0 ? "Cancel" : "Back"}
                </button>
              )}
            </div>

            <div>
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => void handleNext()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={submitMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Responses"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
        <p className="text-center text-[11px] leading-normal text-slate-500">
          Avatar India — AI Assessment · Your responses are confidential and
          used to generate your personalized course recommendation.
        </p>
      </div>
    </div>
  );
}

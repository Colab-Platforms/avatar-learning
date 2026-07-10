"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import FormFieldRenderer from "@/components/counselling/FormFieldRenderer";
import { useSubmitCounselling } from "@/hooks/mutations/useSubmitCounselling";
import {
  counsellingFormSections,
  emptyCounsellingFormValues,
  type CounsellingFormValues,
} from "@/lib/counselling/formConfig";
import {
  toCounsellingPayload,
  validateCounsellingForm,
} from "@/lib/counselling/counsellingValidation";
import type { RootState } from "@/store";
import PretextAnimatedHeight from "./PretextAnimatedHeight";

export default function CounsellingForm() {
  const { user } = useSelector((state: RootState) => state.auth);
  const submitMutation = useSubmitCounselling();
  const [activeStep, setActiveStep] = useState(0);

  const defaultValues = useMemo<CounsellingFormValues>(() => {
    const fullName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      ...emptyCounsellingFormValues,
      fullName,
      email: user?.email ?? "",
      contactNumber: user?.phoneNo ?? "",
    };
  }, [user]);

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<CounsellingFormValues>({
    defaultValues,
    mode: "onSubmit",
  });

  const activeSection = counsellingFormSections[activeStep];

  const handleNext = () => {
    const values = getValues();
    const validationErrors = validateCounsellingForm(values);
    
    // Get fields belonging to the current active section
    const fieldNames = activeSection.fields.map((f) => f.name);
    const otherFieldNames = activeSection.fields
      .map((f) => f.otherField)
      .filter(Boolean) as string[];
    const sectionFieldNames = [...fieldNames, ...otherFieldNames];

    // Clear previous errors for these fields
    sectionFieldNames.forEach((name) => {
      clearErrors(name as keyof CounsellingFormValues);
    });

    // Check if there are any errors in the current section
    let hasError = false;
    sectionFieldNames.forEach((name) => {
      const err = validationErrors[name as keyof CounsellingFormValues];
      if (err) {
        hasError = true;
        setError(name as keyof CounsellingFormValues, {
          type: err.type,
          message: err.message,
        });
      }
    });

    if (!hasError) {
      setActiveStep((prev) => Math.min(prev + 1, counsellingFormSections.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = handleSubmit(async (values) => {
    // Validate final step/all form fields
    const validationErrors = validateCounsellingForm(values);
    const errorKeys = Object.keys(validationErrors) as Array<
      keyof CounsellingFormValues
    >;

    if (errorKeys.length > 0) {
      errorKeys.forEach((key) => {
        const fieldError = validationErrors[key];
        if (fieldError?.message) {
          setError(key, { type: fieldError.type, message: fieldError.message });
        }
      });

      // Find the first step that contains an error and go to it
      for (let i = 0; i < counsellingFormSections.length; i++) {
        const sect = counsellingFormSections[i];
        const fNames = sect.fields.map((f) => f.name);
        const oNames = sect.fields.map((f) => f.otherField).filter(Boolean) as string[];
        const allNames = [...fNames, ...oNames];
        const hasSectError = allNames.some((name) => errorKeys.includes(name as any));
        if (hasSectError) {
          setActiveStep(i);
          break;
        }
      }
      return;
    }

    try {
      await submitMutation.mutateAsync(toCounsellingPayload(values));
    } catch {
      // Error toast handled in mutation hook.
    }
  });

  const stepLabels = ["Basics", "Goals", "Personality", "Notes"];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100/50">
      {/* Top Gradient Decorative Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
      
      {/* Card Content Wrapper */}
      <div className="p-6 sm:p-10">
        {/* Stepper Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Step {activeStep + 1} of {counsellingFormSections.length}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {Math.round(((activeStep + 1) / counsellingFormSections.length) * 100)}% Complete
            </span>
          </div>
          
          {/* Progress track */}
          <div className="relative mt-3 h-2 w-full rounded-full bg-slate-100">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{
                width: `${((activeStep + 1) / counsellingFormSections.length) * 100}%`,
              }}
            />
          </div>

          {/* Step circles */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {stepLabels.map((label, idx) => {
              const isActive = idx === activeStep;
              const isCompleted = idx < activeStep;
              return (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer"
                  onClick={() => {
                    // Only allow clicking to past steps or next if valid
                    if (idx < activeStep) {
                      setActiveStep(idx);
                    } else if (idx === activeStep) {
                      // Do nothing
                    } else {
                      // Check validation for intermediate steps before jumping forward
                      let tempStep = activeStep;
                      while (tempStep < idx) {
                        const sect = counsellingFormSections[tempStep];
                        const fieldNames = sect.fields.map((f) => f.name);
                        const otherFieldNames = sect.fields
                          .map((f) => f.otherField)
                          .filter(Boolean) as string[];
                        const sectionFieldNames = [...fieldNames, ...otherFieldNames];
                        const valErrors = validateCounsellingForm(getValues());
                        const hasErr = sectionFieldNames.some((n) => valErrors[n as keyof CounsellingFormValues]);
                        if (hasErr) {
                          // Trigger errors display
                          sectionFieldNames.forEach((name) => {
                            const err = valErrors[name as keyof CounsellingFormValues];
                            if (err) {
                              setError(name as keyof CounsellingFormValues, {
                                type: err.type,
                                message: err.message,
                              });
                            }
                          });
                          break;
                        } else {
                          sectionFieldNames.forEach((name) => {
                            clearErrors(name as keyof CounsellingFormValues);
                          });
                          tempStep++;
                        }
                      }
                      setActiveStep(tempStep);
                    }
                  }}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-50"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`hidden sm:inline text-[11px] font-bold uppercase tracking-wider ${
                      isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Title Header Area */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
              {activeSection.badge === "•" ? activeStep + 1 : activeSection.badge}
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {activeSection.title}
              </h2>
              {/* PretextAnimatedHeight for dynamic subtitle transition */}
              <PretextAnimatedHeight
                text={activeSection.subtitle}
                font="13px Inter"
                lineHeight={18}
                className="mt-1"
              >
                <p className="text-xs sm:text-sm text-slate-500">
                  {activeSection.subtitle}
                </p>
              </PretextAnimatedHeight>
            </div>
          </div>
        </div>

        {/* Step Fields Wrapper */}
        <form onSubmit={onSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className={
                  activeSection.id === "candidate-details"
                    ? "grid gap-5 sm:grid-cols-2"
                    : "space-y-5"
                }
              >
                {activeSection.fields.map((field) => (
                  <FormFieldRenderer
                    key={field.name}
                    config={field}
                    control={control}
                    errors={errors}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Actions Bottom Bar */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <div>
              {activeStep > 0 && (
                <button
                  key="back-button"
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
            </div>

            <div>
              {activeStep < counsellingFormSections.length - 1 ? (
                <button
                  key="continue-button"
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-md shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  key="submit-button"
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
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

      {/* confidential note */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-500 leading-normal text-center">
          Avatar India — Career & Education Counselling · Your responses are
          confidential and reviewed only by your assigned counsellor.
        </p>
      </div>
    </div>
  );
}

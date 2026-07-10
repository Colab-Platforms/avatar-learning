import type { Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  OTHER_VALUE,
  type CounsellingFormValues,
  type FormFieldConfig,
} from "@/lib/counselling/formConfig";

interface RadioGroupFieldProps {
  config: FormFieldConfig;
  control: Control<CounsellingFormValues>;
  error?: FieldError;
  otherError?: FieldError;
}

const otherInputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400";

export default function RadioGroupField({
  config,
  control,
  error,
  otherError,
}: RadioGroupFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6 transition-all duration-200">
      {config.questionNumber && (
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
          Question {config.questionNumber}
        </p>
      )}
      <p className="text-sm font-bold text-slate-800 leading-snug">{config.label}</p>
      {config.description && (
        <p className="mt-1 text-xs text-slate-500">{config.description}</p>
      )}

      <Controller
        name={config.name as keyof CounsellingFormValues}
        control={control}
        render={({ field }) => (
          <div className="mt-4 space-y-2.5">
            {config.options?.map((option) => {
              const selected = field.value === option.value;
              return (
                <label
                  key={option.value}
                  className={`relative flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-sm transition-all duration-200 ${
                    selected
                      ? "border-blue-500 bg-blue-50/40 text-slate-900 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/30"
                  }`}
                >
                  <input
                    type="radio"
                    name={config.name}
                    value={option.value}
                    checked={selected}
                    onChange={() => field.onChange(option.value)}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={selected ? "font-semibold text-blue-900" : "font-medium"}>
                    {option.label}
                  </span>

                  {selected && (
                    <motion.div
                      layoutId={`active-indicator-${config.name}`}
                      className="absolute inset-0 rounded-xl border-2 border-blue-500/80 pointer-events-none"
                      initial={false}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </label>
              );
            })}

            <AnimatePresence initial={false}>
              {config.otherField && field.value === OTHER_VALUE && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="p-0.5">
                    <Controller
                      name={config.otherField as keyof CounsellingFormValues}
                      control={control}
                      render={({ field: otherField }) => (
                        <input
                          {...otherField}
                          type="text"
                          placeholder="Please specify here..."
                          className={otherInputCls}
                        />
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      />

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-500">
          {error.message}
        </p>
      )}
      {otherError && (
        <p className="mt-2 text-xs font-semibold text-red-500">
          {otherError.message}
        </p>
      )}
    </div>
  );
}

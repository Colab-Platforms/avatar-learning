import type { Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";
import type {
  CounsellingFormValues,
  FormFieldConfig,
} from "@/lib/counselling/formConfig";

interface TextareaFieldProps {
  config: FormFieldConfig;
  control: Control<CounsellingFormValues>;
  error?: FieldError;
}

const textareaCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 min-h-[140px] resize-y placeholder-slate-400";

export default function TextareaField({
  config,
  control,
  error,
}: TextareaFieldProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 shadow-sm shadow-slate-100/50 sm:p-6">
      {config.questionNumber && (
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-600">
          Question {config.questionNumber}
        </p>
      )}
      <label
        htmlFor={config.name}
        className="block text-sm font-bold leading-snug text-slate-800"
      >
        {config.label}
      </label>
      {config.description && (
        <p className="mt-1 text-xs text-slate-500">{config.description}</p>
      )}
      <Controller
        name={config.name as keyof CounsellingFormValues}
        control={control}
        render={({ field }) => (
          <div className="mt-4">
            <textarea
              {...field}
              id={config.name}
              placeholder={config.placeholder}
              maxLength={config.maxLength}
              className={textareaCls}
            />
            {config.maxLength && (
              <p className="mt-1.5 text-right text-xs text-slate-400">
                {String(field.value ?? "").length}/{config.maxLength}
              </p>
            )}
          </div>
        )}
      />
      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

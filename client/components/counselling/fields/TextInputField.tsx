import type { Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";
import type {
  CounsellingFormValues,
  FormFieldConfig,
} from "@/lib/counselling/formConfig";

interface TextInputFieldProps {
  config: FormFieldConfig;
  control: Control<CounsellingFormValues>;
  error?: FieldError;
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400";

export default function TextInputField({
  config,
  control,
  error,
}: TextInputFieldProps) {
  return (
    <div>
      <label
        htmlFor={config.name}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {config.label}
      </label>
      <Controller
        name={config.name as keyof CounsellingFormValues}
        control={control}
        render={({ field }) => (
          <input
            {...field}
            id={config.name}
            type={config.inputType ?? "text"}
            placeholder={config.placeholder}
            className={inputCls}
          />
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

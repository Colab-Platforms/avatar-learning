import type { Control, FieldError } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { FormFieldConfig } from "@/lib/counselling/formConfig";

interface CheckboxGroupFieldProps {
  config: FormFieldConfig;
  control: Control<Record<string, string[]>>;
  error?: FieldError;
}

export default function CheckboxGroupField({
  config,
  control,
  error,
}: CheckboxGroupFieldProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">{config.label}</p>
      {config.description && (
        <p className="mt-1 text-sm text-slate-500">{config.description}</p>
      )}

      <Controller
        name={config.name}
        control={control}
        render={({ field }) => {
          const selectedValues = Array.isArray(field.value) ? field.value : [];

          return (
            <div className="mt-4 space-y-2">
              {config.options?.map((option) => {
                const checked = selectedValues.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      checked
                        ? "border-blue-500 bg-blue-50 text-slate-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          field.onChange([...selectedValues, option.value]);
                        } else {
                          field.onChange(
                            selectedValues.filter(
                              (value) => value !== option.value,
                            ),
                          );
                        }
                      }}
                      className="mt-0.5"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          );
        }}
      />

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

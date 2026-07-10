import type { Control, FieldErrors, FieldError } from "react-hook-form";
import type {
  CounsellingFormValues,
  FormFieldConfig,
} from "@/lib/counselling/formConfig";
import CheckboxGroupField from "./fields/CheckboxGroupField";
import RadioGroupField from "./fields/RadioGroupField";
import SelectField from "./fields/SelectField";
import TextInputField from "./fields/TextInputField";
import TextareaField from "./fields/TextareaField";

interface FormFieldRendererProps {
  config: FormFieldConfig;
  control: Control<CounsellingFormValues>;
  errors: FieldErrors<CounsellingFormValues>;
}

export default function FormFieldRenderer({
  config,
  control,
  errors,
}: FormFieldRendererProps) {
  const error = errors[config.name as keyof CounsellingFormValues];
  const otherError = config.otherField
    ? errors[config.otherField as keyof CounsellingFormValues]
    : undefined;

  switch (config.type) {
    case "text":
      return (
        <TextInputField config={config} control={control} error={error} />
      );
    case "textarea":
      return (
        <TextareaField config={config} control={control} error={error} />
      );
    case "radio":
      return (
        <RadioGroupField
          config={config}
          control={control}
          error={error}
          otherError={otherError}
        />
      );
    case "checkbox":
      return (
        <CheckboxGroupField
          config={config}
          control={control as unknown as Control<Record<string, string[]>>}
          error={error}
        />
      );
    case "select":
      return <SelectField config={config} control={control} error={error} />;
    default:
      return null;
  }
}

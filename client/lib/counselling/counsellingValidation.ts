import type { FieldErrors } from "react-hook-form";
import {
  counsellingFormSections,
  OTHER_VALUE,
  type CounsellingFormValues,
} from "./formConfig";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const otherPairs: Array<{
  field: keyof CounsellingFormValues;
  other: keyof CounsellingFormValues;
  message: string;
}> = [
  {
    field: "careerField",
    other: "careerFieldOther",
    message: "Please specify your career field",
  },
  {
    field: "futureGoal",
    other: "futureGoalOther",
    message: "Please specify your future goal",
  },
  {
    field: "careerPriority",
    other: "careerPriorityOther",
    message: "Please specify your career priority",
  },
  {
    field: "studyStream",
    other: "studyStreamOther",
    message: "Please specify your study stream",
  },
  {
    field: "planningChallenge",
    other: "planningChallengeOther",
    message: "Please specify your planning challenge",
  },
  {
    field: "freeTimeActivity",
    other: "freeTimeOther",
    message: "Please specify how you spend free time",
  },
  {
    field: "socialSetting",
    other: "socialSettingOther",
    message: "Please specify your social setting",
  },
  {
    field: "workEnvironment",
    other: "workEnvironmentOther",
    message: "Please specify your work environment",
  },
  {
    field: "stressHandling",
    other: "stressHandlingOther",
    message: "Please specify how you handle stress",
  },
  {
    field: "proudMoment",
    other: "proudMomentOther",
    message: "Please specify what you are proud of",
  },
];

export function validateCounsellingForm(
  values: CounsellingFormValues,
): FieldErrors<CounsellingFormValues> {
  const errors: FieldErrors<CounsellingFormValues> = {};

  for (const section of counsellingFormSections) {
    for (const field of section.fields) {
      const value = values[field.name as keyof CounsellingFormValues];

      if (field.required && !String(value ?? "").trim()) {
        errors[field.name as keyof CounsellingFormValues] = {
          type: "required",
          message: `${field.label} is required`,
        };
      }

      if (field.name === "age" && String(value ?? "").trim()) {
        const age = Number(value);
        if (!Number.isInteger(age) || age < 10 || age > 100) {
          errors.age = {
            type: "validate",
            message: "Age must be a whole number between 10 and 100",
          };
        }
      }

      if (field.name === "email" && String(value ?? "").trim()) {
        if (!emailPattern.test(String(value))) {
          errors.email = {
            type: "pattern",
            message: "Email must be valid",
          };
        }
      }

      if (field.type === "radio" && field.options && String(value ?? "").trim()) {
        const allowed = field.options.map((option) => option.value);
        if (!allowed.includes(String(value))) {
          errors[field.name as keyof CounsellingFormValues] = {
            type: "validate",
            message: "Please select a valid option",
          };
        }
      }

      if (field.maxLength && String(value ?? "").length > field.maxLength) {
        errors[field.name as keyof CounsellingFormValues] = {
          type: "maxLength",
          message: `Maximum ${field.maxLength} characters allowed`,
        };
      }
    }
  }

  for (const pair of otherPairs) {
    if (values[pair.field] === OTHER_VALUE && !values[pair.other]?.trim()) {
      errors[pair.other] = {
        type: "required",
        message: pair.message,
      };
    }
  }

  return errors;
}

export function toCounsellingPayload(values: CounsellingFormValues) {
  return {
    fullName: values.fullName.trim(),
    age: Number(values.age),
    gradeYear: values.gradeYear.trim(),
    institutionName: values.institutionName.trim(),
    contactNumber: values.contactNumber.trim(),
    email: values.email.trim(),
    careerField: values.careerField,
    careerFieldOther:
      values.careerField === OTHER_VALUE ? values.careerFieldOther.trim() : null,
    futureGoal: values.futureGoal,
    futureGoalOther:
      values.futureGoal === OTHER_VALUE ? values.futureGoalOther.trim() : null,
    careerPriority: values.careerPriority,
    careerPriorityOther:
      values.careerPriority === OTHER_VALUE
        ? values.careerPriorityOther.trim()
        : null,
    studyStream: values.studyStream,
    studyStreamOther:
      values.studyStream === OTHER_VALUE ? values.studyStreamOther.trim() : null,
    planningChallenge: values.planningChallenge,
    planningChallengeOther:
      values.planningChallenge === OTHER_VALUE
        ? values.planningChallengeOther.trim()
        : null,
    freeTimeActivity: values.freeTimeActivity,
    freeTimeOther:
      values.freeTimeActivity === OTHER_VALUE
        ? values.freeTimeOther.trim()
        : null,
    socialSetting: values.socialSetting,
    socialSettingOther:
      values.socialSetting === OTHER_VALUE
        ? values.socialSettingOther.trim()
        : null,
    workEnvironment: values.workEnvironment,
    workEnvironmentOther:
      values.workEnvironment === OTHER_VALUE
        ? values.workEnvironmentOther.trim()
        : null,
    stressHandling: values.stressHandling,
    stressHandlingOther:
      values.stressHandling === OTHER_VALUE
        ? values.stressHandlingOther.trim()
        : null,
    proudMoment: values.proudMoment,
    proudMomentOther:
      values.proudMoment === OTHER_VALUE
        ? values.proudMomentOther.trim()
        : null,
    personalNote: values.personalNote.trim() || null,
  };
}

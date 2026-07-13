import { z } from "zod";
import {
  OTHER_VALUE,
  otherFieldPairs,
  type CounsellingFormValues,
} from "@/constants/counsellingQuestions";

const careerFieldOptions = [
  "Technology & Engineering",
  "Medicine & Healthcare",
  "Business, Finance & Management",
  "Arts, Design & Media",
  "Government, Law & Civil Services",
  OTHER_VALUE,
] as const;

const futureGoalOptions = [
  "Get into a top college / course",
  "Land my first job",
  "Start my own venture",
  "Complete a professional certification",
  "Still figuring it out",
  OTHER_VALUE,
] as const;

const careerPriorityOptions = [
  "High income potential",
  "Job security & stability",
  "Passion / genuine interest",
  "Social impact & meaning",
  "Work-life balance",
  OTHER_VALUE,
] as const;

const studyStreamOptions = [
  "Yes — Science",
  "Yes — Commerce",
  "Yes — Arts / Humanities",
  "Yes — a specific skill/vocational path",
  "Not decided yet",
  OTHER_VALUE,
] as const;

const planningChallengeOptions = [
  "I don't know my own strengths",
  "Family or peer pressure",
  "Too many options, hard to choose",
  "Lack of proper guidance",
  "Financial constraints",
  OTHER_VALUE,
] as const;

const aiUnderstandingOptions = [
  "I don't really know what AI is",
  "I've heard of it but never used it",
  "I use AI tools sometimes (like ChatGPT)",
  "I use AI tools regularly for study/work",
  "I actively learn about how AI works",
  OTHER_VALUE,
] as const;

const aiFieldImpactOptions = [
  "Yes, a lot — it'll transform the field",
  "Yes, but only some parts of the job",
  "Not sure / never thought about it",
  "Probably not much",
  "No, my field is untouched by AI",
  OTHER_VALUE,
] as const;

const aiSkillBuildingOptions = [
  "Prompting / using AI tools well",
  "Basic coding or no-code AI tools",
  "Data or analytics skills",
  "None yet, but I want to learn",
  "Not interested in this area",
  OTHER_VALUE,
] as const;

const freeTimeOptions = [
  "Reading",
  "Sports & fitness",
  "Music, art or a creative craft",
  "Gaming",
  "Volunteering / community work",
  OTHER_VALUE,
] as const;

const socialSettingOptions = [
  "Outgoing — love meeting new people",
  "Comfortable in small familiar groups",
  "Prefer one-on-one conversations",
  "Introverted — enjoy my own company",
  "Depends heavily on the setting",
  OTHER_VALUE,
] as const;

const workEnvironmentOptions = [
  "Quiet and structured",
  "Energetic and collaborative",
  "Flexible and independent",
  "Creative and open-ended",
  "A mix, depending on the task",
  OTHER_VALUE,
] as const;

const stressHandlingOptions = [
  "Talk it out with friends or family",
  "Take time alone to reflect",
  "Physical activity or exercise",
  "Stay busy and push through",
  "Still working this one out",
  OTHER_VALUE,
] as const;

const proudMomentOptions = [
  "A skill I taught myself",
  "A leadership role I held",
  "Community or volunteer work",
  "A creative project I made",
  "A personal habit I built",
  OTHER_VALUE,
] as const;

const aiEverydayUseOptions = [
  "Homework or study help",
  "Just for fun / curiosity / chatting",
  "Planning, organizing or productivity",
  "I don't use AI tools personally",
  "I actively explore new AI tools",
  OTHER_VALUE,
] as const;

const aiCuriosityOptions = [
  "Very curious — want to master it",
  "Somewhat interested, if it's useful",
  "Neutral — will learn if required",
  "Not particularly interested",
  "A bit intimidated by it",
  OTHER_VALUE,
] as const;

function requiredOption<T extends readonly string[]>(
  options: T,
  message: string,
) {
  return z
    .string()
    .min(1, message)
    .refine((value) => (options as readonly string[]).includes(value), message);
}

export const counsellingSchema = z
  .object({
    careerField: requiredOption(careerFieldOptions, "Career field is required"),
    careerFieldOther: z.string(),
    futureGoal: requiredOption(futureGoalOptions, "Future goal is required"),
    futureGoalOther: z.string(),
    careerPriority: requiredOption(
      careerPriorityOptions,
      "Career priority is required",
    ),
    careerPriorityOther: z.string(),
    studyStream: requiredOption(studyStreamOptions, "Study stream is required"),
    studyStreamOther: z.string(),
    planningChallenge: requiredOption(
      planningChallengeOptions,
      "Planning challenge is required",
    ),
    planningChallengeOther: z.string(),
    aiUnderstanding: requiredOption(
      aiUnderstandingOptions,
      "AI understanding is required",
    ),
    aiUnderstandingOther: z.string(),
    aiFieldImpact: requiredOption(
      aiFieldImpactOptions,
      "AI field impact is required",
    ),
    aiFieldImpactOther: z.string(),
    aiSkillBuilding: requiredOption(
      aiSkillBuildingOptions,
      "AI skill building is required",
    ),
    aiSkillBuildingOther: z.string(),
    freeTimeActivity: requiredOption(
      freeTimeOptions,
      "Free time activity is required",
    ),
    freeTimeOther: z.string(),
    socialSetting: requiredOption(
      socialSettingOptions,
      "Social setting is required",
    ),
    socialSettingOther: z.string(),
    workEnvironment: requiredOption(
      workEnvironmentOptions,
      "Work environment is required",
    ),
    workEnvironmentOther: z.string(),
    stressHandling: requiredOption(
      stressHandlingOptions,
      "Stress handling is required",
    ),
    stressHandlingOther: z.string(),
    proudMoment: requiredOption(proudMomentOptions, "Proud moment is required"),
    proudMomentOther: z.string(),
    aiEverydayUse: requiredOption(
      aiEverydayUseOptions,
      "AI everyday use is required",
    ),
    aiEverydayUseOther: z.string(),
    aiCuriosity: requiredOption(aiCuriosityOptions, "AI curiosity is required"),
    aiCuriosityOther: z.string(),
    personalNote: z.string().max(600, "Maximum 600 characters allowed"),
  })
  .superRefine((values, ctx) => {
    for (const pair of otherFieldPairs) {
      if (
        values[pair.field] === OTHER_VALUE &&
        !values[pair.other]?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: pair.message,
          path: [pair.other],
        });
      }
    }
  });

export type CounsellingSchemaValues = z.infer<typeof counsellingSchema>;

export function toCounsellingPayload(values: CounsellingFormValues) {
  return {
    careerField: values.careerField,
    careerFieldOther:
      values.careerField === OTHER_VALUE
        ? values.careerFieldOther.trim()
        : null,
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
      values.studyStream === OTHER_VALUE
        ? values.studyStreamOther.trim()
        : null,
    planningChallenge: values.planningChallenge,
    planningChallengeOther:
      values.planningChallenge === OTHER_VALUE
        ? values.planningChallengeOther.trim()
        : null,
    aiUnderstanding: values.aiUnderstanding,
    aiUnderstandingOther:
      values.aiUnderstanding === OTHER_VALUE
        ? values.aiUnderstandingOther.trim()
        : null,
    aiFieldImpact: values.aiFieldImpact,
    aiFieldImpactOther:
      values.aiFieldImpact === OTHER_VALUE
        ? values.aiFieldImpactOther.trim()
        : null,
    aiSkillBuilding: values.aiSkillBuilding,
    aiSkillBuildingOther:
      values.aiSkillBuilding === OTHER_VALUE
        ? values.aiSkillBuildingOther.trim()
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
    aiEverydayUse: values.aiEverydayUse,
    aiEverydayUseOther:
      values.aiEverydayUse === OTHER_VALUE
        ? values.aiEverydayUseOther.trim()
        : null,
    aiCuriosity: values.aiCuriosity,
    aiCuriosityOther:
      values.aiCuriosity === OTHER_VALUE
        ? values.aiCuriosityOther.trim()
        : null,
    personalNote: values.personalNote.trim() || null,
  };
}

export const leadSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().email("Email must be valid"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  institutionName: z.string().trim().min(1, "Institution name is required"),
  currentEducation: z.string().trim().min(1, "Current education is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

export const emptyLeadFormValues: LeadFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  institutionName: "",
  currentEducation: "",
  city: "",
  state: "",
};

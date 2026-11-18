import {
  counsellingFormSections,
  OTHER_VALUE,
  type CounsellingFormValues,
} from "@/lib/counselling/formConfig";
import type { CounsellingProfile } from "@/lib/counselling/counsellingApi";

function formatAnswer(value: string, other?: string | null) {
  if (value === OTHER_VALUE && other?.trim()) {
    return other.trim();
  }
  return value;
}

export interface ResponseItem {
  label: string;
  value: string;
}

export interface ResponseSection {
  id: string;
  title: string;
  items: ResponseItem[];
}

export function buildCounsellingResponseSections(
  profile: CounsellingProfile,
): ResponseSection[] {
  const valueMap: Record<string, string> = {
    careerField: formatAnswer(profile.careerField, profile.careerFieldOther),
    futureGoal: formatAnswer(profile.futureGoal, profile.futureGoalOther),
    careerPriority: formatAnswer(
      profile.careerPriority,
      profile.careerPriorityOther,
    ),
    studyStream: formatAnswer(profile.studyStream, profile.studyStreamOther),
    planningChallenge: formatAnswer(
      profile.planningChallenge,
      profile.planningChallengeOther,
    ),
    aiUnderstanding: formatAnswer(
      profile.aiUnderstanding,
      profile.aiUnderstandingOther,
    ),
    aiFieldImpact: formatAnswer(
      profile.aiFieldImpact,
      profile.aiFieldImpactOther,
    ),
    aiSkillBuilding: formatAnswer(
      profile.aiSkillBuilding,
      profile.aiSkillBuildingOther,
    ),
    freeTimeActivity: formatAnswer(
      profile.freeTimeActivity,
      profile.freeTimeOther,
    ),
    socialSetting: formatAnswer(
      profile.socialSetting,
      profile.socialSettingOther,
    ),
    workEnvironment: formatAnswer(
      profile.workEnvironment,
      profile.workEnvironmentOther,
    ),
    stressHandling: formatAnswer(
      profile.stressHandling,
      profile.stressHandlingOther,
    ),
    proudMoment: formatAnswer(profile.proudMoment, profile.proudMomentOther),
    aiEverydayUse: formatAnswer(
      profile.aiEverydayUse,
      profile.aiEverydayUseOther,
    ),
    aiCuriosity: formatAnswer(profile.aiCuriosity, profile.aiCuriosityOther),
    personalNote: profile.personalNote?.trim() || "Not provided",
  };

  return counsellingFormSections.map((section) => ({
    id: section.id,
    title: section.title,
    items: section.fields.map((field) => ({
      label: field.label,
      value: valueMap[field.name] || "Not provided",
    })),
  }));
}

export function emptyCounsellingValuesFromProfile(
  profile: CounsellingProfile,
): CounsellingFormValues {
  return {
    careerField: profile.careerField,
    careerFieldOther: profile.careerFieldOther ?? "",
    futureGoal: profile.futureGoal,
    futureGoalOther: profile.futureGoalOther ?? "",
    careerPriority: profile.careerPriority,
    careerPriorityOther: profile.careerPriorityOther ?? "",
    studyStream: profile.studyStream,
    studyStreamOther: profile.studyStreamOther ?? "",
    planningChallenge: profile.planningChallenge,
    planningChallengeOther: profile.planningChallengeOther ?? "",
    aiUnderstanding: profile.aiUnderstanding,
    aiUnderstandingOther: profile.aiUnderstandingOther ?? "",
    aiFieldImpact: profile.aiFieldImpact,
    aiFieldImpactOther: profile.aiFieldImpactOther ?? "",
    aiSkillBuilding: profile.aiSkillBuilding,
    aiSkillBuildingOther: profile.aiSkillBuildingOther ?? "",
    freeTimeActivity: profile.freeTimeActivity,
    freeTimeOther: profile.freeTimeOther ?? "",
    socialSetting: profile.socialSetting,
    socialSettingOther: profile.socialSettingOther ?? "",
    workEnvironment: profile.workEnvironment,
    workEnvironmentOther: profile.workEnvironmentOther ?? "",
    stressHandling: profile.stressHandling,
    stressHandlingOther: profile.stressHandlingOther ?? "",
    proudMoment: profile.proudMoment,
    proudMomentOther: profile.proudMomentOther ?? "",
    aiEverydayUse: profile.aiEverydayUse,
    aiEverydayUseOther: profile.aiEverydayUseOther ?? "",
    aiCuriosity: profile.aiCuriosity,
    aiCuriosityOther: profile.aiCuriosityOther ?? "",
    personalNote: profile.personalNote ?? "",
  };
}

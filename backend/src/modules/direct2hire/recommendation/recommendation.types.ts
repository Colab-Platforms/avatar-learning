export interface AiRecommendationOutput {
  recommendedCourseSlug: string;
  recommendedCourseTitle: string;
  confidenceScore: number;
  summary: string;
  reasoning: string;
  studentStrengths: string[];
  growthAreas: string[];
}

export interface CourseRecommendationResponse {
  id: string;
  userId: string;
  counsellingProfileId: string;
  recommendedCourseId: string;
  recommendedCourseSlug: string;
  recommendedCourseTitle: string;
  confidenceScore: number | null;
  reasoning: string;
  studentStrengths: string[] | null;
  growthAreas: string[] | null;
  summary: string | null;
  provider: string;
  model: string;
  promptVersion: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounsellingProfileWithRecommendation {
  profile: Record<string, unknown> | null;
  recommendation: CourseRecommendationResponse | null;
  recommendationStatus: "ready" | "pending" | "none";
}

export interface QuestionnaireSnapshot {
  careerField: string;
  careerFieldOther?: string | null;
  futureGoal: string;
  futureGoalOther?: string | null;
  careerPriority: string;
  careerPriorityOther?: string | null;
  studyStream: string;
  studyStreamOther?: string | null;
  planningChallenge: string;
  planningChallengeOther?: string | null;
  aiUnderstanding: string;
  aiUnderstandingOther?: string | null;
  aiFieldImpact: string;
  aiFieldImpactOther?: string | null;
  aiSkillBuilding: string;
  aiSkillBuildingOther?: string | null;
  freeTimeActivity: string;
  freeTimeOther?: string | null;
  socialSetting: string;
  socialSettingOther?: string | null;
  workEnvironment: string;
  workEnvironmentOther?: string | null;
  stressHandling: string;
  stressHandlingOther?: string | null;
  proudMoment: string;
  proudMomentOther?: string | null;
  aiEverydayUse: string;
  aiEverydayUseOther?: string | null;
  aiCuriosity: string;
  aiCuriosityOther?: string | null;
  personalNote?: string | null;
}

import apiClient from "@/lib/apiClient";

export interface CounsellingProfile {
  id: string;
  userId: string;
  careerField: string;
  careerFieldOther: string | null;
  futureGoal: string;
  futureGoalOther: string | null;
  careerPriority: string;
  careerPriorityOther: string | null;
  studyStream: string;
  studyStreamOther: string | null;
  planningChallenge: string;
  planningChallengeOther: string | null;
  aiUnderstanding: string;
  aiUnderstandingOther: string | null;
  aiFieldImpact: string;
  aiFieldImpactOther: string | null;
  aiSkillBuilding: string;
  aiSkillBuildingOther: string | null;
  freeTimeActivity: string;
  freeTimeOther: string | null;
  socialSetting: string;
  socialSettingOther: string | null;
  workEnvironment: string;
  workEnvironmentOther: string | null;
  stressHandling: string;
  stressHandlingOther: string | null;
  proudMoment: string;
  proudMomentOther: string | null;
  aiEverydayUse: string;
  aiEverydayUseOther: string | null;
  aiCuriosity: string;
  aiCuriosityOther: string | null;
  personalNote: string | null;
  isSubmitted: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseRecommendation {
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

export type RecommendationStatus = "ready" | "pending" | "none";

export interface CounsellingBundle {
  profile: CounsellingProfile | null;
  recommendation: CourseRecommendation | null;
  recommendationStatus: RecommendationStatus;
}

export type SubmitCounsellingPayload = Omit<
  CounsellingProfile,
  | "id"
  | "userId"
  | "isSubmitted"
  | "submittedAt"
  | "createdAt"
  | "updatedAt"
>;

export type CounsellingSubmissionResponse = {
  profile: CounsellingProfile;
  recommendation: CourseRecommendation | null;
  recommendationStatus: "ready" | "pending";
};

export const fetchCounsellingProfile = (): Promise<CounsellingBundle> =>
  apiClient
    .get("/direct2hire/counselling")
    .then((response) => response.data.data);

export const submitCounsellingProfile = (
  payload: SubmitCounsellingPayload,
): Promise<CounsellingSubmissionResponse> =>
  apiClient
    .post("/direct2hire/counselling", payload)
    .then((response) => response.data.data);

export const updateCounsellingProfile = (
  payload: Partial<SubmitCounsellingPayload>,
): Promise<CounsellingProfile> =>
  apiClient
    .put("/direct2hire/counselling", payload)
    .then((response) => response.data.data);

export interface CounsellingBooking {
  id: string;
  userId: string;
  preferredMode: "VOICE" | "VIDEO";
  notes: string | null;
  status: string;
  counsellorName: string | null;
  meetingLink: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const fetchCounsellingBooking = (): Promise<CounsellingBooking | null> =>
  apiClient
    .get("/direct2hire/counselling/booking")
    .then((response) => response.data.data);

export const createCounsellingBooking = (payload: {
  preferredMode: string;
  notes?: string;
}): Promise<CounsellingBooking> =>
  apiClient
    .post("/direct2hire/counselling/booking", payload)
    .then((response) => response.data.data);


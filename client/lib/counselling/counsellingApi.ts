import apiClient from "@/lib/apiClient";

export interface CounsellingProfile {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  gradeYear: string;
  institutionName: string;
  contactNumber: string;
  email: string;
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
  personalNote: string | null;
  isSubmitted: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export const fetchCounsellingProfile = (): Promise<CounsellingProfile | null> =>
  apiClient
    .get("/direct2hire/counselling")
    .then((response) => response.data.data);

export const submitCounsellingProfile = (
  payload: SubmitCounsellingPayload,
): Promise<CounsellingProfile> =>
  apiClient
    .post("/direct2hire/counselling", payload)
    .then((response) => response.data.data);

export const updateCounsellingProfile = (
  payload: Partial<SubmitCounsellingPayload>,
): Promise<CounsellingProfile> =>
  apiClient
    .put("/direct2hire/counselling", payload)
    .then((response) => response.data.data);

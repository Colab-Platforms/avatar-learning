export interface CounsellingProfileResponse {
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

export interface CreateCounsellingProfileInput {
  fullName: string;
  age: number;
  gradeYear: string;
  institutionName: string;
  contactNumber: string;
  email: string;
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
  personalNote?: string | null;
}

export type UpdateCounsellingProfileInput = Partial<CreateCounsellingProfileInput>;

import apiClient from "./apiClient";

export type AssessmentType = "WEEKLY" | "FINAL";

export interface AdminAssessmentOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export interface AdminAssessmentQuestion {
  id: string;
  questionText: string;
  points: number;
  questionOrder: number;
  options: AdminAssessmentOption[];
}

export interface AdminAssessment {
  id: string;
  courseId: string;
  lessonId: string | null;
  type: AssessmentType;
  title: string;
  description?: string | null;
  questionCount: number;
  timeLimitMinutes: number;
  passingScorePercent?: number | null;
  maxTabSwitchWarnings: number;
  maxAttempts?: number | null;
  isPublished: boolean;
  lesson?: { id: string; title: string; weekNumber: number } | null;
  questions: AdminAssessmentQuestion[];
  _count: { attempts: number };
}

export interface AdminAssessmentAttempt {
  id: string;
  userId: string;
  assessmentId: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED_TIMEOUT" | "AUTO_SUBMITTED_VIOLATION";
  startedAt: string;
  submittedAt: string | null;
  tabSwitchCount: number;
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  isPassed: boolean | null;
  user: { id: string; firstName?: string; lastName?: string; email: string };
}

export interface OptionInput {
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export const WEEKLY_QUESTION_COUNT = 10;
export const FINAL_QUESTION_COUNT = 30;

// ─── Assessment ───────────────────────────────────────────────────────────────

export const fetchAdminAssessments = (courseId: string): Promise<AdminAssessment[]> =>
  apiClient.get(`/admin/courses/${courseId}/assessments`).then((r) => {
    const data = r.data.data;
    return Array.isArray(data) ? data : data ? [data] : [];
  });

/** @deprecated Use fetchAdminAssessments */
export const fetchAdminAssessment = fetchAdminAssessments;

export const createAssessment = (
  courseId: string,
  payload: {
    title: string;
    description?: string;
    type: AssessmentType;
    lessonId?: string | null;
    timeLimitMinutes: number;
    passingScorePercent?: number;
    maxTabSwitchWarnings?: number;
    maxAttempts?: number | null;
  },
): Promise<AdminAssessment> =>
  apiClient.post(`/admin/courses/${courseId}/assessments`, payload).then((r) => r.data.data);

export const updateAssessment = (
  assessmentId: string,
  payload: Record<string, unknown>,
): Promise<AdminAssessment> =>
  apiClient.put(`/admin/assessments/${assessmentId}`, payload).then((r) => r.data.data);

export const deleteAssessment = (assessmentId: string) =>
  apiClient.delete(`/admin/assessments/${assessmentId}`).then((r) => r.data);

export const toggleAssessmentPublish = (assessmentId: string): Promise<AdminAssessment> =>
  apiClient.patch(`/admin/assessments/${assessmentId}/publish`).then((r) => r.data.data);

// ─── Questions ────────────────────────────────────────────────────────────────

export const createQuestion = (
  assessmentId: string,
  payload: { questionText: string; points?: number; questionOrder: number; options: OptionInput[] },
): Promise<AdminAssessmentQuestion> =>
  apiClient.post(`/admin/assessments/${assessmentId}/questions`, payload).then((r) => r.data.data);

export const updateQuestion = (
  questionId: string,
  payload: {
    questionText?: string;
    points?: number;
    questionOrder?: number;
    options?: OptionInput[];
  },
): Promise<AdminAssessmentQuestion> =>
  apiClient.put(`/admin/questions/${questionId}`, payload).then((r) => r.data.data);

export const deleteQuestion = (questionId: string) =>
  apiClient.delete(`/admin/questions/${questionId}`).then((r) => r.data);

// ─── Attempts ─────────────────────────────────────────────────────────────────

export const fetchAssessmentAttempts = (assessmentId: string): Promise<AdminAssessmentAttempt[]> =>
  apiClient.get(`/admin/assessments/${assessmentId}/attempts`).then((r) => r.data.data);

export const resetAttempt = (attemptId: string) =>
  apiClient.delete(`/admin/attempts/${attemptId}`).then((r) => r.data);

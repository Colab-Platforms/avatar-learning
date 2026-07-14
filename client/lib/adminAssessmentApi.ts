import apiClient from "./apiClient";

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
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingScorePercent?: number | null;
  maxTabSwitchWarnings: number;
  isPublished: boolean;
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

// ─── Assessment ───────────────────────────────────────────────────────────────

export const fetchAdminAssessment = (courseId: string): Promise<AdminAssessment> =>
  apiClient.get(`/admin/courses/${courseId}/assessment`).then((r) => r.data.data);

export const createAssessment = (
  courseId: string,
  payload: {
    title: string;
    description?: string;
    timeLimitMinutes: number;
    passingScorePercent?: number;
    maxTabSwitchWarnings?: number;
  },
): Promise<AdminAssessment> =>
  apiClient.post(`/admin/courses/${courseId}/assessment`, payload).then((r) => r.data.data);

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

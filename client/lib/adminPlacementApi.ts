import apiClient from "./apiClient";

export interface AdminPlacementOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export interface AdminPlacementQuestion {
  id: string;
  questionText: string;
  points: number;
  questionOrder: number;
  options: AdminPlacementOption[];
}

export interface AdminPlacementAssessment {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingScorePercent: number;
  questionsPerAttempt: number;
  maxTabSwitchWarnings: number;
  isPublished: boolean;
  questions: AdminPlacementQuestion[];
  _count: { attempts: number };
}

export interface AdminPlacementAttempt {
  id: string;
  userId: string;
  placementAssessmentId: string;
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

export interface PlacementOptionInput {
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

// ─── Placement Assessment ───────────────────────────────────────────────────

export const fetchAdminPlacementAssessment = (courseId: string): Promise<AdminPlacementAssessment> =>
  apiClient.get(`/admin/courses/${courseId}/placement-assessment`).then((r) => r.data.data);

export const createPlacementAssessment = (
  courseId: string,
  payload: {
    title: string;
    description?: string;
    timeLimitMinutes: number;
    passingScorePercent?: number;
    questionsPerAttempt?: number;
    maxTabSwitchWarnings?: number;
  },
): Promise<AdminPlacementAssessment> =>
  apiClient.post(`/admin/courses/${courseId}/placement-assessment`, payload).then((r) => r.data.data);

export const updatePlacementAssessment = (
  assessmentId: string,
  payload: Record<string, unknown>,
): Promise<AdminPlacementAssessment> =>
  apiClient.put(`/admin/placement-assessments/${assessmentId}`, payload).then((r) => r.data.data);

export const deletePlacementAssessment = (assessmentId: string) =>
  apiClient.delete(`/admin/placement-assessments/${assessmentId}`).then((r) => r.data);

export const togglePlacementAssessmentPublish = (assessmentId: string): Promise<AdminPlacementAssessment> =>
  apiClient.patch(`/admin/placement-assessments/${assessmentId}/publish`).then((r) => r.data.data);

// ─── Questions ────────────────────────────────────────────────────────────────

export const createPlacementQuestion = (
  assessmentId: string,
  payload: { questionText: string; points?: number; questionOrder: number; options: PlacementOptionInput[] },
): Promise<AdminPlacementQuestion> =>
  apiClient.post(`/admin/placement-assessments/${assessmentId}/questions`, payload).then((r) => r.data.data);

export const updatePlacementQuestion = (
  questionId: string,
  payload: {
    questionText?: string;
    points?: number;
    questionOrder?: number;
    options?: PlacementOptionInput[];
  },
): Promise<AdminPlacementQuestion> =>
  apiClient.put(`/admin/placement-questions/${questionId}`, payload).then((r) => r.data.data);

export const deletePlacementQuestion = (questionId: string) =>
  apiClient.delete(`/admin/placement-questions/${questionId}`).then((r) => r.data);

// ─── Attempts ─────────────────────────────────────────────────────────────────

export const fetchPlacementAssessmentAttempts = (assessmentId: string): Promise<AdminPlacementAttempt[]> =>
  apiClient.get(`/admin/placement-assessments/${assessmentId}/attempts`).then((r) => r.data.data);

export const resetPlacementAttempt = (attemptId: string) =>
  apiClient.delete(`/admin/placement-attempts/${attemptId}`).then((r) => r.data);

// ─── Admin Student Placement ──────────────────────────────────────────────────

export type AdminPlacementStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "EXHAUSTED";

export interface AdminStudentPlacementSummary {
  course: { id: string; title: string } | null;
  assessment: { id: string; title: string } | null;
  summary: {
    defaultMaxAttempts: number;
    extraAttemptsGranted: number;
    effectiveMaxAttempts: number;
    attemptsUsed: number;
    remainingAttempts: number;
    hasPassed: boolean;
    canStartNewAttempt: boolean;
    assessmentCompleted: boolean;
    assessmentCompletionDate: string | null;
    highestScore: number | null;
    latestScore: number | null;
    currentStatus: AdminPlacementStatus;
  } | null;
}

export interface AdminPlacementAttemptHistoryItem {
  id: string;
  attemptNumber: number;
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED_TIMEOUT" | "AUTO_SUBMITTED_VIOLATION";
  questionIds: string[];
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number | null;
  isPassed: boolean | null;
}

export interface AdminPlacementOverride {
  id: string;
  userId: string;
  placementAssessmentId: string;
  attemptsGranted: number;
  reason: string;
  createdAt: string;
  grantedBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export const fetchAdminStudentPlacementSummary = (userId: string): Promise<AdminStudentPlacementSummary> =>
  apiClient.get(`/admin/direct2hire/students/${userId}/placement/summary`).then((r) => r.data.data);

export const fetchAdminStudentPlacementAttempts = (
  userId: string,
): Promise<AdminPlacementAttemptHistoryItem[]> =>
  apiClient.get(`/admin/direct2hire/students/${userId}/placement/attempts`).then((r) => r.data.data);

export const fetchAdminStudentPlacementOverrides = (userId: string): Promise<AdminPlacementOverride[]> =>
  apiClient.get(`/admin/direct2hire/students/${userId}/placement/overrides`).then((r) => r.data.data);

export const grantAdminStudentPlacementAttempts = (
  userId: string,
  payload: { attemptsGranted: number; reason: string },
): Promise<AdminPlacementOverride> =>
  apiClient
    .post(`/admin/direct2hire/students/${userId}/placement/grant-attempts`, payload)
    .then((r) => r.data.data);

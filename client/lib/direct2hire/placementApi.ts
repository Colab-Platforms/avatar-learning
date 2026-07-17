import apiClient from "@/lib/apiClient";

export type PlacementAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED_TIMEOUT" | "AUTO_SUBMITTED_VIOLATION";

export type PlacementAssessmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "EXHAUSTED";

export interface PlacementAttemptSummary {
  id: string;
  userId: string;
  placementAssessmentId: string;
  status: PlacementAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number | null;
  timeLimitMinutes: number;
  tabSwitchCount: number;
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  isPassed: boolean | null;
}

export interface PlacementAttemptHistoryItem {
  id: string;
  attemptNumber: number;
  status: PlacementAttemptStatus;
  questionIds: string[];
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number | null;
  isPassed: boolean | null;
}

export interface PlacementSummary {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingScorePercent: number;
  questionsPerAttempt: number;
  maxTabSwitchWarnings: number;
  totalQuestionCount: number;
  attempt: PlacementAttemptSummary | null;
  latestAttempt: PlacementAttemptSummary | null;
  mockInterviewUnlocked: boolean;
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
  currentStatus: PlacementAssessmentStatus;
}

export interface PlacementAttemptQuestionOption {
  id: string;
  optionText: string;
  optionOrder: number;
}

export interface PlacementAttemptQuestion {
  id: string;
  questionText: string;
  points: number;
  questionOrder: number;
  options: PlacementAttemptQuestionOption[];
}

export interface PlacementAttemptState {
  attempt: {
    id: string;
    status: PlacementAttemptStatus;
    tabSwitchCount: number;
    startedAt: string;
    deadline: string;
    score: number | null;
    maxScore: number | null;
    scorePercent: number | null;
    isPassed: boolean | null;
  };
  assessment: {
    id: string;
    title: string;
    maxTabSwitchWarnings: number;
    questions: PlacementAttemptQuestion[];
  };
  answers: Record<string, string | null>;
}

export interface PlacementViolationResult {
  tabSwitchCount: number;
  maxTabSwitchWarnings: number;
  status: PlacementAttemptStatus;
  autoSubmitted: boolean;
}

export interface PlacementResultOption extends PlacementAttemptQuestionOption {
  isCorrect: boolean;
}

export interface PlacementResultQuestion {
  id: string;
  questionText: string;
  points: number;
  questionOrder: number;
  options: PlacementResultOption[];
}

export interface PlacementResultAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
}

export interface PlacementAttemptResult {
  attempt: PlacementAttemptSummary;
  assessment: {
    id: string;
    title: string;
    passingScorePercent: number;
    questions: PlacementResultQuestion[];
  };
  answers: Record<string, PlacementResultAnswer>;
  mockInterviewUnlocked: boolean;
}

export const fetchPlacementAssessment = (courseId: string): Promise<PlacementSummary> =>
  apiClient.get(`/courses/${courseId}/placement-assessment`).then((r) => r.data.data);

export const fetchPlacementAttemptHistory = (courseId: string): Promise<PlacementAttemptHistoryItem[]> =>
  apiClient.get(`/courses/${courseId}/placement-assessment/attempts`).then((r) => r.data.data);

export const startPlacementAttempt = (courseId: string): Promise<PlacementAttemptSummary> =>
  apiClient.post(`/courses/${courseId}/placement-assessment/attempts`).then((r) => r.data.data);

export const fetchPlacementAttemptState = (attemptId: string): Promise<PlacementAttemptState> =>
  apiClient.get(`/courses/placement-assessments/attempts/${attemptId}`).then((r) => r.data.data);

export const savePlacementAnswer = (
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
): Promise<PlacementResultAnswer> =>
  apiClient
    .put(`/courses/placement-assessments/attempts/${attemptId}/answers/${questionId}`, { selectedOptionId })
    .then((r) => r.data.data);

export const reportPlacementTabSwitchViolation = (attemptId: string): Promise<PlacementViolationResult> =>
  apiClient.post(`/courses/placement-assessments/attempts/${attemptId}/violations`).then((r) => r.data.data);

export const submitPlacementAttempt = (attemptId: string): Promise<PlacementAttemptSummary> =>
  apiClient.post(`/courses/placement-assessments/attempts/${attemptId}/submit`).then((r) => r.data.data);

export const fetchPlacementAttemptResult = (attemptId: string): Promise<PlacementAttemptResult> =>
  apiClient.get(`/courses/placement-assessments/attempts/${attemptId}/result`).then((r) => r.data.data);

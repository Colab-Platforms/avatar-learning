import apiClient from "./apiClient";

export type AttemptStatus =
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AUTO_SUBMITTED_TIMEOUT"
  | "AUTO_SUBMITTED_VIOLATION";
export type AssessmentType = "WEEKLY" | "FINAL";
export type AssessmentUnlockStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";
export type AssessmentPerformanceStatus =
  | "NOT_ATTEMPTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "EXHAUSTED";

export interface AssessmentAttemptSummary {
  id: string;
  userId?: string;
  assessmentId?: string;
  status: AttemptStatus;
  attemptNumber?: number;
  startedAt?: string;
  submittedAt: string | null;
  timeLimitMinutes?: number;
  tabSwitchCount?: number;
  durationSeconds?: number | null;
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  isPassed: boolean | null;
}

export interface AssessmentSummary {
  id: string;
  courseId?: string;
  lessonId?: string | null;
  type: AssessmentType;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingScorePercent: number | null;
  maxTabSwitchWarnings: number;
  maxAttempts?: number | null;
  questionCount: number;
  expectedQuestionCount?: number;
  weekNumber?: number | null;
  lessonTitle?: string | null;
  unlockStatus: AssessmentUnlockStatus;
  lockReason: string | null;
  status: AssessmentPerformanceStatus;
  bestScore: number | null;
  bestScorePercent: number | null;
  latestScore: number | null;
  latestScorePercent: number | null;
  totalAttempts: number;
  attemptsUsed: number;
  remainingAttempts: number | null;
  lastAttemptAt: string | null;
  canStartNew: boolean;
  canRetake: boolean;
  attempt: AssessmentAttemptSummary | null;
  inProgressAttempt?: AssessmentAttemptSummary | null;
  latestAttempt?: AssessmentAttemptSummary | null;
  bestAttempt?: AssessmentAttemptSummary | null;
}

export interface LessonAssessmentCard {
  id: string;
  type: AssessmentType;
  title: string;
  description?: string | null;
  questionCount: number;
  expectedQuestionCount?: number;
  timeLimitMinutes: number;
  passingScorePercent: number | null;
  maxTabSwitchWarnings: number;
  unlockStatus: AssessmentUnlockStatus;
  lockReason: string | null;
  totalAttempts?: number;
  bestScorePercent?: number | null;
  attempt: AssessmentAttemptSummary | null;
}

export interface AttemptQuestionOption {
  id: string;
  optionText: string;
  optionOrder: number;
}

export interface AttemptQuestion {
  id: string;
  questionText: string;
  points: number;
  questionOrder: number;
  options: AttemptQuestionOption[];
}

export interface AttemptState {
  attempt: {
    id: string;
    status: AttemptStatus;
    attemptNumber?: number;
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
    type?: AssessmentType;
    maxTabSwitchWarnings: number;
    questions: AttemptQuestion[];
  };
  answers: Record<string, string | null>;
}

export interface ViolationResult {
  tabSwitchCount: number;
  maxTabSwitchWarnings: number;
  status: AttemptStatus;
  autoSubmitted: boolean;
}

export interface ResultOption extends AttemptQuestionOption {
  isCorrect: boolean;
}

export interface ResultQuestion {
  id: string;
  questionText: string;
  points: number;
  questionOrder: number;
  options: ResultOption[];
}

export interface ResultAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
}

export interface AttemptResult {
  attempt: AssessmentAttemptSummary & {
    attemptNumber: number;
    durationSeconds: number | null;
  };
  assessment: {
    id: string;
    courseId?: string;
    title: string;
    type: AssessmentType;
    weekNumber?: number | null;
    passingScorePercent: number | null;
    maxAttempts?: number | null;
    questions: ResultQuestion[];
  };
  answers: Record<string, ResultAnswer>;
  breakdown: {
    correct: number;
    wrong: number;
    skipped: number;
    total: number;
  };
  summary: {
    status: AssessmentPerformanceStatus;
    bestScore: number | null;
    bestScorePercent: number | null;
    latestScore: number | null;
    latestScorePercent: number | null;
    totalAttempts: number;
    attemptsUsed: number;
    remainingAttempts: number | null;
    canRetake: boolean;
  };
}

export interface AttemptHistoryItem {
  id: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  durationSeconds: number | null;
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  isPassed: boolean | null;
}

export interface AttemptHistoryResponse {
  assessment: {
    id: string;
    title: string;
    type: AssessmentType;
    weekNumber: number | null;
    passingScorePercent: number | null;
    maxAttempts: number | null;
  };
  summary: {
    status: AssessmentPerformanceStatus;
    bestScore: number | null;
    bestScorePercent: number | null;
    latestScore: number | null;
    latestScorePercent: number | null;
    totalAttempts: number;
    attemptsUsed: number;
    remainingAttempts: number | null;
    lastAttemptAt: string | null;
  };
  attempts: AttemptHistoryItem[];
}

export const fetchAssessments = (courseId: string): Promise<AssessmentSummary[]> =>
  apiClient.get(`/courses/${courseId}/assessments`).then((r) => {
    const data = r.data.data;
    return Array.isArray(data) ? data : data ? [data] : [];
  });

export const fetchAssessment = (courseId: string): Promise<AssessmentSummary[]> =>
  fetchAssessments(courseId);

export const fetchAssessmentById = (courseId: string, assessmentId: string): Promise<AssessmentSummary> =>
  apiClient.get(`/courses/${courseId}/assessments/${assessmentId}`).then((r) => r.data.data);

export const fetchAttemptHistory = (
  courseId: string,
  assessmentId: string,
): Promise<AttemptHistoryResponse> =>
  apiClient
    .get(`/courses/${courseId}/assessments/${assessmentId}/attempts`)
    .then((r) => r.data.data);

export const startAssessmentAttempt = (
  courseId: string,
  assessmentId: string,
): Promise<AssessmentAttemptSummary> =>
  apiClient
    .post(`/courses/${courseId}/assessments/${assessmentId}/attempts`)
    .then((r) => r.data.data);

export const fetchAttemptState = (attemptId: string): Promise<AttemptState> =>
  apiClient.get(`/courses/assessments/attempts/${attemptId}`).then((r) => r.data.data);

export const saveAssessmentAnswer = (
  attemptId: string,
  questionId: string,
  selectedOptionId: string | null,
): Promise<ResultAnswer> =>
  apiClient
    .put(`/courses/assessments/attempts/${attemptId}/answers/${questionId}`, { selectedOptionId })
    .then((r) => r.data.data);

export const reportTabSwitchViolation = (attemptId: string): Promise<ViolationResult> =>
  apiClient.post(`/courses/assessments/attempts/${attemptId}/violations`).then((r) => r.data.data);

export const submitAssessmentAttempt = (attemptId: string): Promise<AssessmentAttemptSummary> =>
  apiClient.post(`/courses/assessments/attempts/${attemptId}/submit`).then((r) => r.data.data);

export const fetchAttemptResult = (attemptId: string): Promise<AttemptResult> =>
  apiClient.get(`/courses/assessments/attempts/${attemptId}/result`).then((r) => r.data.data);

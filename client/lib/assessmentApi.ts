import apiClient from "./apiClient";

export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED_TIMEOUT" | "AUTO_SUBMITTED_VIOLATION";

export interface AssessmentAttemptSummary {
  id: string;
  userId: string;
  assessmentId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  timeLimitMinutes: number;
  tabSwitchCount: number;
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  isPassed: boolean | null;
}

export interface AssessmentSummary {
  id: string;
  title: string;
  description?: string | null;
  timeLimitMinutes: number;
  passingScorePercent: number | null;
  maxTabSwitchWarnings: number;
  questionCount: number;
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
  attempt: AssessmentAttemptSummary;
  assessment: {
    id: string;
    title: string;
    passingScorePercent: number | null;
    questions: ResultQuestion[];
  };
  answers: Record<string, ResultAnswer>;
}

export const fetchAssessment = (courseId: string): Promise<AssessmentSummary> =>
  apiClient.get(`/courses/${courseId}/assessment`).then((r) => r.data.data);

export const startAssessmentAttempt = (courseId: string): Promise<AssessmentAttemptSummary> =>
  apiClient.post(`/courses/${courseId}/assessment/attempts`).then((r) => r.data.data);

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

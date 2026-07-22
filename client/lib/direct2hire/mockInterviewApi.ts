import apiClient from "@/lib/apiClient";

export type MockInterviewStatus =
  | "REQUESTED"
  | "SCHEDULED"
  | "COMPLETED"
  | "FEEDBACK_PUBLISHED"
  | "CANCELLED";

export type MockInterviewPerformanceGrade = "GRADE_A" | "GRADE_B" | "GRADE_C";

export interface MockInterview {
  id: string;
  userId: string;
  status: MockInterviewStatus;
  interviewerName: string | null;
  meetingLink: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  adminNotes: string | null;
  performanceGrade: MockInterviewPerformanceGrade | null;
  feedback: string | null;
  feedbackPublishedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockInterviewAssessmentContext {
  assessmentCompleted: boolean;
  assessmentCompletionDate: string | null;
  assessmentScore: number | null;
  canRequest: boolean;
}

export interface MockInterviewTimeline {
  assessmentCompletedAt: string | null;
  requestedAt: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  feedbackPublishedAt: string | null;
}

export interface MockInterviewBundle {
  interview: MockInterview | null;
  assessment: MockInterviewAssessmentContext;
  timeline: MockInterviewTimeline;
}

export type ScheduleMockInterviewPayload = {
  interviewerName: string;
  meetingLink: string;
  scheduledAt: string;
  durationMinutes: number;
  adminNotes?: string | null;
};

export type PublishMockInterviewFeedbackPayload = {
  performanceGrade: MockInterviewPerformanceGrade;
  feedback: string;
};

export const PERFORMANCE_GRADE_OPTIONS: {
  value: MockInterviewPerformanceGrade;
  label: string;
  shortLabel: string;
}[] = [
  { value: "GRADE_A", label: "Grade A", shortLabel: "A" },
  { value: "GRADE_B", label: "Grade B", shortLabel: "B" },
  { value: "GRADE_C", label: "Grade C", shortLabel: "C" },
];

export const PERFORMANCE_GRADE_LABELS: Record<
  MockInterviewPerformanceGrade,
  string
> = {
  GRADE_A: "Grade A",
  GRADE_B: "Grade B",
  GRADE_C: "Grade C",
};

export const GOOD_PERFORMANCE_GRADES: MockInterviewPerformanceGrade[] = [
  "GRADE_A",
  "GRADE_B",
];

export function getPerformanceGradeShortLabel(
  grade?: MockInterviewPerformanceGrade | null,
) {
  if (!grade) return null;
  return PERFORMANCE_GRADE_OPTIONS.find((o) => o.value === grade)?.shortLabel ?? null;
}

export function isGoodMockInterviewFeedback(
  grade?: MockInterviewPerformanceGrade | null,
) {
  return !!grade && GOOD_PERFORMANCE_GRADES.includes(grade);
}

export function countFeedbackWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export const MOCK_INTERVIEW_STATUS_LABELS: Record<MockInterviewStatus, string> =
  {
    REQUESTED: "Requested",
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    FEEDBACK_PUBLISHED: "Feedback Published",
    CANCELLED: "Cancelled",
  };

export const fetchMyMockInterview = (): Promise<MockInterviewBundle> =>
  apiClient.get("/direct2hire/mock-interview").then((r) => r.data.data);

export const requestMockInterview = (): Promise<MockInterview> =>
  apiClient
    .post("/direct2hire/mock-interview/request")
    .then((r) => r.data.data);

export const fetchAdminMockInterview = (
  userId: string,
): Promise<MockInterviewBundle> =>
  apiClient
    .get(`/admin/direct2hire/students/${userId}/mock-interview`)
    .then((r) => r.data.data);

export const scheduleMockInterview = (
  userId: string,
  payload: ScheduleMockInterviewPayload,
): Promise<MockInterview> =>
  apiClient
    .patch(
      `/admin/direct2hire/students/${userId}/mock-interview/schedule`,
      payload,
    )
    .then((r) => r.data.data);

export const markMockInterviewCompleted = (
  userId: string,
): Promise<MockInterview> =>
  apiClient
    .patch(`/admin/direct2hire/students/${userId}/mock-interview/complete`)
    .then((r) => r.data.data);

export const publishMockInterviewFeedback = (
  userId: string,
  payload: PublishMockInterviewFeedbackPayload,
): Promise<MockInterview> =>
  apiClient
    .patch(
      `/admin/direct2hire/students/${userId}/mock-interview/feedback`,
      payload,
    )
    .then((r) => r.data.data);

export const cancelMockInterview = (userId: string): Promise<MockInterview> =>
  apiClient
    .patch(`/admin/direct2hire/students/${userId}/mock-interview/cancel`)
    .then((r) => r.data.data);

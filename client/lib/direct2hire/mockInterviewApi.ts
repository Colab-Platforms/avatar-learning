import apiClient from "@/lib/apiClient";

export type MockInterviewStatus =
  | "REQUESTED"
  | "SCHEDULED"
  | "COMPLETED"
  | "FEEDBACK_PUBLISHED"
  | "CANCELLED";

export type MockInterviewRecommendation =
  | "READY_FOR_PLACEMENT"
  | "NEEDS_IMPROVEMENT"
  | "EXCELLENT_CANDIDATE"
  | "NEEDS_ANOTHER_MOCK";

export interface MockInterview {
  id: string;
  userId: string;
  status: MockInterviewStatus;
  interviewerName: string | null;
  meetingLink: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  adminNotes: string | null;
  communicationRating: number | null;
  technicalRating: number | null;
  confidenceRating: number | null;
  resumeRating: number | null;
  overallRating: number | null;
  recommendation: MockInterviewRecommendation | null;
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
  communicationRating: number;
  technicalRating: number;
  confidenceRating: number;
  resumeRating: number;
  overallRating: number;
  recommendation: MockInterviewRecommendation;
  feedback: string;
};

export const RECOMMENDATION_LABELS: Record<MockInterviewRecommendation, string> =
  {
    READY_FOR_PLACEMENT: "Ready for Placement",
    NEEDS_IMPROVEMENT: "Needs Improvement",
    EXCELLENT_CANDIDATE: "Excellent Candidate",
    NEEDS_ANOTHER_MOCK: "Needs Another Mock",
  };

export const GOOD_FEEDBACK_RECOMMENDATIONS: MockInterviewRecommendation[] = [
  "READY_FOR_PLACEMENT",
  "EXCELLENT_CANDIDATE",
];

export function isGoodMockInterviewFeedback(
  recommendation?: MockInterviewRecommendation | null,
) {
  return (
    !!recommendation && GOOD_FEEDBACK_RECOMMENDATIONS.includes(recommendation)
  );
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

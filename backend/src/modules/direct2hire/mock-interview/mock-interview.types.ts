import type {
  MockInterviewRecommendation,
  MockInterviewStatus,
} from "@prisma/client";

export type ScheduleMockInterviewInput = {
  interviewerName: string;
  meetingLink: string;
  scheduledAt: string;
  durationMinutes: number;
  adminNotes?: string | null;
};

export type PublishMockInterviewFeedbackInput = {
  communicationRating: number;
  technicalRating: number;
  confidenceRating: number;
  resumeRating: number;
  overallRating: number;
  recommendation: MockInterviewRecommendation;
  feedback: string;
};

export type MockInterviewAssessmentContext = {
  assessmentCompleted: boolean;
  assessmentCompletionDate: string | null;
  assessmentScore: number | null;
  canRequest: boolean;
};

export type MockInterviewTimeline = {
  assessmentCompletedAt: string | null;
  requestedAt: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  feedbackPublishedAt: string | null;
};

export type MockInterviewResponse = {
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
};

export type MockInterviewBundle = {
  interview: MockInterviewResponse | null;
  assessment: MockInterviewAssessmentContext;
  timeline: MockInterviewTimeline;
};

export const RECOMMENDATION_VALUES = [
  "READY_FOR_PLACEMENT",
  "NEEDS_IMPROVEMENT",
  "EXCELLENT_CANDIDATE",
  "NEEDS_ANOTHER_MOCK",
] as const;

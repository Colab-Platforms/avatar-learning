import type {
  MockInterviewPerformanceGrade,
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
  performanceGrade: MockInterviewPerformanceGrade;
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
  performanceGrade: MockInterviewPerformanceGrade | null;
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

export const PERFORMANCE_GRADE_VALUES = [
  "GRADE_A",
  "GRADE_B",
  "GRADE_C",
] as const;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

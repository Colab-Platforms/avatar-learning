import prisma from "@root/prisma.js";
import type { MockInterview, PlacementAttemptStatus } from "@prisma/client";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { getPlacementAttemptAllowance } from "../../course/placement/placement.attempt-policy.js";
import type {
  MockInterviewAssessmentContext,
  MockInterviewBundle,
  MockInterviewResponse,
  MockInterviewTimeline,
  PublishMockInterviewFeedbackInput,
  ScheduleMockInterviewInput,
} from "./mock-interview.types.js";

const FINALIZED: PlacementAttemptStatus[] = [
  "SUBMITTED",
  "AUTO_SUBMITTED_TIMEOUT",
  "AUTO_SUBMITTED_VIOLATION",
];

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function serialize(interview: MockInterview): MockInterviewResponse {
  return {
    id: interview.id,
    userId: interview.userId,
    status: interview.status,
    interviewerName: interview.interviewerName,
    meetingLink: interview.meetingLink,
    scheduledAt: toIso(interview.scheduledAt),
    durationMinutes: interview.durationMinutes,
    adminNotes: interview.adminNotes,
    communicationRating: interview.communicationRating,
    technicalRating: interview.technicalRating,
    confidenceRating: interview.confidenceRating,
    resumeRating: interview.resumeRating,
    overallRating: interview.overallRating,
    recommendation: interview.recommendation,
    feedback: interview.feedback,
    feedbackPublishedAt: toIso(interview.feedbackPublishedAt),
    completedAt: toIso(interview.completedAt),
    cancelledAt: toIso(interview.cancelledAt),
    createdAt: interview.createdAt.toISOString(),
    updatedAt: interview.updatedAt.toISOString(),
  };
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  return value.trim();
}

export class MockInterviewService {
  async getByUserId(userId: string) {
    return prisma.mockInterview.findUnique({ where: { userId } });
  }

  async getAssessmentContext(
    userId: string,
  ): Promise<MockInterviewAssessmentContext> {
    const booking = await prisma.counsellingBooking.findUnique({
      where: { userId },
      select: { selectedCourseId: true },
    });

    if (!booking?.selectedCourseId) {
      return {
        assessmentCompleted: false,
        assessmentCompletionDate: null,
        assessmentScore: null,
        canRequest: false,
      };
    }

    const assessment = await prisma.placementAssessment.findUnique({
      where: { courseId: booking.selectedCourseId },
      select: { id: true },
    });

    if (!assessment) {
      return {
        assessmentCompleted: false,
        assessmentCompletionDate: null,
        assessmentScore: null,
        canRequest: false,
      };
    }

    const allowance = await getPlacementAttemptAllowance(userId, assessment.id);
    const passedAttempt = await prisma.placementAttempt.findFirst({
      where: {
        userId,
        placementAssessmentId: assessment.id,
        status: { in: FINALIZED },
        isPassed: true,
      },
      orderBy: { scorePercent: "desc" },
      select: { scorePercent: true, submittedAt: true },
    });

    return {
      assessmentCompleted: allowance.assessmentCompleted,
      assessmentCompletionDate: toIso(allowance.assessmentCompletionDate),
      assessmentScore: passedAttempt?.scorePercent ?? null,
      canRequest: allowance.hasPassed,
    };
  }

  private buildTimeline(
    interview: MockInterview | null,
    assessment: MockInterviewAssessmentContext,
  ): MockInterviewTimeline {
    const isActive = !!interview && interview.status !== "CANCELLED";
    const hasReached = (...statuses: MockInterview["status"][]) =>
      !!interview && statuses.includes(interview.status);

    return {
      assessmentCompletedAt: assessment.assessmentCompletionDate,
      requestedAt: isActive ? interview!.createdAt.toISOString() : null,
      scheduledAt: hasReached(
        "SCHEDULED",
        "COMPLETED",
        "FEEDBACK_PUBLISHED",
      )
        ? toIso(interview!.scheduledAt)
        : null,
      completedAt: hasReached("COMPLETED", "FEEDBACK_PUBLISHED")
        ? toIso(interview!.completedAt)
        : null,
      feedbackPublishedAt: hasReached("FEEDBACK_PUBLISHED")
        ? toIso(interview!.feedbackPublishedAt)
        : null,
    };
  }

  async getBundle(userId: string): Promise<MockInterviewBundle> {
    const [interview, assessment] = await Promise.all([
      this.getByUserId(userId),
      this.getAssessmentContext(userId),
    ]);

    const activeInterview =
      interview && interview.status !== "CANCELLED" ? interview : null;

    // If cancelled, expose null so student can request again; keep cancelled
    // record for admin history via getAdminBundle.
    const timelineInterview = activeInterview ?? interview;

    return {
      interview: activeInterview ? serialize(activeInterview) : null,
      assessment: {
        ...assessment,
        canRequest:
          assessment.canRequest &&
          (!interview || interview.status === "CANCELLED"),
      },
      timeline: this.buildTimeline(timelineInterview, assessment),
    };
  }

  async getAdminBundle(userId: string): Promise<MockInterviewBundle> {
    const [interview, assessment] = await Promise.all([
      this.getByUserId(userId),
      this.getAssessmentContext(userId),
    ]);

    return {
      interview: interview ? serialize(interview) : null,
      assessment: {
        ...assessment,
        canRequest:
          assessment.canRequest &&
          (!interview || interview.status === "CANCELLED"),
      },
      timeline: this.buildTimeline(interview, assessment),
    };
  }

  async request(userId: string) {
    const assessment = await this.getAssessmentContext(userId);
    if (!assessment.assessmentCompleted) {
      throw new ApiError(
        "Complete the Pre-Placement Assessment before requesting a mock interview",
        STATUS_CODES.FORBIDDEN,
      );
    }

    const existing = await this.getByUserId(userId);
    if (existing && existing.status !== "CANCELLED") {
      throw new ApiError(
        "A mock interview has already been requested",
        STATUS_CODES.CONFLICT,
      );
    }

    if (existing?.status === "CANCELLED") {
      await prisma.mockInterview.delete({ where: { userId } });
    }

    const interview = await prisma.mockInterview.create({
      data: {
        userId,
        status: "REQUESTED",
      },
    });

    return serialize(interview);
  }

  async schedule(userId: string, data: ScheduleMockInterviewInput) {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new ApiError(
        "Student has not requested a mock interview yet",
        STATUS_CODES.NOT_FOUND,
      );
    }
    if (
      existing.status !== "REQUESTED" &&
      existing.status !== "SCHEDULED" &&
      existing.status !== "CANCELLED"
    ) {
      throw new ApiError(
        "Interview can only be scheduled when status is REQUESTED or SCHEDULED",
        STATUS_CODES.CONFLICT,
      );
    }
    if (existing.status === "CANCELLED") {
      throw new ApiError(
        "Cancelled interviews cannot be scheduled. Ask the student to request again.",
        STATUS_CODES.CONFLICT,
      );
    }

    const interview = await prisma.mockInterview.update({
      where: { userId },
      data: {
        status: "SCHEDULED",
        interviewerName: data.interviewerName.trim(),
        meetingLink: data.meetingLink.trim(),
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes,
        adminNotes: emptyToNull(data.adminNotes),
        cancelledAt: null,
      },
    });

    return serialize(interview);
  }

  async markCompleted(userId: string) {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new ApiError("Mock interview not found", STATUS_CODES.NOT_FOUND);
    }
    if (existing.status !== "SCHEDULED") {
      throw new ApiError(
        "Interview must be scheduled before it can be marked completed",
        STATUS_CODES.CONFLICT,
      );
    }

    const interview = await prisma.mockInterview.update({
      where: { userId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return serialize(interview);
  }

  async publishFeedback(
    userId: string,
    data: PublishMockInterviewFeedbackInput,
  ) {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new ApiError("Mock interview not found", STATUS_CODES.NOT_FOUND);
    }
    if (
      existing.status !== "COMPLETED" &&
      existing.status !== "FEEDBACK_PUBLISHED"
    ) {
      throw new ApiError(
        "Interview must be completed before publishing feedback",
        STATUS_CODES.CONFLICT,
      );
    }

    const interview = await prisma.mockInterview.update({
      where: { userId },
      data: {
        status: "FEEDBACK_PUBLISHED",
        communicationRating: data.communicationRating,
        technicalRating: data.technicalRating,
        confidenceRating: data.confidenceRating,
        resumeRating: data.resumeRating,
        overallRating: data.overallRating,
        recommendation: data.recommendation,
        feedback: data.feedback.trim(),
        feedbackPublishedAt: new Date(),
        completedAt: existing.completedAt ?? new Date(),
      },
    });

    return serialize(interview);
  }

  async cancel(userId: string) {
    const existing = await this.getByUserId(userId);
    if (!existing) {
      throw new ApiError("Mock interview not found", STATUS_CODES.NOT_FOUND);
    }
    if (existing.status === "FEEDBACK_PUBLISHED") {
      throw new ApiError(
        "Cannot cancel an interview after feedback has been published",
        STATUS_CODES.CONFLICT,
      );
    }
    if (existing.status === "CANCELLED") {
      return serialize(existing);
    }

    const interview = await prisma.mockInterview.update({
      where: { userId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return serialize(interview);
  }
}

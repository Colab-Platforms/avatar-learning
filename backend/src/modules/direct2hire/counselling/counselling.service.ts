import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import type {
  CreateCounsellingProfileInput,
  UpdateCounsellingProfileInput,
} from "./counselling.types.js";
import { RecommendationService } from "../recommendation/recommendation.service.js";
import type { CourseRecommendationResponse } from "../recommendation/recommendation.types.js";
import type { CounsellingProfile, CounsellingBooking } from "@prisma/client";
import { sendCounsellingScheduleEmail } from "./counselling.mail.js";
import type {
  SaveCounsellingFeedbackInput,
  CounsellingFeedbackResponse,
} from "./counselling-feedback.types.js";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value.trim() === "") return null;
  return value.trim();
}

function toProfileData(data: CreateCounsellingProfileInput) {
  return {
    careerField: data.careerField,
    careerFieldOther: emptyToNull(data.careerFieldOther),
    futureGoal: data.futureGoal,
    futureGoalOther: emptyToNull(data.futureGoalOther),
    careerPriority: data.careerPriority,
    careerPriorityOther: emptyToNull(data.careerPriorityOther),
    studyStream: data.studyStream,
    studyStreamOther: emptyToNull(data.studyStreamOther),
    planningChallenge: data.planningChallenge,
    planningChallengeOther: emptyToNull(data.planningChallengeOther),
    aiUnderstanding: data.aiUnderstanding,
    aiUnderstandingOther: emptyToNull(data.aiUnderstandingOther),
    aiFieldImpact: data.aiFieldImpact,
    aiFieldImpactOther: emptyToNull(data.aiFieldImpactOther),
    aiSkillBuilding: data.aiSkillBuilding,
    aiSkillBuildingOther: emptyToNull(data.aiSkillBuildingOther),
    freeTimeActivity: data.freeTimeActivity,
    freeTimeOther: emptyToNull(data.freeTimeOther),
    socialSetting: data.socialSetting,
    socialSettingOther: emptyToNull(data.socialSettingOther),
    workEnvironment: data.workEnvironment,
    workEnvironmentOther: emptyToNull(data.workEnvironmentOther),
    stressHandling: data.stressHandling,
    stressHandlingOther: emptyToNull(data.stressHandlingOther),
    proudMoment: data.proudMoment,
    proudMomentOther: emptyToNull(data.proudMomentOther),
    aiEverydayUse: data.aiEverydayUse,
    aiEverydayUseOther: emptyToNull(data.aiEverydayUseOther),
    aiCuriosity: data.aiCuriosity,
    aiCuriosityOther: emptyToNull(data.aiCuriosityOther),
    personalNote: emptyToNull(data.personalNote),
  };
}

export interface CounsellingSubmissionResult {
  profile: CounsellingProfile;
  recommendation: CourseRecommendationResponse | null;
  recommendationStatus: "ready" | "pending";
}

export class CounsellingService {
  private readonly recommendationService = new RecommendationService();

  async getByUserId(userId: string) {
    return prisma.counsellingProfile.findUnique({
      where: { userId },
    });
  }

  async getSubmissionBundle(userId: string): Promise<{
    profile: CounsellingProfile | null;
    recommendation: CourseRecommendationResponse | null;
    recommendationStatus: "ready" | "pending" | "none";
  }> {
    const profile = await this.getByUserId(userId);
    if (!profile) {
      return {
        profile: null,
        recommendation: null,
        recommendationStatus: "none",
      };
    }

    const recommendation =
      await this.recommendationService.getResponseByUserId(userId);

    return {
      profile,
      recommendation,
      recommendationStatus: profile.isSubmitted
        ? recommendation
          ? "ready"
          : "pending"
        : "none",
    };
  }

  async create(
    userId: string,
    data: CreateCounsellingProfileInput,
  ): Promise<CounsellingSubmissionResult> {
    const existing = await prisma.counsellingProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ApiError(
        "Counselling profile already exists",
        STATUS_CODES.CONFLICT,
      );
    }

    let profile: CounsellingProfile;
    try {
      profile = await prisma.counsellingProfile.create({
        data: {
          userId,
          ...toProfileData(data),
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Null constraint violation")) {
        throw new ApiError(
          "Database schema is out of date. Run `npx prisma db push` in the backend folder, then retry.",
          STATUS_CODES.SERVER_ERROR,
        );
      }
      throw err;
    }

    const recommendation = await this.recommendationService.generateForProfile(
      userId,
      profile,
    );

    if (!recommendation) {
      logger.warn(
        `Counselling profile ${profile.id} saved but recommendation generation is pending`,
      );
    }

    return {
      profile,
      recommendation,
      recommendationStatus: recommendation ? "ready" : "pending",
    };
  }

  async update(userId: string, data: UpdateCounsellingProfileInput) {
    const existing = await prisma.counsellingProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new ApiError(
        "Counselling profile not found",
        STATUS_CODES.NOT_FOUND,
      );
    }
    if (existing.isSubmitted) {
      throw new ApiError(
        "Submitted counselling profile cannot be edited",
        STATUS_CODES.FORBIDDEN,
      );
    }

    const updateData: Partial<ReturnType<typeof toProfileData>> = {};
    if (data.careerField !== undefined) updateData.careerField = data.careerField;
    if (data.careerFieldOther !== undefined) {
      updateData.careerFieldOther = emptyToNull(data.careerFieldOther);
    }
    if (data.futureGoal !== undefined) updateData.futureGoal = data.futureGoal;
    if (data.futureGoalOther !== undefined) {
      updateData.futureGoalOther = emptyToNull(data.futureGoalOther);
    }
    if (data.careerPriority !== undefined) {
      updateData.careerPriority = data.careerPriority;
    }
    if (data.careerPriorityOther !== undefined) {
      updateData.careerPriorityOther = emptyToNull(data.careerPriorityOther);
    }
    if (data.studyStream !== undefined) updateData.studyStream = data.studyStream;
    if (data.studyStreamOther !== undefined) {
      updateData.studyStreamOther = emptyToNull(data.studyStreamOther);
    }
    if (data.planningChallenge !== undefined) {
      updateData.planningChallenge = data.planningChallenge;
    }
    if (data.planningChallengeOther !== undefined) {
      updateData.planningChallengeOther = emptyToNull(
        data.planningChallengeOther,
      );
    }
    if (data.aiUnderstanding !== undefined) {
      updateData.aiUnderstanding = data.aiUnderstanding;
    }
    if (data.aiUnderstandingOther !== undefined) {
      updateData.aiUnderstandingOther = emptyToNull(data.aiUnderstandingOther);
    }
    if (data.aiFieldImpact !== undefined) {
      updateData.aiFieldImpact = data.aiFieldImpact;
    }
    if (data.aiFieldImpactOther !== undefined) {
      updateData.aiFieldImpactOther = emptyToNull(data.aiFieldImpactOther);
    }
    if (data.aiSkillBuilding !== undefined) {
      updateData.aiSkillBuilding = data.aiSkillBuilding;
    }
    if (data.aiSkillBuildingOther !== undefined) {
      updateData.aiSkillBuildingOther = emptyToNull(data.aiSkillBuildingOther);
    }
    if (data.freeTimeActivity !== undefined) {
      updateData.freeTimeActivity = data.freeTimeActivity;
    }
    if (data.freeTimeOther !== undefined) {
      updateData.freeTimeOther = emptyToNull(data.freeTimeOther);
    }
    if (data.socialSetting !== undefined) {
      updateData.socialSetting = data.socialSetting;
    }
    if (data.socialSettingOther !== undefined) {
      updateData.socialSettingOther = emptyToNull(data.socialSettingOther);
    }
    if (data.workEnvironment !== undefined) {
      updateData.workEnvironment = data.workEnvironment;
    }
    if (data.workEnvironmentOther !== undefined) {
      updateData.workEnvironmentOther = emptyToNull(data.workEnvironmentOther);
    }
    if (data.stressHandling !== undefined) {
      updateData.stressHandling = data.stressHandling;
    }
    if (data.stressHandlingOther !== undefined) {
      updateData.stressHandlingOther = emptyToNull(data.stressHandlingOther);
    }
    if (data.proudMoment !== undefined) updateData.proudMoment = data.proudMoment;
    if (data.proudMomentOther !== undefined) {
      updateData.proudMomentOther = emptyToNull(data.proudMomentOther);
    }
    if (data.aiEverydayUse !== undefined) {
      updateData.aiEverydayUse = data.aiEverydayUse;
    }
    if (data.aiEverydayUseOther !== undefined) {
      updateData.aiEverydayUseOther = emptyToNull(data.aiEverydayUseOther);
    }
    if (data.aiCuriosity !== undefined) {
      updateData.aiCuriosity = data.aiCuriosity;
    }
    if (data.aiCuriosityOther !== undefined) {
      updateData.aiCuriosityOther = emptyToNull(data.aiCuriosityOther);
    }
    if (data.personalNote !== undefined) {
      updateData.personalNote = emptyToNull(data.personalNote);
    }

    return prisma.counsellingProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  async getBooking(userId: string, courseId?: string) {
    if (courseId) {
      return prisma.counsellingBooking.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
    }
    // Admin/legacy callers that have no course in hand still get the most
    // recent booking so existing dashboards keep working.
    return prisma.counsellingBooking.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createBooking(
    userId: string,
    data: { preferredMode: string; notes?: string },
    courseId: string,
  ) {
    const existing = await this.getBooking(userId, courseId);
    if (existing) {
      throw new ApiError(
        "Counselling booking already exists for this course",
        STATUS_CODES.CONFLICT,
      );
    }

    return prisma.counsellingBooking.create({
      data: {
        userId,
        courseId,
        preferredMode: data.preferredMode,
        notes: data.notes || null,
        status: "PENDING",
      },
    });
  }

  async confirmBooking(
    userId: string,
    data: {
      counsellorName: string;
      scheduledAt: Date | string;
      meetingLink?: string;
      phoneNumber?: string;
    },
    existingBooking?: Awaited<ReturnType<CounsellingService["getBooking"]>>,
  ) {
    const existing = existingBooking ?? (await this.getBooking(userId));
    if (!existing) {
      throw new ApiError(
        "Counselling booking not found",
        STATUS_CODES.NOT_FOUND,
      );
    }

    const wasAlreadyScheduled = existing.status === "CONFIRMED";
    const isVoice = existing.preferredMode === "VOICE";

    const booking = await prisma.counsellingBooking.update({
      where: { id: existing.id },
      data: {
        counsellorName: data.counsellorName,
        scheduledAt: new Date(data.scheduledAt),
        status: "CONFIRMED",
        // Persist only the contact channel for this mode; clear the other
        // so edits / mode mismatches never leave stale VIDEO+VOICE fields.
        ...(isVoice
          ? {
              phoneNumber: data.phoneNumber!.trim(),
              meetingLink: null,
            }
          : {
              meetingLink: data.meetingLink!.trim(),
              phoneNumber: null,
            }),
      },
    });

    // Email is a secondary, non-blocking operation — scheduling has already
    // succeeded in the database by this point, so a failure here must never
    // roll back the booking or fail the API response.
    this.notifyStudentOfSchedule(
      userId,
      booking,
      wasAlreadyScheduled ? "updated" : "scheduled",
    ).catch((err) =>
      logger.error(
        `[Counselling] Failed to send schedule email to user ${userId}:`,
        err,
      ),
    );

    return booking;
  }

  async markCounsellingCompleted(userId: string) {
    const existing = await this.getBooking(userId);
    if (!existing) {
      throw new ApiError(
        "Counselling booking not found",
        STATUS_CODES.NOT_FOUND,
      );
    }
    if (existing.status !== "CONFIRMED") {
      throw new ApiError(
        "Counselling session must be confirmed before it can be marked completed",
        STATUS_CODES.CONFLICT,
      );
    }

    const feedback = await prisma.counsellingFeedback.findUnique({
      where: { userId },
    });
    if (!feedback) {
      throw new ApiError(
        "Counselling feedback must be submitted before marking the session as completed",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (existing.counsellingCompleted) {
      return existing;
    }

    return prisma.counsellingBooking.update({
      where: { id: existing.id },
      data: {
        counsellingCompleted: true,
        counsellingCompletedAt: new Date(),
      },
    });
  }

  async getFeedbackByUserId(
    userId: string,
  ): Promise<CounsellingFeedbackResponse | null> {
    const feedback = await prisma.counsellingFeedback.findUnique({
      where: { userId },
    });
    return feedback as CounsellingFeedbackResponse | null;
  }

  async saveFeedbackAndComplete(
    userId: string,
    data: SaveCounsellingFeedbackInput,
  ) {
    const booking = await this.getBooking(userId);
    if (!booking) {
      throw new ApiError(
        "Counselling booking not found",
        STATUS_CODES.NOT_FOUND,
      );
    }
    if (booking.status !== "CONFIRMED") {
      throw new ApiError(
        "Counselling session must be confirmed before submitting feedback",
        STATUS_CODES.CONFLICT,
      );
    }

    const description =
      data.description != null && data.description.trim() !== ""
        ? data.description.trim()
        : null;

    const feedbackData = {
      assessmentAlignment: data.assessmentAlignment,
      recommendedCourse: data.recommendedCourse,
      communicationRating: data.communicationRating,
      motivationLevel: data.motivationLevel,
      overallPotential: data.overallPotential,
      description,
    };

    const [feedback, updatedBooking] = await prisma.$transaction([
      prisma.counsellingFeedback.upsert({
        where: { userId },
        create: { userId, ...feedbackData },
        update: feedbackData,
      }),
      prisma.counsellingBooking.update({
        where: { id: booking.id },
        data: {
          counsellingCompleted: true,
          counsellingCompletedAt: booking.counsellingCompletedAt ?? new Date(),
        },
      }),
    ]);

    return { feedback, booking: updatedBooking };
  }

  // The Direct2Hire course is fixed at enrollment now — students no longer
  // pick one after counselling. This mirrors the booking's own course as the
  // "selected" course once counselling is complete and the full programme is
  // paid (₹99 Assessment + Counselling buyers must still upgrade). Kept on the
  // same response shape so existing dashboard / placement / sidebar gates work
  // unchanged.
  async getCourseSelectionState(userId: string) {
    const booking = await this.getBooking(userId);

    const availableCourses = await prisma.courses.findMany({
      where: { isDirect2HireCourse: true, isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        level: true,
        totalWeeks: true,
        whatYouLearn: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const courseId = booking?.selectedCourseId ?? booking?.courseId ?? null;

    let selectedCourse: (typeof availableCourses)[number] | null = null;
    if (booking?.counsellingCompleted && courseId) {
      const enrollment = await prisma.direct2HireEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { status: true },
      });
      if (enrollment?.status === "PAID") {
        selectedCourse = await prisma.courses.findUnique({
          where: { id: courseId },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            thumbnail: true,
            level: true,
            totalWeeks: true,
            whatYouLearn: true,
          },
        });
      }
    }

    return {
      counsellingCompleted: booking?.counsellingCompleted ?? false,
      selectedCourseId: selectedCourse ? courseId : null,
      selectedCourseAt:
        booking?.selectedCourseAt ?? booking?.counsellingCompletedAt ?? null,
      selectedCourse,
      availableCourses,
    };
  }

  private async notifyStudentOfSchedule(
    userId: string,
    booking: CounsellingBooking,
    kind: "scheduled" | "updated",
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        direct2HireLead: { select: { fullName: true, email: true } },
      },
    });

    if (!user) return;

    const email = user.direct2HireLead?.email || user.email;
    if (!email) return;

    const nameFromUser = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const studentName =
      nameFromUser || user.direct2HireLead?.fullName || "Student";

    const isVoice = booking.preferredMode === "VOICE";
    const hasContact = isVoice
      ? Boolean(booking.phoneNumber)
      : Boolean(booking.meetingLink);

    if (!booking.scheduledAt || !booking.counsellorName || !hasContact) {
      return;
    }

    await sendCounsellingScheduleEmail(
      email,
      {
        studentName,
        counsellorName: booking.counsellorName,
        date: booking.scheduledAt.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        time: booking.scheduledAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        preferredMode: isVoice ? "VOICE" : "VIDEO",
        meetLink: booking.meetingLink,
        phoneNumber: booking.phoneNumber,
      },
      kind,
    );
  }
}


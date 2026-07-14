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

  async getBooking(userId: string) {
    return prisma.counsellingBooking.findUnique({
      where: { userId },
    });
  }

  async createBooking(
    userId: string,
    data: { preferredMode: string; notes?: string },
  ) {
    const existing = await this.getBooking(userId);
    if (existing) {
      throw new ApiError(
        "Counselling booking already exists",
        STATUS_CODES.CONFLICT,
      );
    }

    return prisma.counsellingBooking.create({
      data: {
        userId,
        preferredMode: data.preferredMode,
        notes: data.notes || null,
        status: "PENDING",
      },
    });
  }

  async confirmBooking(
    userId: string,
    data: { counsellorName: string; meetingLink: string; scheduledAt: string },
  ) {
    const existing = await this.getBooking(userId);
    if (!existing) {
      throw new ApiError(
        "Counselling booking not found",
        STATUS_CODES.NOT_FOUND,
      );
    }

    const wasAlreadyScheduled = existing.status === "CONFIRMED";

    const booking = await prisma.counsellingBooking.update({
      where: { userId },
      data: {
        counsellorName: data.counsellorName,
        meetingLink: data.meetingLink,
        scheduledAt: new Date(data.scheduledAt),
        status: "CONFIRMED",
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
    if (existing.counsellingCompleted) {
      return existing;
    }

    return prisma.counsellingBooking.update({
      where: { userId },
      data: {
        counsellingCompleted: true,
        counsellingCompletedAt: new Date(),
      },
    });
  }

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

    const selectedCourse = booking?.selectedCourseId
      ? await prisma.courses.findUnique({
          where: { id: booking.selectedCourseId },
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
        })
      : null;

    return {
      counsellingCompleted: booking?.counsellingCompleted ?? false,
      selectedCourseId: booking?.selectedCourseId ?? null,
      selectedCourseAt: booking?.selectedCourseAt ?? null,
      selectedCourse,
      availableCourses,
    };
  }

  async selectCourse(userId: string, courseId: string) {
    const booking = await this.getBooking(userId);
    if (!booking || !booking.counsellingCompleted) {
      throw new ApiError(
        "Counselling must be completed before selecting a course",
        STATUS_CODES.FORBIDDEN,
      );
    }
    if (booking.selectedCourseId) {
      throw new ApiError(
        "A Direct2Hire course has already been selected",
        STATUS_CODES.CONFLICT,
      );
    }

    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course || !course.isDirect2HireCourse || !course.isPublished) {
      throw new ApiError(
        "Selected course is not a valid Direct2Hire course",
        STATUS_CODES.NOT_FOUND,
      );
    }

    const updatedBooking = await prisma.counsellingBooking.update({
      where: { userId },
      data: {
        selectedCourseId: course.id,
        selectedCourseAt: new Date(),
      },
    });

    await prisma.courseUserMapper.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {},
      create: { userId, courseId: course.id },
    });

    return { booking: updatedBooking, course };
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

    if (!booking.scheduledAt || !booking.counsellorName || !booking.meetingLink) {
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
        meetLink: booking.meetingLink,
      },
      kind,
    );
  }
}


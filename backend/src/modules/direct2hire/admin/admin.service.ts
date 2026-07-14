import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type {
  AdminD2HStudentListItem,
  AdminD2HStudentProfile,
} from "./admin.types.js";

export class Direct2HireAdminService {
  async getAllStudents(): Promise<AdminD2HStudentListItem[]> {
    const leads = await prisma.direct2HireLead.findMany({
      include: {
        user: {
          select: {
            id: true,
            direct2hireEnrollments: {
              select: { status: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            counsellingProfile: {
              select: { isSubmitted: true },
            },
            courseRecommendation: {
              select: { recommendedCourseTitle: true },
            },
            counsellingBooking: {
              select: { status: true, preferredMode: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return leads.map((lead) => {
      const enrollment = lead.user.direct2hireEnrollments[0];
      const counselling = lead.user.counsellingProfile;
      const recommendation = lead.user.courseRecommendation;
      const booking = lead.user.counsellingBooking;

      return {
        userId: lead.userId,
        fullName: lead.fullName,
        email: lead.email,
        phoneNumber: lead.phoneNumber,
        institutionName: lead.institutionName,
        currentEducation: lead.currentEducation,
        city: lead.city,
        state: lead.state,
        paymentCompleted: lead.paymentCompleted,
        enrollmentStatus: enrollment?.status ?? "PENDING",
        joinedAt: lead.createdAt,
        hasSubmittedCounselling: counselling?.isSubmitted ?? false,
        hasRecommendation: !!recommendation,
        recommendedCourseTitle: recommendation?.recommendedCourseTitle ?? null,
        bookingStatus: booking?.status ?? null,
        bookingMode: booking?.preferredMode ?? null,
      };
    });
  }

  async getStudentProfile(userId: string): Promise<AdminD2HStudentProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNo: true,
        profileImage: true,
        gender: true,
        address: true,
        state: true,
        country: true,
        currentStudyLevel: true,
        createdAt: true,
        direct2HireLead: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
            institutionName: true,
            currentEducation: true,
            city: true,
            state: true,
            paymentCompleted: true,
            createdAt: true,
          },
        },
        direct2hireEnrollments: {
          select: { status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        counsellingProfile: {
          select: {
            careerField: true,
            careerFieldOther: true,
            futureGoal: true,
            futureGoalOther: true,
            careerPriority: true,
            careerPriorityOther: true,
            studyStream: true,
            studyStreamOther: true,
            planningChallenge: true,
            planningChallengeOther: true,
            aiUnderstanding: true,
            aiUnderstandingOther: true,
            aiFieldImpact: true,
            aiFieldImpactOther: true,
            aiSkillBuilding: true,
            aiSkillBuildingOther: true,
            aiEverydayUse: true,
            aiEverydayUseOther: true,
            aiCuriosity: true,
            aiCuriosityOther: true,
            freeTimeActivity: true,
            freeTimeOther: true,
            socialSetting: true,
            socialSettingOther: true,
            workEnvironment: true,
            workEnvironmentOther: true,
            stressHandling: true,
            stressHandlingOther: true,
            proudMoment: true,
            proudMomentOther: true,
            personalNote: true,
          },
        },
        counsellingBooking: {
          select: {
            preferredMode: true,
            notes: true,
            status: true,
            counsellorName: true,
            meetingLink: true,
            scheduledAt: true,
            createdAt: true,
          },
        },
        courseRecommendation: {
          select: {
            recommendedCourseTitle: true,
            recommendedCourseSlug: true,
            confidenceScore: true,
            reasoning: true,
            studentStrengths: true,
            growthAreas: true,
            summary: true,
            generatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError("Student not found", STATUS_CODES.NOT_FOUND);
    }

    const enrollment = user.direct2hireEnrollments[0];

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNo: user.phoneNo,
        profileImage: user.profileImage,
        gender: user.gender,
        address: user.address,
        state: user.state,
        country: user.country,
        currentStudyLevel: user.currentStudyLevel,
        createdAt: user.createdAt,
      },
      lead: user.direct2HireLead ?? null,
      enrollment: enrollment
        ? { status: enrollment.status, createdAt: enrollment.createdAt }
        : null,
      counselling: user.counsellingProfile ?? null,
      booking: user.counsellingBooking ?? null,
      recommendation: user.courseRecommendation ?? null,
    };
  }
}

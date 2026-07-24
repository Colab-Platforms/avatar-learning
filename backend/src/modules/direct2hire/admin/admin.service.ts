import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { InternshipService } from "../internship/internship.service.js";
import type {
  AdminD2HPaymentInfo,
  AdminD2HStudentListItem,
  AdminD2HStudentProfile,
} from "./admin.types.js";

export class Direct2HireAdminService {
  private readonly internshipService = new InternshipService();

  private async getPaymentInfoForUsers(
    userIds: string[],
  ): Promise<Map<string, AdminD2HPaymentInfo>> {
    const orders = await prisma.paymentOrder.findMany({
      where: {
        userId: { in: userIds },
        productType: "DIRECT2HIRE",
        status: "PAID",
      },
      orderBy: { createdAt: "desc" },
      include: {
        transactions: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const map = new Map<string, AdminD2HPaymentInfo>();
    for (const order of orders) {
      if (map.has(order.userId)) continue;
      const transaction = order.transactions[0];
      map.set(order.userId, {
        provider: order.provider,
        gatewayOrderId: order.gatewayOrderId,
        gatewayPaymentId: transaction?.gatewayPaymentId ?? null,
        amount: order.amount,
        status: order.status,
        paidAt: transaction?.createdAt ?? order.updatedAt,
      });
    }
    return map;
  }

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

    const paymentByUserId = await this.getPaymentInfoForUsers(
      leads.map((lead) => lead.userId),
    );

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
        payment: paymentByUserId.get(lead.userId) ?? null,
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
        city: true,
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
            counsellingCompleted: true,
            counsellingCompletedAt: true,
            selectedCourseId: true,
            selectedCourseAt: true,
            selectedCourse: {
              select: { id: true, title: true, slug: true },
            },
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
        counsellingFeedback: {
          select: {
            assessmentAlignment: true,
            recommendedCourse: true,
            communicationRating: true,
            motivationLevel: true,
            overallPotential: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError("Student not found", STATUS_CODES.NOT_FOUND);
    }

    const enrollment = user.direct2hireEnrollments[0];
    const internship =
      await this.internshipService.getAdminStudentProgress(userId);
    const paymentByUserId = await this.getPaymentInfoForUsers([userId]);

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
        city: user.city,
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
      feedback: user.counsellingFeedback ?? null,
      payment: paymentByUserId.get(userId) ?? null,
      internship,
    };
  }
}

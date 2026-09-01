import prisma from "@root/prisma.js";
import type { CourseTier } from "@prisma/client";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { tracksFor } from "@/modules/course/courseTier.js";
import { InternshipService } from "../internship/internship.service.js";
import type {
  AdminBasicStudentProfile,
  AdminBasicUserRow,
  AdminD2HCourseBlock,
  AdminD2HPaymentInfo,
  AdminD2HStudentListItem,
  AdminD2HStudentProfile,
} from "./admin.types.js";

export class Direct2HireAdminService {
  private readonly internshipService = new InternshipService();

  /**
   * All PAID orders (course, D2H, assessment+counselling) for the given
   * users, grouped by userId then courseId. A course id on the order is
   * used directly; D2H_ASSESSMENT_COUNSELLING orders don't carry one, so we
   * resolve it via the enrollment they're attached to. Orders that resolve
   * to no course land under the "" key.
   */
  private async getPaymentsByUserAndCourse(
    userIds: string[],
  ): Promise<Map<string, Map<string, AdminD2HPaymentInfo[]>>> {
    const orders = await prisma.paymentOrder.findMany({
      where: {
        userId: { in: userIds },
        productType: { in: ["COURSE", "DIRECT2HIRE", "D2H_ASSESSMENT_COUNSELLING"] },
        status: "PAID",
      },
      orderBy: { createdAt: "desc" },
      include: {
        transactions: {
          where: { status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        direct2hireEnrollment: { select: { courseId: true } },
      },
    });

    const map = new Map<string, Map<string, AdminD2HPaymentInfo[]>>();
    for (const order of orders) {
      const courseId = order.courseId ?? order.direct2hireEnrollment?.courseId ?? "";
      const transaction = order.transactions[0];
      const info: AdminD2HPaymentInfo = {
        provider: order.provider,
        gatewayOrderId: order.gatewayOrderId,
        gatewayPaymentId: transaction?.gatewayPaymentId ?? null,
        amount: order.amount,
        productType: order.productType,
        status: order.status,
        paidAt: transaction?.createdAt ?? order.updatedAt,
      };

      if (!map.has(order.userId)) map.set(order.userId, new Map());
      const byCourse = map.get(order.userId)!;
      if (!byCourse.has(courseId)) byCourse.set(courseId, []);
      byCourse.get(courseId)!.push(info);
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
            counsellingBookings: {
              select: { status: true, preferredMode: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const paymentsByUserAndCourse = await this.getPaymentsByUserAndCourse(
      leads.map((lead) => lead.userId),
    );

    return leads.map((lead) => {
      const enrollment = lead.user.direct2hireEnrollments[0];
      const counselling = lead.user.counsellingProfile;
      const recommendation = lead.user.courseRecommendation;
      const booking = lead.user.counsellingBookings?.[0];
      const latestPayment = this.latestPaymentAcrossCourses(
        paymentsByUserAndCourse.get(lead.userId),
      );

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
        payment: latestPayment,
      };
    });
  }

  private latestPaymentAcrossCourses(
    byCourse: Map<string, AdminD2HPaymentInfo[]> | undefined,
  ): AdminD2HPaymentInfo | null {
    if (!byCourse) return null;
    let latest: AdminD2HPaymentInfo | null = null;
    for (const payments of byCourse.values()) {
      for (const payment of payments) {
        if (!latest || (payment.paidAt && (!latest.paidAt || payment.paidAt > latest.paidAt))) {
          latest = payment;
        }
      }
    }
    return latest;
  }

  /** Basic (₹499) purchases — one row per user holding a BASIC or BOTH tier mapper. */
  async getAllBasicEnrollments(
    take?: number,
    skip?: number,
    search?: string,
  ): Promise<{ rows: AdminBasicUserRow[]; totalRecords: number }> {
    const where = {
      enrolledCourses: { some: { tier: { in: ["BASIC", "BOTH"] as CourseTier[] } } },
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { phoneNo: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNo: true,
        enrolledCourses: {
          where: { tier: { in: ["BASIC", "BOTH"] } },
          orderBy: { enrolledAt: "desc" },
          select: {
            courseId: true,
            tier: true,
            enrolledAt: true,
            progress: true,
            isCompleted: true,
            course: { select: { title: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const paymentsByUserAndCourse = await this.getPaymentsByUserAndCourse(
      users.map((u) => u.id),
    );

    const rows: AdminBasicUserRow[] = users.map((u) => ({
      user: {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phoneNo: u.phoneNo,
      },
      courses: u.enrolledCourses.map((mapper) => ({
        courseId: mapper.courseId,
        courseTitle: mapper.course.title,
        courseSlug: mapper.course.slug,
        tier: mapper.tier,
        enrolledAt: mapper.enrolledAt,
        progress: mapper.progress,
        isCompleted: mapper.isCompleted,
        payments: paymentsByUserAndCourse.get(u.id)?.get(mapper.courseId) ?? [],
      })),
    }));

    const totalRecords = await prisma.user.count({ where });
    return { rows, totalRecords };
  }

  /**
   * Single-student view for the Basic (₹499) plan page — deliberately
   * lightweight: just the student, their Basic/upgraded courses, and the
   * payments behind them. No counselling/internship/placement journey; that
   * belongs to the Direct2Hire profile (getStudentProfile) instead.
   */
  async getBasicStudentProfile(userId: string): Promise<AdminBasicStudentProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNo: true,
        profileImage: true,
        createdAt: true,
        enrolledCourses: {
          where: { tier: { in: ["BASIC", "BOTH"] } },
          orderBy: { enrolledAt: "desc" },
          select: {
            courseId: true,
            tier: true,
            enrolledAt: true,
            progress: true,
            isCompleted: true,
            course: { select: { title: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError("Student not found", STATUS_CODES.NOT_FOUND);
    }

    const paymentsByCourse = (await this.getPaymentsByUserAndCourse([userId])).get(userId);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNo: user.phoneNo,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      courses: user.enrolledCourses.map((mapper) => ({
        courseId: mapper.courseId,
        courseTitle: mapper.course.title,
        courseSlug: mapper.course.slug,
        tier: mapper.tier,
        enrolledAt: mapper.enrolledAt,
        progress: mapper.progress,
        isCompleted: mapper.isCompleted,
        payments: paymentsByCourse?.get(mapper.courseId) ?? [],
      })),
    };
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
            country: true,
            paymentCompleted: true,
            createdAt: true,
          },
        },
        enrolledCourses: {
          select: {
            courseId: true,
            tier: true,
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        direct2hireEnrollments: {
          select: {
            id: true,
            courseId: true,
            status: true,
            assessmentCounsellingPaidAt: true,
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        trackProgress: {
          select: { courseId: true, tier: true, progress: true, isCompleted: true },
        },
        counsellingBookings: {
          select: {
            courseId: true,
            preferredMode: true,
            notes: true,
            status: true,
            counsellorName: true,
            meetingLink: true,
            phoneNumber: true,
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

    const internship = await this.internshipService.getAdminStudentProgress(userId);
    const paymentsByCourse = (await this.getPaymentsByUserAndCourse([userId])).get(userId);

    // This is the Direct2Hire (₹4999) journey page — only courses with a D2H
    // enrollment belong in its tabs. A BASIC-only purchase (no Direct2Hire
    // enrollment) is a different product and lives on the Basic plan page
    // instead (getBasicStudentProfile below), not mixed in here.
    const mapperByCourseId = new Map(user.enrolledCourses.map((m) => [m.courseId, m]));
    const enrollmentByCourseId = new Map(
      user.direct2hireEnrollments.map((e) => [e.courseId, e]),
    );
    const courseIds = new Set(enrollmentByCourseId.keys());

    const bookingByCourseId = new Map(
      user.counsellingBookings
        .filter((b) => b.courseId)
        .map((b) => [b.courseId as string, b]),
    );

    const courses: AdminD2HCourseBlock[] = Array.from(courseIds).map((courseId) => {
      const mapper = mapperByCourseId.get(courseId);
      const enrollment = enrollmentByCourseId.get(courseId);
      const course = mapper?.course ?? enrollment?.course;
      const tracks = mapper
        ? tracksFor(mapper.tier).map((track) => {
            const progressRow = user.trackProgress.find(
              (p) => p.courseId === courseId && p.tier === track,
            );
            return {
              track,
              progress: progressRow?.progress ?? 0,
              isCompleted: progressRow?.isCompleted ?? false,
            };
          })
        : [];

      return {
        courseId,
        courseTitle: course?.title ?? "Unknown course",
        courseSlug: course?.slug ?? "",
        tier: mapper?.tier ?? null,
        enrollmentId: enrollment?.id ?? null,
        enrollmentStatus: enrollment?.status ?? null,
        assessmentCounsellingPaidAt: enrollment?.assessmentCounsellingPaidAt ?? null,
        tracks,
        payments: paymentsByCourse?.get(courseId) ?? [],
        booking: bookingByCourseId.get(courseId) ?? null,
      };
    });

    // Newest activity first: prefer enrollment createdAt implicitly via
    // insertion order from direct2hireEnrollments (already desc by nothing
    // guaranteed) — sort explicitly by enrollmentStatus presence then title
    // for a stable, predictable tab order.
    courses.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));

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
      counselling: user.counsellingProfile ?? null,
      recommendation: user.courseRecommendation ?? null,
      feedback: user.counsellingFeedback ?? null,
      internship,
      courses,
    };
  }
}

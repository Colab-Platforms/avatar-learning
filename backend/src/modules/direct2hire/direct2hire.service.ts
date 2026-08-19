import type { Direct2HirePlan } from "@prisma/client";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { partnerService } from "@/modules/partners/partner.service.js";
import { D2HCourseSummary } from "./direct2hire.types.js";

// Fixed commission base amount for partner referrals — flat ₹999 per Direct2Hire
// payment, regardless of which D2H course the student actually enrolls in.
export const DIRECT2HIRE_COMMISSION_BASE_AMOUNT = 999;

export const DIRECT2HIRE_ASSESSMENT_PRICE_RUPEES: number = parseInt(
  process.env.DIRECT2HIRE_ASSESSMENT_PRICE_RUPEES!,
);

export const DIRECT2HIRE_PLAN_PRICES: Record<Direct2HirePlan, number> = {
  BASIC: parseInt(process.env.DIRECT2HIRE_BASIC_PRICE_RUPEES!),
  STANDARD: parseInt(process.env.DIRECT2HIRE_STANDARD_PRICE_RUPEES!),
  PRO: parseInt(process.env.DIRECT2HIRE_PRO_PRICE_RUPEES!),
};

// True once a student has any paid Direct2Hire access at all — Basic
// included. Gates things every plan gets: the assessment questionnaire and
// course selection. For the live-call-specific gate, see
// hasAssessmentCounsellingAccess below.
export function hasDirect2HireAccess(enrollment: {
  status: string;
  assessmentCounsellingPaidAt: Date | null;
}): boolean {
  return (
    !!enrollment.assessmentCounsellingPaidAt || enrollment.status === "PAID"
  );
}

// True once a student can book/attend a *live* 1-on-1 counselling call —
// either via the old standalone Assessment+Counselling purchase, or by
// paying for the Standard/Pro Direct2Hire plan. Basic-plan payers get
// pre-recorded counselling instead, so they don't pass this gate.
export function hasAssessmentCounsellingAccess(enrollment: {
  status: string;
  plan: Direct2HirePlan | null;
  assessmentCounsellingPaidAt: Date | null;
}): boolean {
  return (
    !!enrollment.assessmentCounsellingPaidAt ||
    (enrollment.status === "PAID" && enrollment.plan !== "BASIC")
  );
}

// Internship (weekly tasks) is included from the Standard plan upward —
// Basic-plan payers get assessment + counselling + learning only.
export function hasInternshipAccess(enrollment: {
  status: string;
  plan: Direct2HirePlan | null;
}): boolean {
  return enrollment.status === "PAID" && enrollment.plan !== "BASIC";
}

// Job placement is Pro-only — Basic and Standard stop at the internship.
export function hasJobPlacementAccess(enrollment: {
  status: string;
  plan: Direct2HirePlan | null;
}): boolean {
  return enrollment.status === "PAID" && enrollment.plan === "PRO";
}

export class Direct2HireService {
  async getOrCreateEnrollment(userId: string) {
    const existing = await prisma.direct2HireEnrollment.findFirst({
      where: { userId },
    });
    if (existing) return existing;

    return prisma.direct2HireEnrollment.create({ data: { userId } });
  }

  async getMyStatus(userId: string) {
    const enrollment = await this.getOrCreateEnrollment(userId);

    const booking = await prisma.counsellingBooking.findUnique({
      where: { userId },
      select: { selectedCourseId: true },
    });

    const d2hCourses = booking?.selectedCourseId
      ? await prisma.courses.findMany({
          where: {
            isDirect2HireCourse: true,
            id: booking.selectedCourseId,
          },
          include: { _count: { select: { lessons: true } } },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const courseIds = d2hCourses.map((c) => c.id);
    const mappers = await prisma.courseUserMapper.findMany({
      where: { userId, courseId: { in: courseIds } },
    });
    const mapperByCourseId = new Map(mappers.map((m) => [m.courseId, m]));

    const courses: D2HCourseSummary[] = d2hCourses.map((c) => {
      const mapper = mapperByCourseId.get(c.id);
      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        totalLessons: c._count.lessons,
        enrolled: !!mapper,
        progress: mapper?.progress ?? 0,
        isCompleted: mapper?.isCompleted ?? false,
      };
    });

    return {
      enrollment: {
        ...enrollment,
        hasAssessmentCounsellingAccess:
          hasAssessmentCounsellingAccess(enrollment),
        hasLiveCounsellingAccess: hasAssessmentCounsellingAccess(enrollment),
      },
      courses,
    };
  }

  /**
   * Single entry point for granting D2H course access once payment is confirmed.
   * call this same function on successful payment instead of the admin route below.
   */
  async grantCourseAccess(userId: string, plan: Direct2HirePlan) {
    const d2hCourses = await prisma.courses.findMany({
      where: {
        isDirect2HireCourse: true,
        ...(plan !== "PRO" ? { isDirect2HireProOnly: false } : {}),
      },
      select: { id: true },
    });

    for (const course of d2hCourses) {
      const existing = await prisma.courseUserMapper.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      });
      if (!existing) {
        await prisma.courseUserMapper.create({
          data: { userId, courseId: course.id },
        });
      }
    }
  }

  // Defaults to PRO (not STANDARD) as a safety net while tiered plan
  // selection is still rolling out — any enrollment paid through a path
  // that doesn't pass an explicit plan should not lose access.
  async markPaid(
    enrollmentId: string,
    fallbackPlan: Direct2HirePlan = "PRO",
  ) {
    const enrollment = await prisma.direct2HireEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment)
      throw new ApiError("Enrollment not found", STATUS_CODES.NOT_FOUND);

    const plan = enrollment.plan ?? fallbackPlan;

    const updated = await prisma.direct2HireEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "PAID", plan, paidAt: enrollment.paidAt ?? new Date() },
    });

    await this.grantCourseAccess(enrollment.userId, plan);
    await this.scheduleCommission(enrollment.userId, enrollmentId);

    return updated;
  }

  async markRefunded(enrollmentId: string) {
    const enrollment = await prisma.direct2HireEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment)
      throw new ApiError("Enrollment not found", STATUS_CODES.NOT_FOUND);
    if (enrollment.status !== "PAID") {
      throw new ApiError(
        "Only a paid enrollment can be marked refunded",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    return prisma.direct2HireEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "REFUNDED" },
    });
  }

  // Does not credit the partner yet — see partnerService.scheduleReferralCredit.
  private async scheduleCommission(userId: string, enrollmentId: string) {
    try {
      await partnerService.scheduleReferralCredit(
        userId,
        enrollmentId,
        DIRECT2HIRE_COMMISSION_BASE_AMOUNT,
      );
    } catch (err) {
      console.error("[Partners] Failed to schedule referral commission:", err);
    }
  }

  async getAllEnrollments(take?: number, skip?: number, search?: string) {
    const where = {
      status: "PAID" as const,
      ...(search
        ? {
            user: {
              OR: [
                {
                  firstName: { contains: search, mode: "insensitive" as const },
                },
                {
                  lastName: { contains: search, mode: "insensitive" as const },
                },
                { email: { contains: search, mode: "insensitive" as const } },
                { phoneNo: { contains: search, mode: "insensitive" as const } },
              ],
            },
          }
        : {}),
    };

    const enrollments = await prisma.direct2HireEnrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.direct2HireEnrollment.count({ where });
    return { enrollments, totalRecords };
  }

  async getAllAssessmentCounsellingPurchases(take?: number, skip?: number) {
    const where = { assessmentCounsellingPaidAt: { not: null } };

    const enrollments = await prisma.direct2HireEnrollment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNo: true,
          },
        },
      },
      orderBy: { assessmentCounsellingPaidAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.direct2HireEnrollment.count({ where });
    return { enrollments, totalRecords };
  }

  /**
   * Development-only bypass until payment gateway KYC is complete.
   */
  async continueAsPaidForDev(
    userId: string,
    plan: Direct2HirePlan = "STANDARD",
  ) {
    if (process.env.NODE_ENV === "production") {
      throw new ApiError("Not available in production", STATUS_CODES.FORBIDDEN);
    }

    const enrollment = await this.getOrCreateEnrollment(userId);
    if (enrollment.status !== "PAID") {
      await prisma.direct2HireEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "PAID", plan, paidAt: enrollment.paidAt ?? new Date() },
      });
      await this.grantCourseAccess(userId, plan);
      await this.scheduleCommission(userId, enrollment.id);
    }

    await prisma.direct2HireLead.updateMany({
      where: { userId },
      data: { paymentCompleted: true },
    });

    return this.getMyStatus(userId);
  }
}

export const direct2hireService = new Direct2HireService();

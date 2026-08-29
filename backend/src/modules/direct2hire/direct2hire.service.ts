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

export function hasAssessmentCounsellingAccess(enrollment: {
    status: string;
    assessmentCounsellingPaidAt: Date | null;
}): boolean {
    return enrollment.status === "PAID" || !!enrollment.assessmentCounsellingPaidAt;
}

export class Direct2HireService {
    /**
     * Read-only lookup for access gates. Deliberately does NOT create a row —
     * gates run on every request and must not litter the table with PENDING
     * enrollments for courses the user only browsed.
     */
    async findEnrollment(userId: string, courseId: string) {
        return prisma.direct2HireEnrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
    }

    /**
     * Resolve which enrollment an access-gated request is about.
     *
     * Direct2Hire is per-course now, but the existing /direct2hire pages don't
     * carry a course id yet. Rather than break them, we resolve the single
     * enrollment when there is only one and report ambiguity when there is
     * genuinely a choice to make.
     */
    async resolveEnrollmentForRequest(userId: string, courseId?: string) {
        if (courseId) {
            return {
                enrollment: await this.findEnrollment(userId, courseId),
                ambiguous: false as const,
            };
        }

        const enrollments = await prisma.direct2HireEnrollment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        if (enrollments.length > 1) {
            // Only genuinely ambiguous if more than one is actually usable —
            // abandoned PENDING rows must not lock a paid student out.
            const usable = enrollments.filter(
                (e) => e.status === "PAID" || !!e.assessmentCounsellingPaidAt,
            );
            if (usable.length > 1) {
                return { enrollment: null, ambiguous: true as const };
            }
            if (usable.length === 1) {
                return { enrollment: usable[0], ambiguous: false as const };
            }
        }

        return { enrollment: enrollments[0] ?? null, ambiguous: false as const };
    }

    async getOrCreateEnrollment(userId: string, courseId: string) {
        const existing = await prisma.direct2HireEnrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing) return existing;

        return prisma.direct2HireEnrollment.create({ data: { userId, courseId } });
    }

    async getMyStatus(userId: string, courseId?: string) {
        const enrollment = courseId
            ? await this.getOrCreateEnrollment(userId, courseId)
            : await prisma.direct2HireEnrollment.findFirst({
                  where: { userId },
                  orderBy: { createdAt: "desc" },
              });

        if (!enrollment) {
            return { enrollment: null, courses: [] };
        }

        const paidOrder =
            enrollment.status === "PAID"
                ? await prisma.paymentOrder.findFirst({
                      where: {
                          userId,
                          direct2hireEnrollmentId: enrollment.id,
                          productType: "DIRECT2HIRE",
                          status: "PAID",
                      },
                      orderBy: { updatedAt: "desc" },
                      select: { amount: true },
                  })
                : null;
        const amountPaidRupees = paidOrder ? paidOrder.amount / 100 : null;

        const targetCourseId = courseId || enrollment.courseId;
        const d2hCourses = targetCourseId
            ? await prisma.courses.findMany({
                  where: { id: targetCourseId },
                  include: { _count: { select: { lessons: true } } },
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
                hasAssessmentCounsellingAccess: hasAssessmentCounsellingAccess(enrollment),
                amountPaidRupees,
            },
            courses,
        };
    }

    /**
     * Single entry point for granting D2H or Basic course access once payment is confirmed.
     *
     * Access only ever moves upward. A ₹499 BASIC purchase must never overwrite
     * a ₹4999 D2H mapper — that would revoke content the user already paid for,
     * which is reachable both by buying BASIC after D2H and by an out-of-order
     * webhook retry.
     */
    async grantCourseAccess(userId: string, courseId: string, tier: "BASIC" | "D2H" = "D2H") {
        const existing = await prisma.courseUserMapper.findUnique({
            where: { userId_courseId: { userId, courseId } },
            select: { tier: true },
        });

        if (!existing) {
            await prisma.courseUserMapper.create({
                data: { userId, courseId, tier },
            });
            return;
        }

        if (existing.tier === "D2H" || existing.tier === "BOTH") return;
        if (tier === "BASIC") return;

        await prisma.courseUserMapper.update({
            where: { userId_courseId: { userId, courseId } },
            data: { tier },
        });
    }

    async markPaid(enrollmentId: string) {
        const enrollment = await prisma.direct2HireEnrollment.findUnique({
            where: { id: enrollmentId },
        });
        if (!enrollment)
            throw new ApiError("Enrollment not found", STATUS_CODES.NOT_FOUND);

        const updated = await prisma.direct2HireEnrollment.update({
            where: { id: enrollmentId },
            data: { status: "PAID", paidAt: enrollment.paidAt ?? new Date() },
        });

        if (enrollment.courseId) {
            await this.grantCourseAccess(enrollment.userId, enrollment.courseId, "D2H");
        }
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
                            { firstName: { contains: search, mode: "insensitive" as const } },
                            { lastName: { contains: search, mode: "insensitive" as const } },
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
    async continueAsPaidForDev(userId: string) {
        if (process.env.NODE_ENV === "production") {
            throw new ApiError(
                "Not available in production",
                STATUS_CODES.FORBIDDEN,
            );
        }

        let enrollment = await prisma.direct2HireEnrollment.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        if (!enrollment) {
            const defaultCourse = await prisma.courses.findFirst({
                where: { isDirect2HireCourse: true, isPublished: true },
                select: { id: true },
            });
            if (!defaultCourse) throw new ApiError("No course found", STATUS_CODES.NOT_FOUND);
            enrollment = await this.getOrCreateEnrollment(userId, defaultCourse.id);
        }
        if (enrollment.status !== "PAID") {
            await prisma.direct2HireEnrollment.update({
                where: { id: enrollment.id },
                data: { status: "PAID", paidAt: enrollment.paidAt ?? new Date() },
            });
            if (enrollment.courseId) {
                await this.grantCourseAccess(userId, enrollment.courseId, "D2H");
            }
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

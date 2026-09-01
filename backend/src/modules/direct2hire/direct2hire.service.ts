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
    /**
     * Dashboard routes are addressed by slug (/dashboard/:slug/counselling),
     * while every enrollment and booking lookup keys off the course cuid.
     * Accept either and hand back the cuid.
     *
     * Returns undefined for an unknown identifier so callers fall back to
     * "no course specified" rather than querying with a value that can never
     * match — which is exactly how a slug used to silently resolve to no
     * booking while still passing the access gate.
     */
    async resolveCourseId(identifier?: string): Promise<string | undefined> {
        if (!identifier) return undefined;
        const course = await prisma.courses.findFirst({
            where: { OR: [{ id: identifier }, { slug: identifier }] },
            select: { id: true },
        });
        return course?.id;
    }

    async findEnrollment(userId: string, courseId: string) {
        return prisma.direct2HireEnrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
    }

    /**
     * Return all usable (PAID or assessmentCounsellingPaidAt) Direct2Hire enrollments for a user.
     */
    async findUsableEnrollments(userId: string) {
        const enrollments = await prisma.direct2HireEnrollment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return enrollments.filter(
            (e) => e.status === "PAID" || !!e.assessmentCounsellingPaidAt,
        );
    }

    /**
     * Resolve which enrollment an access-gated request is about.
     *
     * Direct2Hire is per-course now. When a courseId is provided, we fetch that
     * course's enrollment. When omitted, we resolve to the most recent usable
     * enrollment so user-level actions (e.g. AI assessment profile) never fail.
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
            const usable = enrollments.filter(
                (e) => e.status === "PAID" || !!e.assessmentCounsellingPaidAt,
            );
            if (usable.length > 0) {
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
        let mappers = await prisma.courseUserMapper.findMany({
            where: { userId, courseId: { in: courseIds } },
        });

        // Self-heal: a PAID enrollment must have a course mapper. Historically
        // that row was created when the student picked a course after
        // counselling; that step is gone now, and some PAID users (manual /
        // seeded / out-of-order webhook) can be left without one. Grant it here
        // so learning, assessments and internship stop 403-ing.
        if (enrollment.status === "PAID" && courseIds.length > 0) {
            const mapped = new Set(mappers.map((m) => m.courseId));
            const missing = courseIds.filter((id) => !mapped.has(id));
            if (missing.length > 0) {
                await Promise.all(
                    missing.map((id) => this.grantCourseAccess(userId, id, "D2H")),
                );
                mappers = await prisma.courseUserMapper.findMany({
                    where: { userId, courseId: { in: courseIds } },
                });
            }
        }

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
     *
     * The two plans are separate tracks, not nested (see courseTier.ts), and an
     * upgrader pays the full ₹4999. So BASIC + D2H lands on BOTH — overwriting
     * with plain D2H would take away the Basic track they already bought.
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
            data: { tier: existing.tier === "BASIC" ? "BOTH" : tier },
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

    /**
     * One row per user, not per enrollment — a student who bought multiple D2H
     * courses shows once with all their paid enrollments nested underneath.
     * Pagination therefore counts users, ordered by their most recent paid
     * enrollment.
     */
    async getAllEnrollments(take?: number, skip?: number, search?: string) {
        const where = {
            direct2hireEnrollments: { some: { status: "PAID" as const } },
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

        // Ordered by the user's own createdAt (their join date), which is a
        // stable, DB-level sort — matters because take/skip determine which
        // users land on this page, so the ordering used for pagination and the
        // ordering shown must be the same one.
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNo: true,
                direct2hireEnrollments: {
                    where: { status: "PAID" },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        courseId: true,
                        status: true,
                        paidAt: true,
                        createdAt: true,
                        course: { select: { id: true, title: true, slug: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            ...(take !== undefined && { take }),
            ...(skip !== undefined && { skip }),
        });

        const courseIds = Array.from(
            new Set(
                users.flatMap((u) => u.direct2hireEnrollments.map((e) => e.courseId)),
            ),
        );
        const userIds = users.map((u) => u.id);
        const paidOrders = courseIds.length
            ? await prisma.paymentOrder.findMany({
                where: {
                    userId: { in: userIds },
                    courseId: { in: courseIds },
                    productType: "DIRECT2HIRE",
                    status: "PAID",
                },
                select: { userId: true, amount: true },
            })
            : [];
        const totalPaidByUserId = new Map<string, number>();
        for (const order of paidOrders) {
            totalPaidByUserId.set(
                order.userId,
                (totalPaidByUserId.get(order.userId) ?? 0) + order.amount,
            );
        }

        const rows = users.map((u) => ({
            user: {
                id: u.id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                phoneNo: u.phoneNo,
            },
            courseCount: u.direct2hireEnrollments.length,
            totalPaid: totalPaidByUserId.get(u.id) ?? 0,
            firstPaidAt:
                u.direct2hireEnrollments.reduce<Date | null>((earliest, e) => {
                    if (!e.paidAt) return earliest;
                    return !earliest || e.paidAt < earliest ? e.paidAt : earliest;
                }, null) ?? null,
            courses: u.direct2hireEnrollments.map((e) => ({
                enrollmentId: e.id,
                courseId: e.courseId,
                courseTitle: e.course.title,
                courseSlug: e.course.slug,
                status: e.status,
                paidAt: e.paidAt,
            })),
        }));

        const totalRecords = await prisma.user.count({ where });
        return { rows, totalRecords };
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

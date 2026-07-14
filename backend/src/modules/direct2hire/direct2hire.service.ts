import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { D2HCourseSummary } from "./direct2hire.types.js";

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

        const d2hCourses = await prisma.courses.findMany({
            where: {
                isDirect2HireCourse: true,
                ...(booking?.selectedCourseId
                    ? { id: booking.selectedCourseId }
                    : {}),
            },
            include: { _count: { select: { lessons: true } } },
            orderBy: { createdAt: "asc" },
        });

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

        return { enrollment, courses };
    }

    /**
     * Single entry point for granting D2H course access once payment is confirmed.
     * The real payment webhook (Razorpay/Cashfree, built on another branch) should
     * call this same function on successful payment instead of the admin route below.
     */
    async grantCourseAccess(userId: string) {
        const d2hCourses = await prisma.courses.findMany({
            where: { isDirect2HireCourse: true },
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

    async markPaid(enrollmentId: string) {
        const enrollment = await prisma.direct2HireEnrollment.findUnique({
            where: { id: enrollmentId },
        });
        if (!enrollment)
            throw new ApiError("Enrollment not found", STATUS_CODES.NOT_FOUND);

        const updated = await prisma.direct2HireEnrollment.update({
            where: { id: enrollmentId },
            data: { status: "PAID" },
        });

        await this.grantCourseAccess(enrollment.userId);

        return updated;
    }

    async getAllEnrollments(take?: number, skip?: number) {
        const enrollments = await prisma.direct2HireEnrollment.findMany({
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

        const totalRecords = await prisma.direct2HireEnrollment.count();
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

        const enrollment = await this.getOrCreateEnrollment(userId);
        if (enrollment.status !== "PAID") {
            await prisma.direct2HireEnrollment.update({
                where: { id: enrollment.id },
                data: { status: "PAID" },
            });
            await this.grantCourseAccess(userId);
        }

        await prisma.direct2HireLead.updateMany({
            where: { userId },
            data: { paymentCompleted: true },
        });

        return this.getMyStatus(userId);
    }
}

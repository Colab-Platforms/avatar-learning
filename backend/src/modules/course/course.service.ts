import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
    createBunnyVideo,
    deleteBunnyVideo,
    getBunnyEmbedUrl,
    getBunnyThumbnailUrl,
    getBunnyDirectUploadUrl,
    getBunnyMp4Url,
} from "@/utils/bunny.js";
import { Readable } from "stream";
import { ReadableStream as NodeReadableStream } from "stream/web";
import {
    CreateCategoryBody,
    CreateCourseBody,
    UpdateCourseBody,
    CreateLessonBody,
    UpdateLessonBody,
} from "./course.types.js";

const slugify = (text: string): string =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s]+/g, "-")
        .replace(/^-|-$/g, "");

// ─── Admin Service ────────────────────────────────────────────────────────────

export class AdminCourseService {
    // Categories 
    async createCategory(data: CreateCategoryBody) {
        const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
        if (existing) throw new ApiError("Category with this slug already exists", STATUS_CODES.CONFLICT);

        return prisma.category.create({ data });
    }

    async getCategories() {
        return prisma.category.findMany({
            orderBy: { name: "asc" },
        });
    }

    // Courses 
    async getAllCourses() {
        return prisma.courses.findMany({
            include: {
                category: { select: { id: true, name: true, slug: true } },
                creator: { select: { id: true, firstName: true, lastName: true, email: true } },
                _count: { select: { lessons: true, enrollments: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async getCourseById(id: string) {
        const course = await prisma.courses.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } },
                lessons: {
                    include: { resources: true },
                    orderBy: { weekNumber: "asc" },
                },
                _count: { select: { enrollments: true } },
            },
        });
        if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
        return course;
    }

    async createCourse(data: CreateCourseBody, createdBy: string) {
        const slug = slugify(data.title);

        const slugExists = await prisma.courses.findUnique({ where: { slug } });
        if (slugExists) throw new ApiError("A course with a similar title already exists", STATUS_CODES.CONFLICT);

        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
        if (!category) throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);

        const { whatYouLearn, audience, ...rest } = data;
        return prisma.courses.create({
            data: {
                ...rest,
                slug,
                createdBy,
                ...(whatYouLearn !== undefined && { whatYouLearn: whatYouLearn as object[] }),
                ...(audience !== undefined && { audience: audience as object[] }),
            },
        });
    }

    async updateCourse(id: string, data: UpdateCourseBody) {
        await this.getCourseById(id);
        const { whatYouLearn, audience, ...rest } = data;
        return prisma.courses.update({
            where: { id },
            data: {
                ...rest,
                ...(whatYouLearn !== undefined && { whatYouLearn: whatYouLearn as object[] }),
                ...(audience !== undefined && { audience: audience as object[] }),
            },
        });
    }

    async deleteCourse(id: string) {
        const course = await prisma.courses.findUnique({
            where: { id },
            include: { lessons: { include: { resources: true } } },
        });
        if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

        for (const lesson of course.lessons) {
            for (const resource of lesson.resources) {
                if (resource.category === "VIDEO" && resource.bunnyVideoId) {
                    await deleteBunnyVideo(resource.bunnyVideoId).catch(() => {});
                }
            }
        }

        return prisma.courses.delete({ where: { id } });
    }

    async togglePublish(id: string) {
        const course = await this.getCourseById(id);
        return prisma.courses.update({
            where: { id },
            data: { isPublished: !course.isPublished },
        });
    }

    // Lessons ------------------------------------------------------------------

    async createLesson(courseId: string, data: CreateLessonBody) {
        const course = await prisma.courses.findUnique({ where: { id: courseId } });
        if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

        const existing = await prisma.lessons.findUnique({
            where: { courseId_weekNumber: { courseId, weekNumber: data.weekNumber } },
        });
        if (existing) throw new ApiError("A lesson for this week already exists", STATUS_CODES.CONFLICT);

        return prisma.lessons.create({
            data: {
                ...data,
                courseId,
                releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
            },
        });
    }

    async updateLesson(lessonId: string, data: UpdateLessonBody) {
        const lesson = await prisma.lessons.findUnique({ where: { id: lessonId } });
        if (!lesson) throw new ApiError("Lesson not found", STATUS_CODES.NOT_FOUND);

        return prisma.lessons.update({
            where: { id: lessonId },
            data: {
                ...data,
                releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
            },
        });
    }

    async deleteLesson(lessonId: string) {
        const lesson = await prisma.lessons.findUnique({
            where: { id: lessonId },
            include: { resources: true },
        });
        if (!lesson) throw new ApiError("Lesson not found", STATUS_CODES.NOT_FOUND);

        for (const resource of lesson.resources) {
            if (resource.category === "VIDEO" && resource.bunnyVideoId) {
                await deleteBunnyVideo(resource.bunnyVideoId).catch(() => {});
            }
        }

        return prisma.lessons.delete({ where: { id: lessonId } });
    }

    // Video Upload (two-step direct upload) ------------------------------------

    // Step 1: create a Bunny slot, return credentials for the client to upload directly
    async initVideoUpload(lessonId: string, title: string) {
        const lesson = await prisma.lessons.findUnique({ where: { id: lessonId } });
        if (!lesson) throw new ApiError("Lesson not found", STATUS_CODES.NOT_FOUND);

        const videoInfo = await createBunnyVideo(title);
        const directUpload = getBunnyDirectUploadUrl(videoInfo.guid);

        return directUpload; // { videoGuid, uploadUrl, accessKey }
    }

    // Step 2: client has finished uploading directly to Bunny; save the resource record
    async completeVideoUpload(lessonId: string, videoGuid: string, title: string, fileSizeBytes: number) {
        const lesson = await prisma.lessons.findUnique({ where: { id: lessonId } });
        if (!lesson) throw new ApiError("Lesson not found", STATUS_CODES.NOT_FOUND);

        const embedUrl = getBunnyEmbedUrl(videoGuid);
        const thumbnailUrl = getBunnyThumbnailUrl(videoGuid);

        return prisma.resource.create({
            data: {
                lessonId,
                title,
                category: "VIDEO",
                type: "bunny-stream",
                url: embedUrl,// this is the URL that can be embedded in the frontend video player
                bunnyVideoId: videoGuid,
                size: fileSizeBytes.toString(),
                description: thumbnailUrl || undefined,
            },
        });
    }

    async deleteResource(resourceId: string) {
        const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
        if (!resource) throw new ApiError("Resource not found", STATUS_CODES.NOT_FOUND);

        if (resource.category === "VIDEO" && resource.bunnyVideoId) {
            await deleteBunnyVideo(resource.bunnyVideoId).catch(() => {});
        }

        return prisma.resource.delete({ where: { id: resourceId } });
    }
}

// ─── Public Course Service ────────────────────────────────────────────────────

export class PublicCourseService {
    async getCourses() {
        return prisma.courses.findMany({
            where: { isPublished: true },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                _count: { select: { lessons: true, enrollments: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    async getCourseBySlug(slug: string) {
        const course = await prisma.courses.findUnique({
            where: { slug, isPublished: true },
            include: {
                category: { select: { id: true, name: true } },
                lessons: {
                    include: {
                        resources: {
                            select: {
                                id: true,
                                title: true,
                                category: true,
                                type: true,
                                url: true,
                                size: true,
                                bunnyVideoId: true,
                            },
                        },
                    },
                    orderBy: { weekNumber: "asc" },
                },
                _count: { select: { enrollments: true } },
            },
        });
        if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
        return course;
    }

    // ─── Enrollment ───────────────────────────────────────────────────────────

    /** Accepts either a UUID (course id) or a slug — always returns the course record */
    private async resolveCourse(slugOrId: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
            || /^[a-z0-9]{20,}$/.test(slugOrId); // cuid

        const course = isUuid
            ? await prisma.courses.findFirst({ where: { OR: [{ id: slugOrId }, { slug: slugOrId }], isPublished: true } })
            : await prisma.courses.findUnique({ where: { slug: slugOrId, isPublished: true } });

        if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
        return course;
    }

    async enrollUser(slugOrId: string, userId: string) {
        const course = await this.resolveCourse(slugOrId);

        if (course.price > 0) {
            throw new ApiError("Paid course enrollment is not yet supported", STATUS_CODES.BAD_REQUEST);
        }

        const existing = await prisma.courseUserMapper.findUnique({
            where: { userId_courseId: { userId, courseId: course.id } },
        });
        if (existing) throw new ApiError("Already enrolled in this course", STATUS_CODES.CONFLICT);

        return prisma.courseUserMapper.create({
            data: { userId, courseId: course.id },
        });
    }

    async unenrollUser(slugOrId: string, userId: string) {
        const course = await this.resolveCourse(slugOrId);

        const enrollment = await prisma.courseUserMapper.findUnique({
            where: { userId_courseId: { userId, courseId: course.id } },
        });
        if (!enrollment) throw new ApiError("Enrollment not found", STATUS_CODES.NOT_FOUND);

        return prisma.courseUserMapper.delete({
            where: { userId_courseId: { userId, courseId: course.id } },
        });
    }

    async getMyEnrollments(userId: string) {
        return prisma.courseUserMapper.findMany({
            where: { userId },
            include: {
                course: {
                    include: {
                        category: { select: { id: true, name: true, slug: true } },
                        _count: { select: { lessons: true, enrollments: true } },
                    },
                },
            },
            orderBy: { enrolledAt: "desc" },
        });
    }

    async getEnrolledCourseDetail(slugOrId: string, userId: string) {
        const course = await this.resolveCourse(slugOrId);

        const enrollment = await prisma.courseUserMapper.findUnique({
            where: { userId_courseId: { userId, courseId: course.id } },
        });
        if (!enrollment) throw new ApiError("You are not enrolled in this course", STATUS_CODES.FORBIDDEN);

        const full = await prisma.courses.findUnique({
            where: { id: course.id },
            include: {
                category: { select: { id: true, name: true } },
                lessons: {
                    include: { resources: true },
                    orderBy: { weekNumber: "asc" },
                },
                _count: { select: { enrollments: true } },
            },
        });
        if (!full) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

        const lessonsWithDownload = full.lessons.map((lesson) => ({
            ...lesson,
            resources: lesson.resources.map((r) => {
                let downloadUrl: string | null = null;
                if (r.category === "VIDEO" && r.bunnyVideoId) {
                    const mp4 = getBunnyMp4Url(r.bunnyVideoId);
                    downloadUrl = mp4 || null;
                } else {
                    downloadUrl = r.url;
                }
                return { ...r, downloadUrl };
            }),
        }));

        return { ...full, lessons: lessonsWithDownload, enrollment };
    }

    async checkEnrollment(slugOrId: string, userId: string) {
        const course = await this.resolveCourse(slugOrId);

        const enrollment = await prisma.courseUserMapper.findUnique({
            where: { userId_courseId: { userId, courseId: course.id } },
        });
        return { enrolled: !!enrollment, enrollment: enrollment ?? null };
    }

    async prepareResourceDownload(resourceId: string, userId: string) {
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId },
            include: { lesson: { select: { courseId: true } } },
        });
        if (!resource) throw new ApiError("Resource not found", STATUS_CODES.NOT_FOUND);

        const enrollment = await prisma.courseUserMapper.findUnique({
            where: { userId_courseId: { userId, courseId: resource.lesson.courseId } },
        });
        if (!enrollment) {
            throw new ApiError("You are not enrolled in this course", STATUS_CODES.FORBIDDEN);
        }

        const safeBase =
            resource.title
                .replace(/[^\w\s.-]/g, "")
                .trim()
                .replace(/\s+/g, "-") || "download";

        if (resource.category === "VIDEO" && resource.bunnyVideoId) {
            const mp4 = getBunnyMp4Url(resource.bunnyVideoId);
            if (!mp4) {
                throw new ApiError("Video download is not configured", STATUS_CODES.SERVER_ERROR);
            }
            return {
                sourceUrl: mp4,
                filename: `${safeBase}.mp4`,
                contentType: "video/mp4",
            };
        }

        const extMatch = resource.url.match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i);
        const ext = extMatch?.[1]?.toLowerCase();
        return {
            sourceUrl: resource.url,
            filename: ext ? `${safeBase}.${ext}` : safeBase,
            contentType: "application/octet-stream",
        };
    }

    async streamResourceDownload(resourceId: string, userId: string) {
        const { sourceUrl, filename, contentType } = await this.prepareResourceDownload(resourceId, userId);

        const upstream = await fetch(sourceUrl);
        if (!upstream.ok) {
            throw new ApiError("Failed to fetch file for download", STATUS_CODES.SERVER_ERROR);
        }
        if (!upstream.body) {
            throw new ApiError("Empty file response", STATUS_CODES.SERVER_ERROR);
        }

        return {
            filename,
            contentType: upstream.headers.get("content-type") ?? contentType,
            contentLength: upstream.headers.get("content-length"),
            stream: Readable.fromWeb(upstream.body as unknown as NodeReadableStream),
        };
    }
}

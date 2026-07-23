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
import { getCourseFileUploadSignature } from "@/utils/cloudinary.js";
import { Readable } from "stream";
import { ReadableStream as NodeReadableStream } from "stream/web";
import {
  CreateCategoryBody,
  CreateCourseBody,
  UpdateCourseBody,
  CreateLessonBody,
  UpdateLessonBody,
  CreateTopicBody,
  UpdateTopicBody,
  CompleteFileUploadBody,
} from "./course.types.js";
import {
  getSubmittedAssessmentIds,
  isAttemptSubmitted,
} from "./assessment/assessment.service.js";

const DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "txt",
  "csv",
]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);

const inferResourceCategory = (
  filenameOrType: string,
): "DOCUMENT" | "IMAGE" | "OTHER" => {
  const ext = filenameOrType.split(/[.\s]/).pop()?.toLowerCase() ?? "";
  if (DOCUMENT_EXTENSIONS.has(ext)) return "DOCUMENT";
  if (IMAGE_EXTENSIONS.has(ext)) return "IMAGE";
  return "OTHER";
};

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
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });
    if (existing)
      throw new ApiError(
        "Category with this slug already exists",
        STATUS_CODES.CONFLICT,
      );

    return prisma.category.create({ data });
  }

  async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }

  // Courses
  async getAllCourses(take?: number, skip?: number) {
    const courses = await prisma.courses.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.courses.count();
    return { courses, totalRecords };
  }

  async getCourseById(id: string) {
    const course = await prisma.courses.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        lessons: {
          include: {
            resources: true,
            topics: {
              include: { resources: true },
              orderBy: { topicOrder: "asc" },
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

  async createCourse(data: CreateCourseBody, createdBy: string) {
    const slug = slugify(data.title);

    const slugExists = await prisma.courses.findUnique({ where: { slug } });
    if (slugExists)
      throw new ApiError(
        "A course with a similar title already exists",
        STATUS_CODES.CONFLICT,
      );

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category)
      throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);

    const { whatYouLearn, audience, ...rest } = data;
    return prisma.courses.create({
      data: {
        ...rest,
        slug,
        createdBy,
        ...(whatYouLearn !== undefined && {
          whatYouLearn: whatYouLearn as object[],
        }),
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
        ...(whatYouLearn !== undefined && {
          whatYouLearn: whatYouLearn as object[],
        }),
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
    if (existing)
      throw new ApiError(
        "A lesson for this week already exists",
        STATUS_CODES.CONFLICT,
      );

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

  // Topics ---------------------------------------------------------------------

  async createTopic(lessonId: string, data: CreateTopicBody) {
    const lesson = await prisma.lessons.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new ApiError("Lesson not found", STATUS_CODES.NOT_FOUND);

    const existing = await prisma.topics.findUnique({
      where: { lessonId_topicOrder: { lessonId, topicOrder: data.topicOrder } },
    });
    if (existing)
      throw new ApiError(
        "A topic with this order already exists in this week",
        STATUS_CODES.CONFLICT,
      );

    return prisma.topics.create({ data: { ...data, lessonId } });
  }

  async updateTopic(topicId: string, data: UpdateTopicBody) {
    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) throw new ApiError("Topic not found", STATUS_CODES.NOT_FOUND);

    return prisma.topics.update({ where: { id: topicId }, data });
  }

  async deleteTopic(topicId: string) {
    const topic = await prisma.topics.findUnique({
      where: { id: topicId },
      include: { resources: true },
    });
    if (!topic) throw new ApiError("Topic not found", STATUS_CODES.NOT_FOUND);

    for (const resource of topic.resources) {
      if (resource.category === "VIDEO" && resource.bunnyVideoId) {
        await deleteBunnyVideo(resource.bunnyVideoId).catch(() => {});
      }
    }

    return prisma.topics.delete({ where: { id: topicId } });
  }

  // Video Upload (two-step direct upload, scoped to a topic) -------------------

  // Step 1: create a Bunny slot, return credentials for the client to upload directly
  async initVideoUpload(topicId: string, title: string) {
    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) throw new ApiError("Topic not found", STATUS_CODES.NOT_FOUND);

    const videoInfo = await createBunnyVideo(title);
    const directUpload = getBunnyDirectUploadUrl(videoInfo.guid);

    return directUpload; // { videoGuid, uploadUrl, accessKey }
  }

  // Step 2: client has finished uploading directly to Bunny; save the resource record
  async completeVideoUpload(
    topicId: string,
    videoGuid: string,
    title: string,
    fileSizeBytes: number,
  ) {
    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) throw new ApiError("Topic not found", STATUS_CODES.NOT_FOUND);

    const embedUrl = getBunnyEmbedUrl(videoGuid);
    const thumbnailUrl = getBunnyThumbnailUrl(videoGuid);

    return prisma.resource.create({
      data: {
        lessonId: topic.lessonId,
        topicId,
        title,
        category: "VIDEO",
        type: "bunny-stream",
        url: embedUrl, // this is the URL that can be embedded in the frontend video player
        bunnyVideoId: videoGuid,
        size: fileSizeBytes.toString(),
        description: thumbnailUrl || undefined,
      },
    });
  }

  // File Upload (direct-to-Cloudinary, scoped to a topic) ----------------------

  getFileUploadSignature() {
    return getCourseFileUploadSignature();
  }

  async completeFileUpload(topicId: string, data: CompleteFileUploadBody) {
    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) throw new ApiError("Topic not found", STATUS_CODES.NOT_FOUND);

    return prisma.resource.create({
      data: {
        lessonId: topic.lessonId,
        topicId,
        title: data.title,
        category: inferResourceCategory(data.type || data.title),
        type: data.type,
        url: data.url,
        size: data.size?.toString(),
      },
    });
  }

  async deleteResource(resourceId: string) {
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });
    if (!resource)
      throw new ApiError("Resource not found", STATUS_CODES.NOT_FOUND);

    if (resource.category === "VIDEO" && resource.bunnyVideoId) {
      await deleteBunnyVideo(resource.bunnyVideoId).catch(() => {});
    }

    return prisma.resource.delete({ where: { id: resourceId } });
  }
}

// ─── Public Course Service ────────────────────────────────────────────────────

export class PublicCourseService {
  async getCourses(take?: number, skip?: number) {
    const courses = await prisma.courses.findMany({
      where: { isPublished: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { lessons: true, enrollments: true } },
      },
      orderBy: { createdAt: "asc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.courses.count({
      where: { isPublished: true },
    });
    return { courses, totalRecords };
  }

  async getHeroCourses() {
    return prisma.courses.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 3,
      include: {
        category: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
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
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slugOrId,
      ) || /^[a-z0-9]{20,}$/.test(slugOrId); // cuid

    const course = isUuid
      ? await prisma.courses.findFirst({
          where: {
            OR: [{ id: slugOrId }, { slug: slugOrId }],
            isPublished: true,
          },
        })
      : await prisma.courses.findUnique({
          where: { slug: slugOrId, isPublished: true },
        });

    if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
    return course;
  }

  async enrollUser(slugOrId: string, userId: string) {
    const course = await this.resolveCourse(slugOrId);

    if (course.price > 0) {
      throw new ApiError(
        "Paid course enrollment is not yet supported",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const existing = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (existing)
      throw new ApiError(
        "Already enrolled in this course",
        STATUS_CODES.CONFLICT,
      );

    return prisma.courseUserMapper.create({
      data: { userId, courseId: course.id },
    });
  }

  async unenrollUser(slugOrId: string, userId: string) {
    const course = await this.resolveCourse(slugOrId);

    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (!enrollment)
      throw new ApiError("Enrollment not found", STATUS_CODES.NOT_FOUND);

    return prisma.courseUserMapper.delete({
      where: { userId_courseId: { userId, courseId: course.id } },
    });
  }

  async getMyEnrollments(userId: string, take?: number, skip?: number) {
    const enrollments = await prisma.courseUserMapper.findMany({
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
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.courseUserMapper.count({
      where: { userId },
    });
    return { enrollments, totalRecords };
  }

  async getEnrolledCourseDetail(slugOrId: string, userId: string) {
    const course = await this.resolveCourse(slugOrId);

    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (!enrollment)
      throw new ApiError(
        "You are not enrolled in this course",
        STATUS_CODES.FORBIDDEN,
      );

    const full = await prisma.courses.findUnique({
      where: { id: course.id },
      include: {
        category: { select: { id: true, name: true } },
        lessons: {
          include: {
            resources: true,
            topics: {
              include: { resources: true },
              orderBy: { topicOrder: "asc" },
            },
          },
          orderBy: { weekNumber: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!full) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

    const orderedLessons = [...full.lessons].sort(
      (a, b) => a.weekNumber - b.weekNumber,
    );

    const topicIds = orderedLessons.flatMap((l) => l.topics.map((t) => t.id));
    const topicProgressRows =
      topicIds.length > 0
        ? await prisma.topicProgress.findMany({
            where: { userId, topicId: { in: topicIds } },
          })
        : [];
    const completedTopicIds = new Set(topicProgressRows.map((p) => p.topicId));

    const courseAssessments = await prisma.assessment.findMany({
      where: { courseId: course.id, isPublished: true },
      select: {
        id: true,
        type: true,
        lessonId: true,
        title: true,
        description: true,
        questionCount: true,
        timeLimitMinutes: true,
        passingScorePercent: true,
        maxTabSwitchWarnings: true,
        _count: { select: { questions: true } },
      },
    });
    const weeklyByLessonId = new Map(
      courseAssessments
        .filter((a) => a.type === "WEEKLY" && a.lessonId)
        .map((a) => [a.lessonId!, a]),
    );
    const finalAssessmentRow =
      courseAssessments.find((a) => a.type === "FINAL") ?? null;

    const assessmentIds = courseAssessments.map((a) => a.id);
    const attempts =
      assessmentIds.length > 0
        ? await prisma.assessmentAttempt.findMany({
            where: { userId, assessmentId: { in: assessmentIds } },
            orderBy: { attemptNumber: "desc" },
          })
        : [];

    const attemptsByAssessment = new Map<string, typeof attempts>();
    for (const a of attempts) {
      const list = attemptsByAssessment.get(a.assessmentId) ?? [];
      list.push(a);
      attemptsByAssessment.set(a.assessmentId, list);
    }

    const pickActionableAttempt = (assessmentId: string) => {
      const list = attemptsByAssessment.get(assessmentId) ?? [];
      return (
        list.find((a) => a.status === "IN_PROGRESS") ??
        list.find((a) => isAttemptSubmitted(a.status)) ??
        null
      );
    };

    const submittedAssessmentIds = new Set(
      attempts
        .filter((a) => isAttemptSubmitted(a.status))
        .map((a) => a.assessmentId),
    );

    const buildAssessmentCard = (
      assessment: (typeof courseAssessments)[number] | null,
      topicsComplete: boolean,
      allWeekliesSubmitted: boolean,
    ) => {
      if (!assessment) return null;
      const attempt = pickActionableAttempt(assessment.id);
      const list = attemptsByAssessment.get(assessment.id) ?? [];
      const terminal = list.filter((a) => isAttemptSubmitted(a.status));
      const bestPercent =
        terminal.length > 0
          ? Math.max(...terminal.map((a) => a.scorePercent ?? 0))
          : null;

      let unlockStatus: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" =
        "LOCKED";
      let lockReason: string | null = null;

      if (attempt?.status === "IN_PROGRESS") {
        unlockStatus = "IN_PROGRESS";
      } else if (assessment.type === "WEEKLY") {
        if (topicsComplete) {
          unlockStatus = "AVAILABLE";
        } else {
          lockReason = "Complete this week's topics to unlock.";
        }
      } else if (allWeekliesSubmitted) {
        unlockStatus = "AVAILABLE";
      } else {
        lockReason = "Complete all weekly assessments to unlock.";
      }

      return {
        id: assessment.id,
        type: assessment.type,
        title: assessment.title,
        description: assessment.description,
        questionCount: assessment._count.questions || assessment.questionCount,
        expectedQuestionCount: assessment.questionCount,
        timeLimitMinutes: assessment.timeLimitMinutes,
        passingScorePercent: assessment.passingScorePercent,
        maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
        unlockStatus,
        lockReason,
        totalAttempts: terminal.length,
        bestScorePercent: bestPercent,
        attempt: attempt
          ? {
              id: attempt.id,
              status: attempt.status,
              attemptNumber: attempt.attemptNumber,
              score: attempt.score,
              maxScore: attempt.maxScore,
              scorePercent: attempt.scorePercent,
              isPassed: attempt.isPassed,
              submittedAt: attempt.submittedAt,
            }
          : null,
      };
    };

    const resolveResource = <
      T extends { category: string; bunnyVideoId: string | null; url: string },
    >(
      r: T,
      locked: boolean,
    ) => {
      if (locked) return { ...r, url: null, downloadUrl: null };
      const downloadUrl =
        r.category === "VIDEO" && r.bunnyVideoId
          ? getBunnyMp4Url(r.bunnyVideoId) || null
          : r.url;
      return { ...r, downloadUrl };
    };

    let previousLessonCompleted = true; // week 1 is always unlocked
    const lessonsWithState = orderedLessons.map((lesson) => {
      const weekLocked = !previousLessonCompleted;

      let previousTopicCompleted = true;
      const topicsWithState = lesson.topics.map((topic) => {
        const isCompleted = completedTopicIds.has(topic.id);
        const isLocked = weekLocked || !previousTopicCompleted;
        previousTopicCompleted = isCompleted;
        return {
          ...topic,
          isCompleted,
          isLocked,
          resources: topic.resources.map((r) => resolveResource(r, isLocked)),
        };
      });

      const topicsComplete =
        topicsWithState.length > 0 &&
        topicsWithState.every((t) => t.isCompleted);

      const weekly = weeklyByLessonId.get(lesson.id) ?? null;
      const weeklySubmitted = weekly
        ? submittedAssessmentIds.has(weekly.id)
        : true;

      // Week complete = all topics done AND weekly assessment submitted (if published)
      const lessonCompleted = topicsComplete && weeklySubmitted;
      previousLessonCompleted = lessonCompleted;

      const resources = lesson.resources.map((r) =>
        resolveResource(r, weekLocked),
      );

      return {
        ...lesson,
        isCompleted: lessonCompleted,
        topicsComplete,
        isLocked: weekLocked,
        resources,
        topics: topicsWithState,
        weeklyAssessment: buildAssessmentCard(weekly, topicsComplete, false),
      };
    });

    const publishedWeeklies = courseAssessments.filter((a) => a.type === "WEEKLY");
    const allWeekliesSubmitted =
      publishedWeeklies.length === 0
        ? lessonsWithState.every((l) => l.topicsComplete)
        : publishedWeeklies.every((w) => submittedAssessmentIds.has(w.id));

    const finalAssessment = buildAssessmentCard(
      finalAssessmentRow,
      false,
      allWeekliesSubmitted,
    );

    return {
      ...full,
      lessons: lessonsWithState,
      enrollment,
      finalAssessment,
    };
  }

  // ─── Topic progress / locking ──────────────────────────────────────────────

  private async getOrderedLessonsWithTopics(courseId: string) {
    return prisma.lessons.findMany({
      where: { courseId },
      orderBy: { weekNumber: "asc" },
      include: {
        topics: { orderBy: { topicOrder: "asc" }, select: { id: true } },
        weeklyAssessment: {
          select: { id: true, isPublished: true, type: true },
        },
      },
    });
  }

  private async getCompletedTopicIds(
    userId: string,
    topicIds: string[],
  ): Promise<Set<string>> {
    if (topicIds.length === 0) return new Set();
    const rows = await prisma.topicProgress.findMany({
      where: { userId, topicId: { in: topicIds } },
    });
    return new Set(rows.map((r) => r.topicId));
  }

  /** Previous week is complete only when all its topics are done and its weekly assessment (if published) is submitted. */
  private async isPreviousWeekFullyComplete(
    userId: string,
    prevLesson: {
      topics: { id: string }[];
      weeklyAssessment: { id: string; isPublished: boolean } | null;
    },
  ): Promise<boolean> {
    const prevTopicIds = prevLesson.topics.map((t) => t.id);
    if (prevTopicIds.length === 0) return false;

    const completed = await this.getCompletedTopicIds(userId, prevTopicIds);
    if (prevTopicIds.some((id) => !completed.has(id))) return false;

    const weekly = prevLesson.weeklyAssessment;
    if (!weekly?.isPublished) return true;

    const submitted = await getSubmittedAssessmentIds(userId, [weekly.id]);
    return submitted.has(weekly.id);
  }

  /** A week is locked until the previous week is fully complete (topics + weekly assessment). */
  private async isLessonLocked(
    courseId: string,
    lessonId: string,
    userId: string,
  ): Promise<boolean> {
    const lessons = await this.getOrderedLessonsWithTopics(courseId);
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return false;

    const prevComplete = await this.isPreviousWeekFullyComplete(
      userId,
      lessons[idx - 1],
    );
    return !prevComplete;
  }

  /** A topic is locked if its week is locked, or the previous topic in the same week isn't done yet. */
  private async isTopicLocked(
    courseId: string,
    lessonId: string,
    topicId: string,
    userId: string,
  ): Promise<boolean> {
    const weekLocked = await this.isLessonLocked(courseId, lessonId, userId);
    if (weekLocked) return true;

    const lessons = await this.getOrderedLessonsWithTopics(courseId);
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return true;

    const idx = lesson.topics.findIndex((t) => t.id === topicId);
    if (idx <= 0) return false;

    const completed = await this.getCompletedTopicIds(userId, [
      lesson.topics[idx - 1].id,
    ]);
    return !completed.has(lesson.topics[idx - 1].id);
  }

  private async recalculateProgress(userId: string, courseId: string) {
    const lessons = await this.getOrderedLessonsWithTopics(courseId);
    const allTopicIds = lessons.flatMap((l) => l.topics.map((t) => t.id));

    const publishedWeeklies = lessons
      .map((l) => l.weeklyAssessment)
      .filter(
        (a): a is NonNullable<typeof a> & { isPublished: true } =>
          Boolean(a?.isPublished),
      );
    const finalAssessment = await prisma.assessment.findFirst({
      where: { courseId, type: "FINAL", isPublished: true },
      select: { id: true },
    });

    const assessmentUnits = [
      ...publishedWeeklies.map((w) => w.id),
      ...(finalAssessment ? [finalAssessment.id] : []),
    ];
    const total = allTopicIds.length + assessmentUnits.length;
    if (total === 0) return;

    const completedTopics = await prisma.topicProgress.count({
      where: { userId, topicId: { in: allTopicIds } },
    });
    const submittedAssessments = await getSubmittedAssessmentIds(
      userId,
      assessmentUnits,
    );
    const completedCount = completedTopics + submittedAssessments.size;

    const progress = Math.round((completedCount / total) * 100);
    // Course complete when all topics + all published weekly assessments are done
    const weekUnits = allTopicIds.length + publishedWeeklies.length;
    const isCompleted =
      weekUnits > 0 &&
      completedTopics === allTopicIds.length &&
      publishedWeeklies.every((w) => submittedAssessments.has(w.id));

    const mapper = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    await prisma.courseUserMapper.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        progress,
        isCompleted,
        completedAt: isCompleted ? (mapper?.completedAt ?? new Date()) : null,
      },
    });
  }

  /** Recalculate progress after an assessment attempt is submitted. */
  async recalculateProgressAfterAssessment(userId: string, courseId: string) {
    await this.recalculateProgress(userId, courseId);
  }

  async markTopicWatched(topicId: string, userId: string) {
    const topic = await prisma.topics.findUnique({ where: { id: topicId } });
    if (!topic) throw new ApiError("Topic not found", STATUS_CODES.NOT_FOUND);

    const lesson = await prisma.lessons.findUnique({
      where: { id: topic.lessonId },
    });
    if (!lesson) throw new ApiError("Lesson not found", STATUS_CODES.NOT_FOUND);

    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
    });
    if (!enrollment) {
      throw new ApiError(
        "You are not enrolled in this course",
        STATUS_CODES.FORBIDDEN,
      );
    }

    const locked = await this.isTopicLocked(
      lesson.courseId,
      lesson.id,
      topicId,
      userId,
    );
    if (locked) {
      throw new ApiError(
        "Complete the previous topic first",
        STATUS_CODES.FORBIDDEN,
      );
    }

    await prisma.topicProgress.upsert({
      where: { userId_topicId: { userId, topicId } },
      create: { userId, topicId },
      update: {},
    });

    await this.recalculateProgress(userId, lesson.courseId);

    return prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
    });
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
      include: { lesson: { select: { id: true, courseId: true } } },
    });
    if (!resource)
      throw new ApiError("Resource not found", STATUS_CODES.NOT_FOUND);

    const enrollment = await prisma.courseUserMapper.findUnique({
      where: {
        userId_courseId: { userId, courseId: resource.lesson.courseId },
      },
    });
    if (!enrollment) {
      throw new ApiError(
        "You are not enrolled in this course",
        STATUS_CODES.FORBIDDEN,
      );
    }

    // Resources created before topics existed have no topicId — fall back to
    // the week-level lock so those legacy rows keep working.
    const locked = resource.topicId
      ? await this.isTopicLocked(
          resource.lesson.courseId,
          resource.lesson.id,
          resource.topicId,
          userId,
        )
      : await this.isLessonLocked(
          resource.lesson.courseId,
          resource.lesson.id,
          userId,
        );
    if (locked) {
      throw new ApiError(
        "Complete the previous session first",
        STATUS_CODES.FORBIDDEN,
      );
    }

    const safeBase =
      resource.title
        .replace(/[^\w\s.-]/g, "")
        .trim()
        .replace(/\s+/g, "-") || "download";

    if (resource.category === "VIDEO" && resource.bunnyVideoId) {
      const mp4 = getBunnyMp4Url(resource.bunnyVideoId);
      if (!mp4) {
        throw new ApiError(
          "Video download is not configured",
          STATUS_CODES.SERVER_ERROR,
        );
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
    const { sourceUrl, filename, contentType } =
      await this.prepareResourceDownload(resourceId, userId);

    const upstream = await fetch(sourceUrl);
    if (!upstream.ok) {
      throw new ApiError(
        "Failed to fetch file for download",
        STATUS_CODES.SERVER_ERROR,
      );
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

  async getCertificateData(slugOrId: string, userId: string) {
    const course = await this.resolveCourse(slugOrId);

    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (!enrollment)
      throw new ApiError(
        "You are not enrolled in this course",
        STATUS_CODES.FORBIDDEN,
      );
    if (!enrollment.isCompleted)
      throw new ApiError(
        "Course not completed yet",
        STATUS_CODES.BAD_REQUEST,
      );
    if (!course.certificate)
      throw new ApiError(
        "Certificate is not available for this course",
        STATUS_CODES.BAD_REQUEST,
      );

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const studentName =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "Student";

    return {
      studentName,
      courseTitle: course.title,
      completedAt: enrollment.completedAt ?? new Date(),
      certificateId:
        `AVT-${course.id.slice(-6)}-${userId.slice(-6)}`.toUpperCase(),
    };
  }
}

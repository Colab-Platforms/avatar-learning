import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  D2H_INTERNSHIP_FOLDER,
  deleteFromCloudinary,
  getD2HInternshipUploadSignature,
} from "@/utils/cloudinary.js";
import type {
  AdminInternshipTaskDto,
  AdminStudentInternshipProgressDto,
  AdminStudentInternshipTaskDto,
  CreateInternshipTaskInput,
  InternshipDerivedStatus,
  InternshipProgressSummary,
  InternshipSubmissionDto,
  InternshipSubmissionStatus,
  InternshipTaskAttachmentDto,
  ReviewSubmissionInput,
  StudentInternshipDashboardDto,
  StudentInternshipTaskDto,
  SubmitInternshipTaskInput,
  UpdateInternshipTaskInput,
} from "./internship.types.js";

type TaskWithRelations = {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  shortDescription: string;
  detailedInstructions: string;
  expectedDeliverables: string;
  estimatedHours: number | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  attachments: {
    id: string;
    url: string;
    publicId: string;
    originalFilename: string;
    mimeType: string;
    size: number;
  }[];
  submissions?: {
    id: string;
    status: InternshipSubmissionStatus;
    studentNotes: string | null;
    adminFeedback: string | null;
    submittedAt: Date;
    reviewedAt: Date | null;
    attachments: {
      id: string;
      kind: "FILE" | "LINK";
      label: string | null;
      url: string;
      publicId: string | null;
      originalFilename: string | null;
      mimeType: string | null;
      size: number | null;
    }[];
  }[];
};

function mapTaskAttachment(
  a: TaskWithRelations["attachments"][number],
): InternshipTaskAttachmentDto {
  return {
    id: a.id,
    url: a.url,
    publicId: a.publicId,
    originalFilename: a.originalFilename,
    mimeType: a.mimeType,
    size: a.size,
  };
}

function mapSubmission(
  s: NonNullable<TaskWithRelations["submissions"]>[number],
): InternshipSubmissionDto {
  return {
    id: s.id,
    status: s.status,
    studentNotes: s.studentNotes,
    adminFeedback: s.adminFeedback,
    submittedAt: s.submittedAt,
    reviewedAt: s.reviewedAt,
    attachments: s.attachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      label: a.label,
      url: a.url,
      publicId: a.publicId,
      originalFilename: a.originalFilename,
      mimeType: a.mimeType,
      size: a.size,
    })),
  };
}

function assertPublicIdInFolder(publicId: string) {
  if (!publicId.startsWith(`${D2H_INTERNSHIP_FOLDER}/`)) {
    throw new ApiError(
      "Invalid upload. File must be uploaded via the internship upload endpoint.",
      STATUS_CODES.BAD_REQUEST,
    );
  }
}

function computeUnlockMap(
  tasksAscending: { weekNumber: number; id: string }[],
  submissionByTaskId: Map<string, { status: InternshipSubmissionStatus }>,
): Map<string, boolean> {
  const unlockMap = new Map<string, boolean>();
  const sorted = [...tasksAscending].sort(
    (a, b) => a.weekNumber - b.weekNumber,
  );

  for (let i = 0; i < sorted.length; i++) {
    const task = sorted[i];
    if (i === 0) {
      unlockMap.set(task.id, true);
      continue;
    }
    const prev = sorted[i - 1];
    const prevSub = submissionByTaskId.get(prev.id);
    unlockMap.set(task.id, prevSub?.status === "APPROVED");
  }
  return unlockMap;
}

function toDerivedStatus(
  isUnlocked: boolean,
  submissionStatus: InternshipSubmissionStatus | null,
): InternshipDerivedStatus {
  if (!isUnlocked) return "LOCKED";
  if (!submissionStatus) return "AVAILABLE";
  return submissionStatus;
}

function toBackendStatus(
  submissionStatus: InternshipSubmissionStatus | null,
): "NOT_STARTED" | InternshipSubmissionStatus {
  return submissionStatus ?? "NOT_STARTED";
}

function summarizeProgress(
  tasks: { derivedStatus: InternshipDerivedStatus }[],
): InternshipProgressSummary {
  let approved = 0;
  let underReview = 0;
  let available = 0;
  let locked = 0;

  for (const t of tasks) {
    switch (t.derivedStatus) {
      case "APPROVED":
        approved++;
        break;
      case "UNDER_REVIEW":
        underReview++;
        break;
      case "AVAILABLE":
      case "CHANGES_REQUESTED":
        available++;
        break;
      case "LOCKED":
        locked++;
        break;
    }
  }

  return {
    approved,
    underReview,
    available,
    locked,
    total: tasks.length,
    approvedCount: approved,
  };
}

export class InternshipService {
  getUploadSignature() {
    return getD2HInternshipUploadSignature();
  }

  private async assertDirect2HireCourse(courseId: string) {
    const course = await prisma.courses.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        isDirect2HireCourse: true,
      },
    });
    if (!course) {
      throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
    }
    if (!course.isDirect2HireCourse) {
      throw new ApiError(
        "Internship tasks are only available for Direct2Hire courses",
        STATUS_CODES.BAD_REQUEST,
      );
    }
    return course;
  }

  private async assertPaidEnrollment(userId: string) {
    const enrollment = await prisma.direct2HireEnrollment.findFirst({
      where: { userId, status: "PAID" },
      orderBy: { createdAt: "desc" },
    });
    if (!enrollment) {
      throw new ApiError(
        "Direct2Hire enrollment required",
        STATUS_CODES.FORBIDDEN,
      );
    }
    return enrollment;
  }

  private async getSelectedCourseForUser(userId: string) {
    const booking = await prisma.counsellingBooking.findUnique({
      where: { userId },
      select: {
        selectedCourseId: true,
        selectedCourse: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    return booking?.selectedCourse ?? null;
  }

  // ─── Admin task CRUD ───────────────────────────────────────────────────────

  async listAdminTasks(courseId: string): Promise<AdminInternshipTaskDto[]> {
    await this.assertDirect2HireCourse(courseId);

    const tasks = await prisma.internshipTask.findMany({
      where: { courseId },
      include: { attachments: { orderBy: { createdAt: "asc" } } },
      orderBy: { weekNumber: "asc" },
    });

    return tasks.map((t) => ({
      id: t.id,
      courseId: t.courseId,
      weekNumber: t.weekNumber,
      title: t.title,
      shortDescription: t.shortDescription,
      detailedInstructions: t.detailedInstructions,
      expectedDeliverables: t.expectedDeliverables,
      estimatedHours: t.estimatedHours,
      isPublished: t.isPublished,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      attachments: t.attachments.map(mapTaskAttachment),
    }));
  }

  async createAdminTask(
    courseId: string,
    data: CreateInternshipTaskInput,
  ): Promise<AdminInternshipTaskDto> {
    await this.assertDirect2HireCourse(courseId);

    for (const a of data.attachments ?? []) {
      assertPublicIdInFolder(a.publicId);
    }

    const existingCount = await prisma.internshipTask.count({
      where: { courseId },
    });
    if (existingCount >= 8) {
      throw new ApiError(
        "A course can have at most 8 internship tasks",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    try {
      const task = await prisma.internshipTask.create({
        data: {
          courseId,
          weekNumber: data.weekNumber,
          title: data.title,
          shortDescription: data.shortDescription,
          detailedInstructions: data.detailedInstructions,
          expectedDeliverables: data.expectedDeliverables,
          estimatedHours: data.estimatedHours ?? null,
          isPublished: data.isPublished ?? false,
          attachments: data.attachments?.length
            ? {
                create: data.attachments.map((a) => ({
                  url: a.url,
                  publicId: a.publicId,
                  originalFilename: a.originalFilename,
                  mimeType: a.mimeType,
                  size: a.size,
                })),
              }
            : undefined,
        },
        include: { attachments: { orderBy: { createdAt: "asc" } } },
      });

      return {
        id: task.id,
        courseId: task.courseId,
        weekNumber: task.weekNumber,
        title: task.title,
        shortDescription: task.shortDescription,
        detailedInstructions: task.detailedInstructions,
        expectedDeliverables: task.expectedDeliverables,
        estimatedHours: task.estimatedHours,
        isPublished: task.isPublished,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        attachments: task.attachments.map(mapTaskAttachment),
      };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        throw new ApiError(
          `Week ${data.weekNumber} already has a task for this course`,
          STATUS_CODES.CONFLICT,
        );
      }
      throw err;
    }
  }

  async updateAdminTask(
    taskId: string,
    data: UpdateInternshipTaskInput,
  ): Promise<AdminInternshipTaskDto> {
    const existing = await prisma.internshipTask.findUnique({
      where: { id: taskId },
      include: { attachments: true },
    });
    if (!existing) {
      throw new ApiError("Internship task not found", STATUS_CODES.NOT_FOUND);
    }

    for (const a of data.attachments ?? []) {
      assertPublicIdInFolder(a.publicId);
    }

    try {
      const task = await prisma.$transaction(async (tx) => {
        if (data.attachments !== undefined) {
          const oldPublicIds = existing.attachments.map((a) => a.publicId);
          await tx.internshipTaskAttachment.deleteMany({
            where: { taskId },
          });
          if (data.attachments.length > 0) {
            await tx.internshipTaskAttachment.createMany({
              data: data.attachments.map((a) => ({
                taskId,
                url: a.url,
                publicId: a.publicId,
                originalFilename: a.originalFilename,
                mimeType: a.mimeType,
                size: a.size,
              })),
            });
          }
          // Best-effort cleanup of removed Cloudinary assets
          const kept = new Set(data.attachments.map((a) => a.publicId));
          for (const publicId of oldPublicIds) {
            if (!kept.has(publicId)) {
              await deleteFromCloudinary(publicId, "raw").catch(() =>
                deleteFromCloudinary(publicId, "image"),
              );
            }
          }
        }

        return tx.internshipTask.update({
          where: { id: taskId },
          data: {
            ...(data.weekNumber !== undefined && {
              weekNumber: data.weekNumber,
            }),
            ...(data.title !== undefined && { title: data.title }),
            ...(data.shortDescription !== undefined && {
              shortDescription: data.shortDescription,
            }),
            ...(data.detailedInstructions !== undefined && {
              detailedInstructions: data.detailedInstructions,
            }),
            ...(data.expectedDeliverables !== undefined && {
              expectedDeliverables: data.expectedDeliverables,
            }),
            ...(data.estimatedHours !== undefined && {
              estimatedHours: data.estimatedHours,
            }),
            ...(data.isPublished !== undefined && {
              isPublished: data.isPublished,
            }),
          },
          include: { attachments: { orderBy: { createdAt: "asc" } } },
        });
      });

      return {
        id: task.id,
        courseId: task.courseId,
        weekNumber: task.weekNumber,
        title: task.title,
        shortDescription: task.shortDescription,
        detailedInstructions: task.detailedInstructions,
        expectedDeliverables: task.expectedDeliverables,
        estimatedHours: task.estimatedHours,
        isPublished: task.isPublished,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        attachments: task.attachments.map(mapTaskAttachment),
      };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        throw new ApiError(
          `Week ${data.weekNumber} already has a task for this course`,
          STATUS_CODES.CONFLICT,
        );
      }
      throw err;
    }
  }

  async deleteAdminTask(taskId: string): Promise<void> {
    const existing = await prisma.internshipTask.findUnique({
      where: { id: taskId },
      include: { attachments: true },
    });
    if (!existing) {
      throw new ApiError("Internship task not found", STATUS_CODES.NOT_FOUND);
    }

    await prisma.internshipTask.delete({ where: { id: taskId } });

    for (const a of existing.attachments) {
      await deleteFromCloudinary(a.publicId, "raw").catch(() =>
        deleteFromCloudinary(a.publicId, "image"),
      );
    }
  }

  async reviewSubmission(
    submissionId: string,
    adminUserId: string,
    data: ReviewSubmissionInput,
  ) {
    const submission = await prisma.internshipSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: { select: { id: true, weekNumber: true, courseId: true } },
      },
    });

    if (!submission) {
      throw new ApiError("Submission not found", STATUS_CODES.NOT_FOUND);
    }

    if (submission.status !== "UNDER_REVIEW") {
      throw new ApiError(
        "Only submissions under review can be reviewed",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const updated = await prisma.internshipSubmission.update({
      where: { id: submissionId },
      data: {
        status: data.status,
        adminFeedback: data.adminFeedback?.trim() || null,
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
      },
      include: {
        attachments: true,
        task: {
          select: {
            id: true,
            weekNumber: true,
            title: true,
            shortDescription: true,
          },
        },
      },
    });

    return updated;
  }

  // ─── Student ───────────────────────────────────────────────────────────────

  private buildStudentTaskDto(
    task: TaskWithRelations,
    isUnlocked: boolean,
  ): StudentInternshipTaskDto {
    const submission = task.submissions?.[0] ?? null;
    const submissionStatus = submission?.status ?? null;
    return {
      id: task.id,
      weekNumber: task.weekNumber,
      title: task.title,
      shortDescription: task.shortDescription,
      detailedInstructions: task.detailedInstructions,
      expectedDeliverables: task.expectedDeliverables,
      estimatedHours: task.estimatedHours,
      isUnlocked,
      derivedStatus: toDerivedStatus(isUnlocked, submissionStatus),
      backendStatus: toBackendStatus(submissionStatus),
      submission: submission ? mapSubmission(submission) : null,
      attachments: task.attachments.map(mapTaskAttachment),
    };
  }

  async getStudentDashboard(
    userId: string,
  ): Promise<StudentInternshipDashboardDto> {
    await this.assertPaidEnrollment(userId);
    const course = await this.getSelectedCourseForUser(userId);

    if (!course) {
      return {
        course: null,
        progress: {
          approved: 0,
          underReview: 0,
          available: 0,
          locked: 0,
          total: 0,
          approvedCount: 0,
        },
        tasks: [],
      };
    }

    const tasks = await prisma.internshipTask.findMany({
      where: { courseId: course.id, isPublished: true },
      include: {
        attachments: { orderBy: { createdAt: "asc" } },
        submissions: {
          where: { userId },
          take: 1,
          include: { attachments: { orderBy: { createdAt: "asc" } } },
        },
      },
      orderBy: { weekNumber: "asc" },
    });

    const submissionByTaskId = new Map(
      tasks
        .filter((t) => t.submissions[0])
        .map((t) => [t.id, { status: t.submissions[0]!.status }]),
    );
    const unlockMap = computeUnlockMap(tasks, submissionByTaskId);

    const taskDtos = tasks.map((t) =>
      this.buildStudentTaskDto(t, unlockMap.get(t.id) ?? false),
    );

    return {
      course,
      progress: summarizeProgress(taskDtos),
      tasks: taskDtos,
    };
  }

  async getStudentTask(
    userId: string,
    taskId: string,
  ): Promise<StudentInternshipTaskDto> {
    await this.assertPaidEnrollment(userId);
    const course = await this.getSelectedCourseForUser(userId);
    if (!course) {
      throw new ApiError(
        "Select a Direct2Hire course before accessing internship tasks",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const task = await prisma.internshipTask.findFirst({
      where: { id: taskId, courseId: course.id, isPublished: true },
      include: {
        attachments: { orderBy: { createdAt: "asc" } },
        submissions: {
          where: { userId },
          take: 1,
          include: { attachments: { orderBy: { createdAt: "asc" } } },
        },
      },
    });

    if (!task) {
      throw new ApiError("Task not found", STATUS_CODES.NOT_FOUND);
    }

    // Need siblings to compute unlock correctly
    const siblings = await prisma.internshipTask.findMany({
      where: { courseId: course.id, isPublished: true },
      select: {
        id: true,
        weekNumber: true,
        submissions: {
          where: { userId },
          select: { status: true },
          take: 1,
        },
      },
      orderBy: { weekNumber: "asc" },
    });

    const submissionByTaskId = new Map(
      siblings
        .filter((t) => t.submissions[0])
        .map((t) => [t.id, { status: t.submissions[0]!.status }]),
    );
    const unlockMap = computeUnlockMap(siblings, submissionByTaskId);
    const isUnlocked = unlockMap.get(task.id) ?? false;

    if (!isUnlocked) {
      throw new ApiError(
        "This task is locked. Complete the previous week first.",
        STATUS_CODES.FORBIDDEN,
      );
    }

    return this.buildStudentTaskDto(task, true);
  }

  async submitTask(
    userId: string,
    taskId: string,
    data: SubmitInternshipTaskInput,
  ): Promise<InternshipSubmissionDto> {
    await this.assertPaidEnrollment(userId);
    const course = await this.getSelectedCourseForUser(userId);
    if (!course) {
      throw new ApiError(
        "Select a Direct2Hire course before submitting internship work",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    for (const f of data.files ?? []) {
      assertPublicIdInFolder(f.publicId);
    }

    const task = await prisma.internshipTask.findFirst({
      where: { id: taskId, courseId: course.id },
      select: { id: true, weekNumber: true, isPublished: true, courseId: true },
    });

    if (!task) {
      throw new ApiError("Task not found", STATUS_CODES.NOT_FOUND);
    }
    if (!task.isPublished) {
      throw new ApiError(
        "Cannot submit to an unpublished task",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const siblings = await prisma.internshipTask.findMany({
      where: { courseId: course.id, isPublished: true },
      select: {
        id: true,
        weekNumber: true,
        submissions: {
          where: { userId },
          select: { id: true, status: true },
          take: 1,
        },
      },
      orderBy: { weekNumber: "asc" },
    });

    const submissionByTaskId = new Map(
      siblings
        .filter((t) => t.submissions[0])
        .map((t) => [t.id, { status: t.submissions[0]!.status }]),
    );
    const unlockMap = computeUnlockMap(siblings, submissionByTaskId);

    if (!unlockMap.get(task.id)) {
      throw new ApiError(
        "This task is locked. Complete the previous week first.",
        STATUS_CODES.FORBIDDEN,
      );
    }

    const existing = siblings.find((t) => t.id === task.id)?.submissions[0];

    if (existing?.status === "UNDER_REVIEW") {
      throw new ApiError(
        "Submission is under review and cannot be edited",
        STATUS_CODES.BAD_REQUEST,
      );
    }
    if (existing?.status === "APPROVED") {
      throw new ApiError(
        "This task is already approved",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const files = data.files ?? [];
    const links = data.links ?? [];
    const notes = data.studentNotes?.trim() || null;

    const result = await prisma.$transaction(async (tx) => {
      if (existing) {
        const oldAttachments = await tx.internshipSubmissionAttachment.findMany(
          {
            where: { submissionId: existing.id },
          },
        );
        await tx.internshipSubmissionAttachment.deleteMany({
          where: { submissionId: existing.id },
        });

        const updated = await tx.internshipSubmission.update({
          where: { id: existing.id },
          data: {
            status: "UNDER_REVIEW",
            studentNotes: notes,
            adminFeedback: null,
            submittedAt: new Date(),
            reviewedAt: null,
            reviewedBy: null,
            attachments: {
              create: [
                ...files.map((f) => ({
                  kind: "FILE" as const,
                  url: f.url,
                  publicId: f.publicId,
                  originalFilename: f.originalFilename,
                  mimeType: f.mimeType,
                  size: f.size,
                })),
                ...links.map((l) => ({
                  kind: "LINK" as const,
                  url: l.url,
                  label: l.label?.trim() || null,
                })),
              ],
            },
          },
          include: { attachments: { orderBy: { createdAt: "asc" } } },
        });

        // Cleanup old Cloudinary files after replace
        for (const a of oldAttachments) {
          if (a.kind === "FILE" && a.publicId) {
            await deleteFromCloudinary(a.publicId, "raw").catch(() =>
              deleteFromCloudinary(a.publicId!, "image"),
            );
          }
        }

        return updated;
      }

      return tx.internshipSubmission.create({
        data: {
          taskId: task.id,
          userId,
          status: "UNDER_REVIEW",
          studentNotes: notes,
          attachments: {
            create: [
              ...files.map((f) => ({
                kind: "FILE" as const,
                url: f.url,
                publicId: f.publicId,
                originalFilename: f.originalFilename,
                mimeType: f.mimeType,
                size: f.size,
              })),
              ...links.map((l) => ({
                kind: "LINK" as const,
                url: l.url,
                label: l.label?.trim() || null,
              })),
            ],
          },
        },
        include: { attachments: { orderBy: { createdAt: "asc" } } },
      });
    });

    return mapSubmission(result);
  }

  async getAdminStudentProgress(
    userId: string,
  ): Promise<AdminStudentInternshipProgressDto> {
    const course = await this.getSelectedCourseForUser(userId);

    if (!course) {
      return {
        course: null,
        progress: {
          approved: 0,
          underReview: 0,
          available: 0,
          locked: 0,
          total: 0,
          approvedCount: 0,
        },
        tasks: [],
      };
    }

    const tasks = await prisma.internshipTask.findMany({
      where: { courseId: course.id },
      include: {
        submissions: {
          where: { userId },
          take: 1,
          include: { attachments: { orderBy: { createdAt: "asc" } } },
        },
      },
      orderBy: { weekNumber: "asc" },
    });

    // Unlock is based on published sequence for student-facing rules;
    // admin sees all tasks but unlock calc uses published siblings order.
    const published = tasks.filter((t) => t.isPublished);
    const submissionByTaskId = new Map(
      published
        .filter((t) => t.submissions[0])
        .map((t) => [t.id, { status: t.submissions[0]!.status }]),
    );
    const unlockMap = computeUnlockMap(published, submissionByTaskId);

    const taskDtos: AdminStudentInternshipTaskDto[] = tasks.map((t) => {
      const sub = t.submissions[0] ?? null;
      const isUnlocked = t.isPublished
        ? (unlockMap.get(t.id) ?? false)
        : false;
      const derivedStatus = t.isPublished
        ? toDerivedStatus(isUnlocked, sub?.status ?? null)
        : ("LOCKED" as InternshipDerivedStatus);

      return {
        taskId: t.id,
        weekNumber: t.weekNumber,
        title: t.title,
        shortDescription: t.shortDescription,
        isPublished: t.isPublished,
        isUnlocked,
        derivedStatus,
        backendStatus: toBackendStatus(sub?.status ?? null),
        submittedAt: sub?.submittedAt ?? null,
        reviewedAt: sub?.reviewedAt ?? null,
        studentNotes: sub?.studentNotes ?? null,
        adminFeedback: sub?.adminFeedback ?? null,
        submissionId: sub?.id ?? null,
        attachments:
          sub?.attachments.map((a) => ({
            id: a.id,
            kind: a.kind,
            label: a.label,
            url: a.url,
            publicId: a.publicId,
            originalFilename: a.originalFilename,
            mimeType: a.mimeType,
            size: a.size,
          })) ?? [],
      };
    });

    return {
      course,
      progress: summarizeProgress(
        taskDtos.filter((t) => t.isPublished).map((t) => ({
          derivedStatus: t.derivedStatus,
        })),
      ),
      tasks: taskDtos,
    };
  }
}

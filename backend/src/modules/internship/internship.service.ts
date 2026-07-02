import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  CreateInternshipBody,
  UpdateInternshipBody,
  ApplicationStatus,
} from "./internship.types.js";

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/^-|-$/g, "");

// ─── Admin Service ────────────────────────────────────────────────────────────

export class AdminInternshipService {
  async getAll(take?: number, skip?: number) {
    const internships = await prisma.internship.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.internship.count();
    return { internships, totalRecords };
  }

  async getById(id: string) {
    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!internship)
      throw new ApiError("Internship not found", STATUS_CODES.NOT_FOUND);
    return internship;
  }

  async create(data: CreateInternshipBody, createdBy: string) {
    const slug = slugify(data.title);

    const slugExists = await prisma.internship.findUnique({ where: { slug } });
    if (slugExists)
      throw new ApiError(
        "An internship with a similar title already exists",
        STATUS_CODES.CONFLICT,
      );

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category)
      throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);

    return prisma.internship.create({
      data: {
        ...data,
        slug,
        createdBy,
        keyLearningOutcomes: data.keyLearningOutcomes as object[],
        majorProject: data.majorProject as object[],
        whatYouReceive: data.whatYouReceive as object[],
      },
      include: {
        category: true,
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: UpdateInternshipBody) {
    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship)
      throw new ApiError("Internship not found", STATUS_CODES.NOT_FOUND);

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category)
        throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);
    }

    return prisma.internship.update({
      where: { id },
      data: {
        ...data,
        keyLearningOutcomes: data.keyLearningOutcomes as object[] | undefined,
        majorProject: data.majorProject as object[] | undefined,
        whatYouReceive: data.whatYouReceive as object[] | undefined,
      },
      include: { category: true },
    });
  }

  async delete(id: string) {
    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship)
      throw new ApiError("Internship not found", STATUS_CODES.NOT_FOUND);

    return prisma.internship.delete({ where: { id } });
  }

  async togglePublish(id: string) {
    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship)
      throw new ApiError("Internship not found", STATUS_CODES.NOT_FOUND);

    return prisma.internship.update({
      where: { id },
      data: { isPublished: !internship.isPublished },
      include: { category: true },
    });
  }

  async getApplications(internshipId: string, take?: number, skip?: number) {
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });
    if (!internship)
      throw new ApiError("Internship not found", STATUS_CODES.NOT_FOUND);

    const applications = await prisma.internshipApplication.findMany({
      where: { internshipId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.internshipApplication.count({
      where: { internshipId },
    });

    return { applications, totalRecords };
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
  ) {
    const application = await prisma.internshipApplication.findUnique({
      where: { id: applicationId },
      include: { internship: true, user: true },
    });
    if (!application)
      throw new ApiError("Application not found", STATUS_CODES.NOT_FOUND);

    return prisma.internshipApplication.update({
      where: { id: applicationId },
      data: { status },
      include: { internship: true, user: true },
    });
  }
}

// ─── Public Service ───────────────────────────────────────────────────────────

export class PublicInternshipService {
  async getPublished(
    take?: number,
    skip?: number,
    categoryId?: string,
  ) {
    const internships = await prisma.internship.findMany({
      where: {
        isPublished: true,
        ...(categoryId && { categoryId }),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.internship.count({
      where: {
        isPublished: true,
        ...(categoryId && { categoryId }),
      },
    });

    return { internships, totalRecords };
  }

  async getBySlug(slug: string) {
    const internship = await prisma.internship.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!internship || !internship.isPublished)
      throw new ApiError("Internship not found", STATUS_CODES.NOT_FOUND);

    return internship;
  }

  async apply(internshipId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.resumeUrl) {
      throw new ApiError(
        "Please upload your resume before applying",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });
    if (!internship || !internship.isPublished)
      throw new ApiError("Internship not found", STATUS_CODES.NOT_FOUND);

    const existing = await prisma.internshipApplication.findUnique({
      where: { userId_internshipId: { userId, internshipId } },
    });
    if (existing)
      throw new ApiError(
        "You have already applied for this internship",
        STATUS_CODES.CONFLICT,
      );

    return prisma.internshipApplication.create({
      data: { internshipId, userId },
      include: { internship: true, user: true },
    });
  }

  async withdrawApplication(internshipId: string, userId: string) {
    const application = await prisma.internshipApplication.findUnique({
      where: { userId_internshipId: { userId, internshipId } },
    });
    if (!application)
      throw new ApiError("Application not found", STATUS_CODES.NOT_FOUND);

    return prisma.internshipApplication.delete({
      where: { id: application.id },
    });
  }

  async checkApplication(internshipId: string, userId: string) {
    const application = await prisma.internshipApplication.findUnique({
      where: { userId_internshipId: { userId, internshipId } },
    });

    return {
      applied: !!application,
      application: application ?? null,
    };
  }

  async getMyApplications(
    userId: string,
    take?: number,
    skip?: number,
  ) {
    const applications = await prisma.internshipApplication.findMany({
      where: { userId },
      include: {
        internship: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { appliedAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.internshipApplication.count({
      where: { userId },
    });

    return { applications, totalRecords };
  }
}

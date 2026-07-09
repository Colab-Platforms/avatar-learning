import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  CreateDocumentBody,
  UpdateDocumentBody,
} from "./investor.types.js";

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/^-|-$/g, "");

// ─── Admin Service ────────────────────────────────────────────────────────────

export class AdminInvestorService {
  // Categories

  async getCategories() {
    return prisma.investorCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { documents: true } } },
    });
  }

  async createCategory(data: CreateCategoryBody) {
    const slug = slugify(data.slug || data.name);

    const exists = await prisma.investorCategory.findUnique({ where: { slug } });
    if (exists)
      throw new ApiError(
        "A category with this slug already exists",
        STATUS_CODES.CONFLICT,
      );

    return prisma.investorCategory.create({
      data: {
        name: data.name,
        slug,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { _count: { select: { documents: true } } },
    });
  }

  async updateCategory(id: string, data: UpdateCategoryBody) {
    const category = await prisma.investorCategory.findUnique({ where: { id } });
    if (!category)
      throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);

    const slug = data.slug ? slugify(data.slug) : undefined;
    if (slug && slug !== category.slug) {
      const duplicate = await prisma.investorCategory.findUnique({ where: { slug } });
      if (duplicate)
        throw new ApiError(
          "A category with this slug already exists",
          STATUS_CODES.CONFLICT,
        );
    }

    return prisma.investorCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(slug !== undefined && { slug }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { _count: { select: { documents: true } } },
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.investorCategory.findUnique({ where: { id } });
    if (!category)
      throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);

    // Cascades to delete every document in this category (see schema.prisma)
    return prisma.investorCategory.delete({ where: { id } });
  }

  // Documents

  async getDocuments(categoryId?: string, take?: number, skip?: number) {
    const where = {
      deletedAt: null,
      ...(categoryId && { categoryId }),
    };

    const [documents, totalRecords] = await Promise.all([
      prisma.investorDocument.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { category: { select: { id: true, name: true } } },
        ...(take !== undefined && { take }),
        ...(skip !== undefined && { skip }),
      }),
      prisma.investorDocument.count({ where }),
    ]);

    return { documents, totalRecords };
  }

  async createDocument(data: CreateDocumentBody, createdById: string) {
    const category = await prisma.investorCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category)
      throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);

    return prisma.investorDocument.create({
      data: {
        name: data.name,
        url: data.url,
        categoryId: data.categoryId,
        createdById,
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async updateDocument(id: string, data: UpdateDocumentBody) {
    const document = await prisma.investorDocument.findFirst({
      where: { id, deletedAt: null },
    });
    if (!document)
      throw new ApiError("Document not found", STATUS_CODES.NOT_FOUND);

    if (data.categoryId) {
      const category = await prisma.investorCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category)
        throw new ApiError("Category not found", STATUS_CODES.NOT_FOUND);
    }

    return prisma.investorDocument.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      },
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async deleteDocument(id: string) {
    const document = await prisma.investorDocument.findFirst({
      where: { id, deletedAt: null },
    });
    if (!document)
      throw new ApiError("Document not found", STATUS_CODES.NOT_FOUND);

    return prisma.investorDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

// ─── Public Service ───────────────────────────────────────────────────────────

export class PublicInvestorService {
  async getCategoriesWithDocuments() {
    return prisma.investorCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, url: true },
        },
      },
    });
  }
}

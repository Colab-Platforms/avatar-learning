import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  CreateDocumentBody,
  UpdateDocumentBody,
} from "./investor.types.js";
import { v2 as cloudinary } from "cloudinary";
import { checkInvestorDocUrl, INVESTOR_DOC_MAX_BYTES } from "./investor.url.js";

/** Rejects unsafe/broken URLs; for files on our Cloudinary account also verifies they exist and are within the size limit. */
export async function assertInvestorDocUrl(url: string): Promise<void> {
  const check = checkInvestorDocUrl(url, process.env.CLOUDINARY_CLOUD_NAME);
  if (!check.ok) throw new ApiError(check.reason, STATUS_CODES.BAD_REQUEST);
  if (!check.cloudinaryPublicId) return;
  let bytes: number;
  try {
    const r = await cloudinary.api.resource(check.cloudinaryPublicId, { resource_type: "raw" });
    bytes = Number(r.bytes);
  } catch (e: any) {
    if (e?.http_code === 404 || e?.error?.http_code === 404)
      throw new ApiError("Uploaded file was not found in storage", STATUS_CODES.BAD_REQUEST);
    throw new ApiError("Could not verify the uploaded file, please try again", STATUS_CODES.SERVICE_UNAVAILABLE);
  }
  if (bytes > INVESTOR_DOC_MAX_BYTES) {
    await cloudinary.uploader.destroy(check.cloudinaryPublicId, { resource_type: "raw" }).catch(() => {});
    throw new ApiError("File is too large (max 20 MB)", STATUS_CODES.BAD_REQUEST);
  }
}

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

    await assertInvestorDocUrl(data.url);

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

    if (data.url !== undefined && data.url !== document.url) await assertInvestorDocUrl(data.url);

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
          select: { id: true, name: true, url: true, createdAt: true },
        },
      },
    });
  }
}

import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type {
  CreateCounsellingProfileInput,
  UpdateCounsellingProfileInput,
} from "./counselling.types.js";

export class CounsellingService {
  async getByUserId(userId: string) {
    return prisma.counsellingProfile.findUnique({
      where: { userId },
    });
  }

  async create(userId: string, data: CreateCounsellingProfileInput) {
    const existing = await prisma.counsellingProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ApiError(
        "Counselling profile already exists",
        STATUS_CODES.CONFLICT,
      );
    }

    return prisma.counsellingProfile.create({
      data: {
        userId,
        ...data,
        isSubmitted: true,
        submittedAt: new Date(),
      },
    });
  }

  async update(userId: string, data: UpdateCounsellingProfileInput) {
    const existing = await prisma.counsellingProfile.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new ApiError(
        "Counselling profile not found",
        STATUS_CODES.NOT_FOUND,
      );
    }
    if (existing.isSubmitted) {
      throw new ApiError(
        "Submitted counselling profile cannot be edited",
        STATUS_CODES.FORBIDDEN,
      );
    }

    return prisma.counsellingProfile.update({
      where: { userId },
      data,
    });
  }
}

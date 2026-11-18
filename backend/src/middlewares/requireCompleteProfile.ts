import { Response, NextFunction } from "express";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "./authMiddleware.js";

/**
 * Blocks authenticated users who have not finished Google profile onboarding.
 * Must run after `auth(...)`. Allowlisted endpoints (complete-profile, logout,
 * getMe, refresh) should not use this middleware.
 */
export const requireCompleteProfile = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      throw new ApiError("Authentication required", STATUS_CODES.UNAUTHORIZED);
    }

    const user = await prisma.user.findFirst({
      where: { id: req.user.id, isDeleted: false },
      select: { profileCompleted: true },
    });

    if (!user) {
      throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);
    }

    if (!user.profileCompleted) {
      throw new ApiError(
        "Please complete your profile before continuing.",
        STATUS_CODES.FORBIDDEN,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

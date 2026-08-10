import { Response, NextFunction } from "express";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  direct2hireService,
  hasAssessmentCounsellingAccess,
} from "./direct2hire.service.js";

export async function requireAssessmentCounsellingAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const enrollment = await direct2hireService.getOrCreateEnrollment(
      req.user!.id,
    );
    if (!hasAssessmentCounsellingAccess(enrollment)) {
      sendResponse(
        res,
        false,
        null,
        "Purchase the Assessment + Counselling (₹99) or the full Direct2Hire programme to continue.",
        402,
      );
      return;
    }
    next();
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to verify access",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
}

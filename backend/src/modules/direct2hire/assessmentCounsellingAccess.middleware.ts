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

// Stricter gate for the actual post-enrollment journey (internship tasks,
// mock interview, job placement tracking) — the ₹99 Assessment + Counselling
// add-on does NOT unlock these, only a fully paid Direct2Hire enrollment (₹4999)
// does. The ₹499 course-only purchase never creates a Direct2HireEnrollment at
// all, so it is blocked here the same way an unpaid user is.
export async function requireDirect2HireAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const enrollment = await direct2hireService.getOrCreateEnrollment(
      req.user!.id,
    );
    if (enrollment.status !== "PAID") {
      sendResponse(
        res,
        false,
        null,
        "Enroll in the full Direct2Hire programme to access this.",
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

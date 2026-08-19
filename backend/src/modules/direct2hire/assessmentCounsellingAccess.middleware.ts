import { Response, NextFunction } from "express";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  direct2hireService,
  hasAssessmentCounsellingAccess,
  hasDirect2HireAccess,
  hasInternshipAccess,
  hasJobPlacementAccess,
} from "./direct2hire.service.js";

export async function requireDirect2HireAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const enrollment = await direct2hireService.getOrCreateEnrollment(
      req.user!.id,
    );
    if (!hasDirect2HireAccess(enrollment)) {
      sendResponse(
        res,
        false,
        null,
        "Purchase the Assessment + Counselling (₹99) or a Direct2Hire plan to continue.",
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

export async function requireInternshipAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const enrollment = await direct2hireService.getOrCreateEnrollment(
      req.user!.id,
    );
    if (!hasInternshipAccess(enrollment)) {
      sendResponse(
        res,
        false,
        null,
        "Upgrade to the Standard or Pro Direct2Hire plan to unlock the internship.",
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

export async function requireJobPlacementAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const enrollment = await direct2hireService.getOrCreateEnrollment(
      req.user!.id,
    );
    if (!hasJobPlacementAccess(enrollment)) {
      sendResponse(
        res,
        false,
        null,
        "Upgrade to the Pro Direct2Hire plan to unlock job placement.",
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

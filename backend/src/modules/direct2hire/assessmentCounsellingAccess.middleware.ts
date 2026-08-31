import { Response, NextFunction } from "express";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  direct2hireService,
  hasAssessmentCounsellingAccess,
} from "./direct2hire.service.js";

/**
 * Direct2Hire is now bought per course, so every gated request has to say which
 * course it is for. We read it only from places the caller sets deliberately —
 * never from a bare `:id` path param, which on these routers is a task or
 * submission id and would silently resolve to the wrong (or no) enrollment.
 */
function readCourseId(req: AuthRequest): string | undefined {
  const raw =
    (req.query?.courseId as string | undefined) ??
    (req.body?.courseId as string | undefined) ??
    (req.params?.courseId as string | undefined);
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Shared gate. `predicate` decides what counts as sufficient access for the
 * enrollment on this specific course.
 *
 * This path is read-only on purpose: it runs on every gated request, so it must
 * never create a Direct2HireEnrollment as a side effect of merely looking.
 */
function buildGate(
  predicate: (enrollment: {
    status: string;
    assessmentCounsellingPaidAt: Date | null;
  }) => boolean,
  denialMessage: string,
) {
  return async function gate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const requestedCourseId = readCourseId(req);

      // The client is not required to name a course yet. Almost every student
      // has exactly one D2H enrollment, so resolve it for them; only a student
      // with several is asked to be explicit. This keeps the existing
      // /direct2hire pages working while they migrate to per-course routes.
      const resolved = await direct2hireService.resolveEnrollmentForRequest(
        req.user!.id,
        requestedCourseId,
      );

      if (resolved.ambiguous) {
        sendResponse(
          res,
          false,
          null,
          "You have Direct2Hire access to more than one course — specify courseId.",
          STATUS_CODES.BAD_REQUEST,
        );
        return;
      }

      const enrollment = resolved.enrollment;

      if (!enrollment || !predicate(enrollment)) {
        sendResponse(res, false, null, denialMessage, 402);
        return;
      }

      // Hand the verified course id to the controllers so they don't re-read
      // it from the request and risk disagreeing with what was gated.
      req.d2hCourseId = enrollment.courseId;
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
  };
}

export const requireAssessmentCounsellingAccess = buildGate(
  hasAssessmentCounsellingAccess,
  "Purchase the Assessment + Counselling (₹99) or the full Direct2Hire programme for this course to continue.",
);

// Stricter gate for the post-enrollment journey (internship tasks, mock
// interview, job placement). The ₹99 add-on does NOT unlock these, and neither
// does a ₹499 BASIC course purchase — only a fully paid ₹4999 Direct2Hire
// enrollment on this same course does.
export const requireDirect2HireAccess = buildGate(
  (enrollment) => enrollment.status === "PAID",
  "Enroll in the full Direct2Hire programme for this course to access this.",
);

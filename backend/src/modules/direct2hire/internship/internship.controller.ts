import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { InternshipService } from "./internship.service.js";
import {
  validateCourseIdParam,
  validateCreateInternshipTask,
  validateReviewSubmission,
  validateSubmissionIdParam,
  validateSubmitInternshipTask,
  validateTaskIdParam,
  validateUpdateInternshipTask,
} from "./internship.validator.js";

const service = new InternshipService();

function joiMessage(error: { details?: { message: string }[]; message?: string }) {
  return error.details?.[0]?.message ?? error.message ?? "Validation failed";
}

// ─── Shared upload signature ─────────────────────────────────────────────────

export const getUploadSignature = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const signature = service.getUploadSignature();
    sendResponse(res, true, signature, "Upload signature generated");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to generate upload signature",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

export const listAdminTasks = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCourseIdParam(req.params);
    if (error) {
      sendResponse(res, false, null, joiMessage(error), STATUS_CODES.BAD_REQUEST);
      return;
    }
    const tasks = await service.listAdminTasks(value.courseId);
    sendResponse(res, true, tasks, "Internship tasks fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch internship tasks",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const createAdminTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const param = validateCourseIdParam(req.params);
    if (param.error) {
      sendResponse(
        res,
        false,
        null,
        joiMessage(param.error),
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const { error, value } = validateCreateInternshipTask(req.body);
    if (error) {
      sendResponse(res, false, null, joiMessage(error), STATUS_CODES.BAD_REQUEST);
      return;
    }
    const task = await service.createAdminTask(param.value.courseId, value);
    sendResponse(res, true, task, "Internship task created", STATUS_CODES.CREATED);
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to create internship task",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const updateAdminTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const param = validateTaskIdParam(req.params);
    if (param.error) {
      sendResponse(
        res,
        false,
        null,
        joiMessage(param.error),
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const { error, value } = validateUpdateInternshipTask(req.body);
    if (error) {
      sendResponse(res, false, null, joiMessage(error), STATUS_CODES.BAD_REQUEST);
      return;
    }
    const task = await service.updateAdminTask(param.value.taskId, value);
    sendResponse(res, true, task, "Internship task updated");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to update internship task",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const deleteAdminTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const param = validateTaskIdParam(req.params);
    if (param.error) {
      sendResponse(
        res,
        false,
        null,
        joiMessage(param.error),
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    await service.deleteAdminTask(param.value.taskId);
    sendResponse(res, true, null, "Internship task deleted");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to delete internship task",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const reviewSubmission = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const param = validateSubmissionIdParam(req.params);
    if (param.error) {
      sendResponse(
        res,
        false,
        null,
        joiMessage(param.error),
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const { error, value } = validateReviewSubmission(req.body);
    if (error) {
      sendResponse(res, false, null, joiMessage(error), STATUS_CODES.BAD_REQUEST);
      return;
    }
    const submission = await service.reviewSubmission(
      param.value.submissionId,
      req.user!.id,
      value,
    );
    sendResponse(res, true, submission, "Submission reviewed");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to review submission",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

// ─── Student ─────────────────────────────────────────────────────────────────

export const getMyTasks = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const dashboard = await service.getStudentDashboard(req.user!.id);
    sendResponse(res, true, dashboard, "Internship tasks fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch internship tasks",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getMyTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const param = validateTaskIdParam(req.params);
    if (param.error) {
      sendResponse(
        res,
        false,
        null,
        joiMessage(param.error),
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const task = await service.getStudentTask(
      req.user!.id,
      param.value.taskId,
    );
    sendResponse(res, true, task, "Internship task fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch internship task",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const submitTask = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const param = validateTaskIdParam(req.params);
    if (param.error) {
      sendResponse(
        res,
        false,
        null,
        joiMessage(param.error),
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const { error, value } = validateSubmitInternshipTask(req.body);
    if (error) {
      sendResponse(res, false, null, joiMessage(error), STATUS_CODES.BAD_REQUEST);
      return;
    }
    const submission = await service.submitTask(
      req.user!.id,
      param.value.taskId,
      value,
    );
    sendResponse(
      res,
      true,
      submission,
      "Internship work submitted",
      STATUS_CODES.CREATED,
    );
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to submit internship work",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

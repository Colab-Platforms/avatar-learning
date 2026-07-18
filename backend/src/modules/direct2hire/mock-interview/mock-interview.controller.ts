import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { MockInterviewService } from "./mock-interview.service.js";
import {
  validatePublishMockInterviewFeedback,
  validateScheduleMockInterview,
} from "./mock-interview.validator.js";
import { validateStudentUserIdParam } from "../admin/admin.validator.js";

const service = new MockInterviewService();

export const getMyInterview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const bundle = await service.getBundle(req.user!.id);
    sendResponse(res, true, bundle, "Mock interview fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch mock interview",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const requestInterview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const interview = await service.request(req.user!.id);
    sendResponse(
      res,
      true,
      interview,
      "Mock interview requested successfully",
      STATUS_CODES.CREATED,
    );
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to request mock interview",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getStudentInterview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateStudentUserIdParam(req.params);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const bundle = await service.getAdminBundle(value.userId);
    sendResponse(res, true, bundle, "Student mock interview fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch student mock interview",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const scheduleInterview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error: paramError, value: params } = validateStudentUserIdParam(
      req.params,
    );
    if (paramError) {
      sendResponse(
        res,
        false,
        null,
        paramError.message,
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }

    const { error, value } = validateScheduleMockInterview(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const interview = await service.schedule(params.userId, value);
    sendResponse(res, true, interview, "Mock interview scheduled");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to schedule mock interview",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const markInterviewCompleted = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateStudentUserIdParam(req.params);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const interview = await service.markCompleted(value.userId);
    sendResponse(res, true, interview, "Mock interview marked as completed");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to mark mock interview completed",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const publishInterviewFeedback = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error: paramError, value: params } = validateStudentUserIdParam(
      req.params,
    );
    if (paramError) {
      sendResponse(
        res,
        false,
        null,
        paramError.message,
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }

    const { error, value } = validatePublishMockInterviewFeedback(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const interview = await service.publishFeedback(params.userId, value);
    sendResponse(res, true, interview, "Mock interview feedback published");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to publish mock interview feedback",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const cancelInterview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateStudentUserIdParam(req.params);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const interview = await service.cancel(value.userId);
    sendResponse(res, true, interview, "Mock interview cancelled");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to cancel mock interview",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

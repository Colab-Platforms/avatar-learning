import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { AdminPlacementService, UserPlacementService } from "./placement.service.js";
import {
  validateCreatePlacementAssessment,
  validateUpdatePlacementAssessment,
  validateCreatePlacementQuestion,
  validateUpdatePlacementQuestion,
  validateSavePlacementAnswer,
  validateGrantPlacementAttempts,
} from "./placement.validators.js";

const adminService = new AdminPlacementService();
const userService = new UserPlacementService();

const param = (req: Request, key: string): string => String(req.params[key]);

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const adminGetAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await adminService.getAssessmentForAdmin(param(req, "courseId"));
    sendResponse(res, true, assessment, "Placement assessment fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const createAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreatePlacementAssessment(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const assessment = await adminService.createAssessment(param(req, "courseId"), value);
    sendResponse(res, true, assessment, "Placement assessment created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const updateAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateUpdatePlacementAssessment(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const assessment = await adminService.updateAssessment(param(req, "assessmentId"), value);
    sendResponse(res, true, assessment, "Placement assessment updated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const deleteAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteAssessment(param(req, "assessmentId"));
    sendResponse(res, true, null, "Placement assessment deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const toggleAssessmentPublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await adminService.togglePublish(param(req, "assessmentId"));
    sendResponse(res, true, assessment, `Placement assessment ${assessment.isPublished ? "published" : "unpublished"}`);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreatePlacementQuestion(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const question = await adminService.createQuestion(param(req, "assessmentId"), value);
    sendResponse(res, true, question, "Question created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateUpdatePlacementQuestion(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const question = await adminService.updateQuestion(param(req, "questionId"), value);
    sendResponse(res, true, question, "Question updated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteQuestion(param(req, "questionId"));
    sendResponse(res, true, null, "Question deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const listAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const attempts = await adminService.listAttempts(param(req, "assessmentId"));
    sendResponse(res, true, attempts, "Attempts fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getAttemptDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const attempt = await adminService.getAttemptDetail(param(req, "attemptId"));
    sendResponse(res, true, attempt, "Attempt fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const resetAttempt = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.resetAttempt(param(req, "attemptId"));
    sendResponse(res, true, null, "Attempt reset");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getStudentPlacementSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await adminService.getStudentPlacementSummary(param(req, "userId"));
    sendResponse(res, true, summary, "Placement summary fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getStudentPlacementAttempts = async (req: Request, res: Response): Promise<void> => {
  try {
    const attempts = await adminService.getStudentPlacementAttempts(param(req, "userId"));
    sendResponse(res, true, attempts, "Placement attempts fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getStudentPlacementOverrides = async (req: Request, res: Response): Promise<void> => {
  try {
    const overrides = await adminService.getStudentPlacementOverrides(param(req, "userId"));
    sendResponse(res, true, overrides, "Placement overrides fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const grantStudentPlacementAttempts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = validateGrantPlacementAttempts(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const override = await adminService.grantExtraAttempts(
      param(req, "userId"),
      req.user!.id,
      value,
    );
    sendResponse(res, true, override, "Extra attempts granted", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

// ─── User Endpoints ───────────────────────────────────────────────────────────

export const getAssessmentForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessment = await userService.getAssessmentForUser(param(req, "courseId"), req.user!.id);
    sendResponse(res, true, assessment, "Placement assessment fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const startAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempt = await userService.startAttempt(param(req, "courseId"), req.user!.id);
    sendResponse(res, true, attempt, "Attempt started", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getAttemptState = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const state = await userService.getAttemptState(param(req, "attemptId"), req.user!.id);
    sendResponse(res, true, state, "Attempt fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const saveAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = validateSavePlacementAnswer(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const answer = await userService.saveAnswer(
      param(req, "attemptId"),
      req.user!.id,
      param(req, "questionId"),
      value.selectedOptionId,
    );
    sendResponse(res, true, answer, "Answer saved");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const reportViolation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await userService.reportViolation(param(req, "attemptId"), req.user!.id);
    sendResponse(res, true, result, "Violation recorded");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const submitAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempt = await userService.submitAttempt(param(req, "attemptId"), req.user!.id);
    sendResponse(res, true, attempt, "Attempt submitted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getAttemptResult = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await userService.getAttemptResult(param(req, "attemptId"), req.user!.id);
    sendResponse(res, true, result, "Result fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const listUserAttemptHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempts = await userService.listAttemptHistory(param(req, "courseId"), req.user!.id);
    sendResponse(res, true, attempts, "Attempt history fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

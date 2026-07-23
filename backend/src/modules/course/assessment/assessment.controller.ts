import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { AdminAssessmentService, UserAssessmentService } from "./assessment.service.js";
import {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateCreateQuestion,
  validateUpdateQuestion,
  validateSaveAnswer,
} from "./assessment.validators.js";

const adminService = new AdminAssessmentService();
const userService = new UserAssessmentService();

const param = (req: Request, key: string): string => String(req.params[key]);

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const adminListAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessments = await adminService.listAssessmentsForAdmin(param(req, "courseId"));
    sendResponse(res, true, assessments, "Assessments fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminGetAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessments = await adminService.listAssessmentsForAdmin(param(req, "courseId"));
    sendResponse(res, true, assessments, "Assessments fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminGetAssessmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await adminService.getAssessmentByIdForAdmin(param(req, "assessmentId"));
    sendResponse(res, true, assessment, "Assessment fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const createAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateAssessment(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const assessment = await adminService.createAssessment(param(req, "courseId"), value);
    sendResponse(res, true, assessment, "Assessment created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const updateAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateUpdateAssessment(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const assessment = await adminService.updateAssessment(param(req, "assessmentId"), value);
    sendResponse(res, true, assessment, "Assessment updated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const deleteAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteAssessment(param(req, "assessmentId"));
    sendResponse(res, true, null, "Assessment deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const toggleAssessmentPublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const assessment = await adminService.togglePublish(param(req, "assessmentId"));
    sendResponse(res, true, assessment, `Assessment ${assessment.isPublished ? "published" : "unpublished"}`);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateQuestion(req.body);
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
    const { error, value } = validateUpdateQuestion(req.body);
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

// ─── User Endpoints ───────────────────────────────────────────────────────────

export const listAssessmentsForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessments = await userService.listAssessmentsForUser(param(req, "courseId"), req.user!.id);
    sendResponse(res, true, assessments, "Assessments fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getAssessmentForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessmentId = req.params.assessmentId ? param(req, "assessmentId") : undefined;
    const assessment = await userService.getAssessmentForUser(
      param(req, "courseId"),
      req.user!.id,
      assessmentId,
    );
    sendResponse(res, true, assessment, "Assessment fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getAttemptHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const history = await userService.getAttemptHistory(
      param(req, "courseId"),
      param(req, "assessmentId"),
      req.user!.id,
    );
    sendResponse(res, true, history, "Attempt history fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const startAttempt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assessmentId = req.params.assessmentId
      ? param(req, "assessmentId")
      : String(req.body?.assessmentId ?? "");
    if (!assessmentId) {
      sendResponse(res, false, null, "assessmentId is required", STATUS_CODES.BAD_REQUEST);
      return;
    }
    const attempt = await userService.startAttempt(param(req, "courseId"), req.user!.id, assessmentId);
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
    const { error, value } = validateSaveAnswer(req.body);
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

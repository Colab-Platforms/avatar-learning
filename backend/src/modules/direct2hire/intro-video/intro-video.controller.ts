import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { IntroVideoService } from "./intro-video.service.js";
import {
  validateCompleteIntroVideo,
  validateInitIntroVideo,
} from "./intro-video.validator.js";

const service = new IntroVideoService();

// ─── Student ─────────────────────────────────────────────────────────────────

export const getStudentIntro = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await service.getStudentIntro(req.user!.id);
    sendResponse(res, true, data, "Introduction video fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch introduction video",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getPlayback = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await service.getPlaybackUrl(req.user!.id);
    sendResponse(res, true, data, "Playback URL generated");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to generate playback URL",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const markCompleted = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await service.markCompleted(req.user!.id);
    sendResponse(res, true, data, "Introduction video marked as completed");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to mark introduction complete",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

// ─── Admin ───────────────────────────────────────────────────────────────────

export const getAdminIntro = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await service.getAdminIntro();
    sendResponse(res, true, data, "Introduction video fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch introduction video",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const initUpload = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateInitIntroVideo(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const data = await service.initUpload(value.title);
    sendResponse(res, true, data, "Upload initialized", STATUS_CODES.CREATED);
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      e.message ?? "Failed to initialize upload",
      e.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const completeUpload = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCompleteIntroVideo(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const data = await service.completeUpload(
      value.videoGuid,
      value.title,
      value.fileSize,
    );
    sendResponse(res, true, data, "Introduction video saved");
  } catch (err: unknown) {
    const e = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      e.message ?? "Failed to save introduction video",
      e.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const deleteIntro = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await service.deleteIntro();
    sendResponse(res, true, data, "Introduction video deleted");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to delete introduction video",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

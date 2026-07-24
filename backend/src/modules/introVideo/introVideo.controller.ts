import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import {
  AdminIntroVideoService,
  PublicIntroVideoService,
} from "./introVideo.service.js";

const adminService = new AdminIntroVideoService();
const publicService = new PublicIntroVideoService();

// ─── Admin ─────────────────────────────────────────────────────────────────

export const getIntroVideo = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const video = await adminService.getIntroVideo();
    sendResponse(res, true, video, "Intro video fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const initUpload = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { title } = req.body as { title?: string };
    if (!title?.trim()) {
      sendResponse(
        res,
        false,
        null,
        "title is required",
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const result = await adminService.initUpload(title.trim());
    sendResponse(res, true, result, "Video slot created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const completeUpload = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { videoGuid, title, fileSize } = req.body as {
      videoGuid?: string;
      title?: string;
      fileSize?: number;
    };
    if (!videoGuid || !title) {
      sendResponse(
        res,
        false,
        null,
        "videoGuid and title are required",
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const video = await adminService.completeUpload(
      videoGuid,
      title,
      fileSize ?? 0,
    );
    sendResponse(res, true, video, "Intro video saved", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

// ─── Public ────────────────────────────────────────────────────────────────

export const getPlayback = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await publicService.getPlaybackForUser(req.user!.id);
    sendResponse(res, true, result, "Intro video playback fetched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const markWatched = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await publicService.markWatched(req.user!.id);
    sendResponse(res, true, user, "Intro video marked as watched");
  } catch (err: any) {
    sendResponse(
      res,
      false,
      null,
      err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

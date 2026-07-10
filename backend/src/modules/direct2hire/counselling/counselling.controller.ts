import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { CounsellingService } from "./counselling.service.js";
import {
  validateCreateCounsellingProfile,
  validateUpdateCounsellingProfile,
} from "./counselling.validator.js";

const service = new CounsellingService();

export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const profile = await service.getByUserId(req.user!.id);
    sendResponse(res, true, profile, "Counselling profile fetched");
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

export const createProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCreateCounsellingProfile(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const profile = await service.create(req.user!.id, value);
    sendResponse(
      res,
      true,
      profile,
      "Counselling profile submitted",
      STATUS_CODES.CREATED,
    );
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

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateUpdateCounsellingProfile(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const profile = await service.update(req.user!.id, value);
    sendResponse(res, true, profile, "Counselling profile updated");
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

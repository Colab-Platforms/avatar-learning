import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { CounsellingService } from "./counselling.service.js";
import {
  validateCreateCounsellingProfile,
  validateUpdateCounsellingProfile,
  validateCounsellingBooking,
} from "./counselling.validator.js";

const service = new CounsellingService();

export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const bundle = await service.getSubmissionBundle(req.user!.id);
    const statusCode =
      bundle.recommendationStatus === "pending"
        ? STATUS_CODES.ACCEPTED
        : STATUS_CODES.OK;
    sendResponse(res, true, bundle, "Counselling profile fetched", statusCode);
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch counselling profile",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
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

    const result = await service.create(req.user!.id, value);
    const statusCode =
      result.recommendationStatus === "pending"
        ? STATUS_CODES.ACCEPTED
        : STATUS_CODES.CREATED;

    sendResponse(
      res,
      true,
      {
        profile: result.profile,
        recommendation: result.recommendation,
        recommendationStatus: result.recommendationStatus,
      },
      result.recommendationStatus === "pending"
        ? "Counselling profile submitted. AI recommendation is being generated."
        : "Counselling profile submitted",
      statusCode,
    );
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to submit counselling profile",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
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
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to update counselling profile",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const booking = await service.getBooking(req.user!.id);
    sendResponse(res, true, booking, "Counselling booking fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch counselling booking",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const createBooking = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCounsellingBooking(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const booking = await service.createBooking(req.user!.id, value);
    sendResponse(
      res,
      true,
      booking,
      "Counselling session requested successfully",
      STATUS_CODES.CREATED,
    );
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to request counselling session",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};


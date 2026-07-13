import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { RecommendationService } from "./recommendation.service.js";

const service = new RecommendationService();

export const getMyRecommendation = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const recommendation = await service.getResponseByUserId(req.user!.id);
    sendResponse(res, true, recommendation, "Course recommendation fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch recommendation",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

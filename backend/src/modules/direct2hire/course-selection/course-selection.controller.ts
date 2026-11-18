import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { CounsellingService } from "../counselling/counselling.service.js";

const service = new CounsellingService();

export const getState = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const state = await service.getCourseSelectionState(req.user!.id);
    sendResponse(res, true, state, "Course selection state fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch course selection state",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

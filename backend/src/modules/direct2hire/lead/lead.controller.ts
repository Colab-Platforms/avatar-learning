import { Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { LeadService } from "./lead.service.js";
import { validateUpsertLead } from "./lead.validator.js";

const service = new LeadService();

export const getMyLead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const lead = await service.getByUserId(req.user!.id);
    sendResponse(res, true, lead, "Direct2Hire lead fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch lead",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const upsertLead = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateUpsertLead(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const lead = await service.upsert(req.user!.id, value);
    sendResponse(res, true, lead, "Direct2Hire lead saved");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to save lead",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

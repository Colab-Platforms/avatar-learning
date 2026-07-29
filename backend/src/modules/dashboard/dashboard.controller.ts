import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { AdminDashboardService } from "./dashboard.service.js";

const adminDashboardService = new AdminDashboardService();

export const adminGetOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const overview = await adminDashboardService.getOverview();
    sendResponse(res, true, overview, "Dashboard overview fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  getPaginationOptions,
  formatPaginationResponse,
} from "@/utils/paginationUtils.js";
import { adminWebinarService } from "./webinar.service.js";

const param = (req: Request, key: string): string => String(req.params[key]);

export const adminGetAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const { registrations, totalRecords } = await adminWebinarService.getAll(
      take,
      skip,
      search || undefined,
      status as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | undefined,
    );
    const response = formatPaginationResponse(registrations, totalRecords, page, pageSize);
    sendResponse(res, true, response, "Webinar registrations fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminGetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const registration = await adminWebinarService.getById(param(req, "id"));
    sendResponse(res, true, registration, "Webinar registration fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

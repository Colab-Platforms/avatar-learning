import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  getPaginationOptions,
  formatPaginationResponse,
} from "@/utils/paginationUtils.js";
import { adminWebinarService, adminWebinarScheduleService } from "./webinar.service.js";
import {
  validateCreateWebinarSchedule,
  validateUpdateWebinarSchedule,
} from "./webinar.validator.js";

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

// ─── Webinar Schedules ─────────────────────────────────────────────────────

export const adminGetAllSchedules = async (_req: Request, res: Response): Promise<void> => {
  try {
    const schedules = await adminWebinarScheduleService.getAll();
    sendResponse(res, true, schedules, "Webinar schedules fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminGetScheduleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await adminWebinarScheduleService.getById(param(req, "id"));
    sendResponse(res, true, schedule, "Webinar schedule fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminCreateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateWebinarSchedule(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const schedule = await adminWebinarScheduleService.create(value);
    sendResponse(res, true, schedule, "Webinar schedule created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminUpdateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateUpdateWebinarSchedule(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const schedule = await adminWebinarScheduleService.update(param(req, "id"), value);
    sendResponse(res, true, schedule, "Webinar schedule updated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminDeleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminWebinarScheduleService.delete(param(req, "id"));
    sendResponse(res, true, null, "Webinar schedule deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminPublishSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const isPublished = req.body?.isPublished !== false;
    const schedule = await adminWebinarScheduleService.setPublished(param(req, "id"), isPublished);
    sendResponse(res, true, schedule, isPublished ? "Webinar schedule published" : "Webinar schedule unpublished");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminSetScheduleLive = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await adminWebinarScheduleService.setLive(param(req, "id"));
    sendResponse(res, true, schedule, "Webinar schedule is now live");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminUnsetScheduleLive = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await adminWebinarScheduleService.unsetLive(param(req, "id"));
    sendResponse(res, true, schedule, "Webinar schedule is no longer live");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

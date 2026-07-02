import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import {
  AdminInternshipService,
  PublicInternshipService,
} from "./internship.service.js";
import {
  getPaginationOptions,
  formatPaginationResponse,
} from "@/utils/paginationUtils.js";
import {
  validateCreateInternship,
  validateUpdateInternship,
} from "./internship.validators.js";

const adminService = new AdminInternshipService();
const publicService = new PublicInternshipService();

const param = (req: Request, key: string): string => String(req.params[key]);

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const adminGetAll = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 10);
    const { internships, totalRecords } = await adminService.getAll(take, skip);
    const response = formatPaginationResponse(
      internships,
      totalRecords,
      page,
      pageSize,
    );
    sendResponse(res, true, response, "Internships fetched");
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

export const adminGetOne = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const internship = await adminService.getById(param(req, "id"));
    sendResponse(res, true, internship, "Internship fetched");
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

export const createInternship = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCreateInternship(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const internship = await adminService.create(value, req.user!.id);
    sendResponse(
      res,
      true,
      internship,
      "Internship created",
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

export const updateInternship = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateUpdateInternship(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const internship = await adminService.update(param(req, "id"), value);
    sendResponse(res, true, internship, "Internship updated");
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

export const deleteInternship = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await adminService.delete(param(req, "id"));
    sendResponse(res, true, null, "Internship deleted");
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

export const togglePublish = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const internship = await adminService.togglePublish(param(req, "id"));
    sendResponse(
      res,
      true,
      internship,
      `Internship ${internship.isPublished ? "published" : "unpublished"}`,
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

export const getApplications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
    const { applications, totalRecords } = await adminService.getApplications(
      param(req, "id"),
      take,
      skip,
    );
    const response = formatPaginationResponse(
      applications,
      totalRecords,
      page,
      pageSize,
    );
    sendResponse(res, true, response, "Applications fetched");
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

export const updateApplicationStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status } = req.body as { status?: string };
    if (!status || !["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
      sendResponse(
        res,
        false,
        null,
        "Valid status is required",
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }
    const application = await adminService.updateApplicationStatus(
      param(req, "applicationId"),
      status as any,
    );
    sendResponse(res, true, application, "Application status updated");
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

// ─── Public Endpoints ─────────────────────────────────────────────────────────

export const getInternships = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 12);
    const categoryId = req.query.categoryId as string | undefined;
    const { internships, totalRecords } = await publicService.getPublished(
      take,
      skip,
      categoryId,
    );
    const response = formatPaginationResponse(
      internships,
      totalRecords,
      page,
      pageSize,
    );
    sendResponse(res, true, response, "Internships fetched");
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

export const getInternshipBySlug = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const internship = await publicService.getBySlug(param(req, "slug"));
    sendResponse(res, true, internship, "Internship fetched");
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

export const applyInternship = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const application = await publicService.apply(
      param(req, "internshipId"),
      req.user!.id,
    );
    sendResponse(
      res,
      true,
      application,
      "Applied successfully",
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

export const withdrawApplication = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    await publicService.withdrawApplication(
      param(req, "internshipId"),
      req.user!.id,
    );
    sendResponse(res, true, null, "Application withdrawn");
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

export const checkApplication = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await publicService.checkApplication(
      param(req, "internshipId"),
      req.user!.id,
    );
    sendResponse(res, true, result, "Application status fetched");
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

export const getMyApplications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 12);
    const { applications, totalRecords } =
      await publicService.getMyApplications(req.user!.id, take, skip);
    const response = formatPaginationResponse(
      applications,
      totalRecords,
      page,
      pageSize,
    );
    sendResponse(res, true, response, "Applications fetched");
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

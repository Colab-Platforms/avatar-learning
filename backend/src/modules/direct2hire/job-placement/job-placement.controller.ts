import { Response } from "express";
import Joi from "joi";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { JobPlacementService } from "./job-placement.service.js";
import {
  validateCreateJobPlacementEntry,
  validateUpdateJobPlacementEntry,
} from "./job-placement.validator.js";
import { validateStudentUserIdParam } from "../admin/admin.validator.js";

const service = new JobPlacementService();

const entryIdParamSchema = Joi.object({
  entryId: Joi.string().required(),
});

export const getMyJourney = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const bundle = await service.getJourney(req.user!.id);
    sendResponse(res, true, bundle, "Placement journey fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch placement journey",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const createEntry = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCreateJobPlacementEntry(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const entry = await service.create(req.user!.id, value);
    sendResponse(res, true, entry, "Placement logged", STATUS_CODES.CREATED);
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to log placement",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const updateEntry = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error: paramError, value: params } = entryIdParamSchema.validate(
      req.params,
    );
    if (paramError) {
      sendResponse(res, false, null, paramError.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const { error, value } = validateUpdateJobPlacementEntry(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const entry = await service.update(req.user!.id, params.entryId, value);
    sendResponse(res, true, entry, "Placement entry updated");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to update placement entry",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const deleteEntry = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error: paramError, value: params } = entryIdParamSchema.validate(
      req.params,
    );
    if (paramError) {
      sendResponse(res, false, null, paramError.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    await service.remove(req.user!.id, params.entryId);
    sendResponse(res, true, null, "Placement entry removed");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to remove placement entry",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getStudentJourney = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateStudentUserIdParam(req.params);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const bundle = await service.getJourney(value.userId);
    sendResponse(res, true, bundle, "Student placement journey fetched");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch student placement journey",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

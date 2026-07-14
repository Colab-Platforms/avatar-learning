import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { Direct2HireAdminService } from "./admin.service.js";
import { validateStudentUserIdParam } from "./admin.validator.js";
import { CounsellingService } from "../counselling/counselling.service.js";
import { validateConfirmCounsellingBooking } from "../counselling/counselling.validator.js";

const service = new Direct2HireAdminService();
const counsellingService = new CounsellingService();

export const getAllStudents = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try {
        const students = await service.getAllStudents();
        sendResponse(res, true, students, "Direct2Hire students fetched");
    } catch (err: unknown) {
        const error = err as { message?: string; statusCode?: number };
        sendResponse(
            res,
            false,
            null,
            error.message ?? "Failed to fetch students",
            error.statusCode ?? STATUS_CODES.SERVER_ERROR,
        );
    }
};

export const getStudentProfile = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { error, value } = validateStudentUserIdParam(req.params);
        if (error) {
            sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
            return;
        }

        const profile = await service.getStudentProfile(value.userId);
        sendResponse(res, true, profile, "Student profile fetched");
    } catch (err: unknown) {
        const error = err as { message?: string; statusCode?: number };
        sendResponse(
            res,
            false,
            null,
            error.message ?? "Failed to fetch student profile",
            error.statusCode ?? STATUS_CODES.SERVER_ERROR,
        );
    }
};

export const confirmBooking = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { error: paramError, value: params } =
            validateStudentUserIdParam(req.params);
        if (paramError) {
            sendResponse(
                res,
                false,
                null,
                paramError.message,
                STATUS_CODES.BAD_REQUEST,
            );
            return;
        }

        const { error, value } = validateConfirmCounsellingBooking(req.body);
        if (error) {
            sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
            return;
        }

        const booking = await counsellingService.confirmBooking(
            params.userId,
            value,
        );
        sendResponse(res, true, booking, "Counselling session confirmed");
    } catch (err: unknown) {
        const error = err as { message?: string; statusCode?: number };
        sendResponse(
            res,
            false,
            null,
            error.message ?? "Failed to confirm counselling session",
            error.statusCode ?? STATUS_CODES.SERVER_ERROR,
        );
    }
};

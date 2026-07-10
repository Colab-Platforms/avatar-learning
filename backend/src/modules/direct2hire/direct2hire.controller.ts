import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { Direct2HireService } from "./direct2hire.service.js";
import {
    getPaginationOptions,
    formatPaginationResponse,
} from "@/utils/paginationUtils.js";

const service = new Direct2HireService();

const param = (req: Request, key: string): string => String(req.params[key]);

// ─── Student ──────────────────────────────────────────────────────────────────

export const getMyStatus = async (
    req: AuthRequest,
    res: Response,
): Promise<void> => {
    try {
        const status = await service.getMyStatus(req.user!.id);
        sendResponse(res, true, status, "Direct2Hire status fetched");
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

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllEnrollments = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
        const { enrollments, totalRecords } = await service.getAllEnrollments(
            take,
            skip,
        );
        const response = formatPaginationResponse(
            enrollments,
            totalRecords,
            page,
            pageSize,
        );
        sendResponse(res, true, response, "Direct2Hire enrollments fetched");
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

export const markPaid = async (req: Request, res: Response): Promise<void> => {
    try {
        const enrollment = await service.markPaid(param(req, "enrollmentId"));
        sendResponse(res, true, enrollment, "Enrollment marked as paid");
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

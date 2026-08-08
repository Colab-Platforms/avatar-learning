import prisma from "@root/prisma.js";
import { PaymentService } from "@/modules/payment/payment.service.js";
import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { partnerService } from "@/modules/partners/partner.service.js";
import { Direct2HireService } from "./direct2hire.service.js";
import {
  getPaginationOptions,
  formatPaginationResponse,
} from "@/utils/paginationUtils.js";

const paymentService = new PaymentService();

const DIRECT2HIRE_PRICE_RUPEES: number = parseInt(
  process.env.DIRECT2HIRE_PRICE_RUPEES!,
);

// Preview-only, mirrors /coupons/apply — lets the enroll page show the
// auto-applied referral discount before checkout without the user typing
// anything. Actual application still happens server-side in
// createDirect2HireOrder; this is display only.
export const getReferralDiscount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const discountPercent = await partnerService.getReferralDiscountPercent(
      req.user!.id,
    );
    if (!discountPercent) {
      sendResponse(res, true, null, "No referral discount");
      return;
    }
    const discountAmount = Math.round(
      (DIRECT2HIRE_PRICE_RUPEES * discountPercent) / 100,
    );
    sendResponse(
      res,
      true,
      {
        discountPercent,
        originalAmount: DIRECT2HIRE_PRICE_RUPEES,
        discountAmount,
        finalAmount: DIRECT2HIRE_PRICE_RUPEES - discountAmount,
      },
      "Referral discount",
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

export const createOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const couponCode =
      typeof req.body?.couponCode === "string" && req.body.couponCode.trim()
        ? req.body.couponCode.trim()
        : undefined;
    const result = await paymentService.createDirect2HireOrder(
      req.user!.id,
      couponCode,
    );
    sendResponse(res, true, result, "Order created", STATUS_CODES.CREATED);
  } catch (err: any) {
    console.log("Order:", err);

    sendResponse(
      res,
      false,
      null,
      err.error.description,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const createAssessmentCounsellingOrder = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const result = await paymentService.createDirect2HireAssessmentCounsellingOrder(
      req.user!.id,
    );
    sendResponse(res, true, result, "Order created", STATUS_CODES.CREATED);
  } catch (err: any) {
    console.log("Assessment+Counselling order:", err);

    sendResponse(
      res,
      false,
      null,
      err.error?.description ?? err.message,
      err.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const getStatus = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const enrollment = await prisma.direct2HireEnrollment.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    sendResponse(
      res,
      true,
      {
        enrolled: enrollment?.status === "PAID",
        status: enrollment?.status ?? null,
      },
      "Direct2Hire status",
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
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to fetch status",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const devContinueAsPaid = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const status = await service.continueAsPaidForDev(req.user!.id);
    sendResponse(res, true, status, "Development access granted");
  } catch (err: unknown) {
    const error = err as { message?: string; statusCode?: number };
    sendResponse(
      res,
      false,
      null,
      error.message ?? "Failed to grant development access",
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
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

export const getAllAssessmentCounsellingPurchases = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
    const { enrollments, totalRecords } =
      await service.getAllAssessmentCounsellingPurchases(take, skip);
    const response = formatPaginationResponse(
      enrollments,
      totalRecords,
      page,
      pageSize,
    );
    sendResponse(
      res,
      true,
      response,
      "Assessment + Counselling purchases fetched",
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

export const markRefunded = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollment = await service.markRefunded(param(req, "enrollmentId"));
    sendResponse(res, true, enrollment, "Enrollment marked as refunded");
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

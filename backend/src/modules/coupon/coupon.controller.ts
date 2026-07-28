import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { couponService } from "./coupon.service.js";
import {
  validateCreateCoupon,
  validateUpdateCoupon,
  validateApplyCoupon,
} from "./coupon.validation.js";

const DIRECT2HIRE_PRICE_RUPEES: number = parseInt(
  process.env.DIRECT2HIRE_PRICE_RUPEES!,
);

export const applyCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = validateApplyCoupon(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const coupon = await couponService.validateCoupon(value.code);
    const discountAmount = Math.round(
      (DIRECT2HIRE_PRICE_RUPEES * coupon.discountPercent) / 100,
    );
    sendResponse(
      res,
      true,
      {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        originalAmount: DIRECT2HIRE_PRICE_RUPEES,
        discountAmount,
        finalAmount: DIRECT2HIRE_PRICE_RUPEES - discountAmount,
      },
      "Coupon applied",
    );
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const listCoupons = async (_req: Request, res: Response): Promise<void> => {
  try {
    const coupons = await couponService.list();
    sendResponse(res, true, coupons, "Coupons fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateCoupon(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const coupon = await couponService.create({
      code: value.code,
      discountPercent: value.discountPercent,
      expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
    });
    sendResponse(res, true, coupon, "Coupon created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateUpdateCoupon(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const coupon = await couponService.update(String(req.params.id), {
      discountPercent: value.discountPercent,
      isActive: value.isActive,
      expiresAt:
        value.expiresAt === undefined ? undefined : value.expiresAt ? new Date(value.expiresAt) : null,
    });
    sendResponse(res, true, coupon, "Coupon updated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await couponService.getById(String(req.params.id));
    sendResponse(res, true, coupon, "Coupon fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getCouponRedemptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const redemptions = await couponService.getRedemptions(String(req.params.id));
    sendResponse(res, true, redemptions, "Coupon redemptions fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    await couponService.remove(String(req.params.id));
    sendResponse(res, true, null, "Coupon deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

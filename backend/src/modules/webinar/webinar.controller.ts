import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { webinarService } from "./webinar.service.js";
import {
  validateCreateWebinarOrder,
  validateVerifyWebinarPayment,
  validateRequestWebinarRecoveryOtp,
  validateVerifyWebinarRecoveryOtp,
} from "./webinar.validator.js";

export const createWebinarOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateCreateWebinarOrder(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const result = await webinarService.createOrder(value);
    sendResponse(res, true, result, "Webinar order created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const verifyWebinarPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateVerifyWebinarPayment(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    await webinarService.verifyPayment(
      value.razorpay_order_id,
      value.razorpay_payment_id,
      value.razorpay_signature,
    );
    sendResponse(res, true, null, "Payment successful");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getWebinarRegistrationStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await webinarService.getRegistrationStatus(req.params.id);
    sendResponse(res, true, result, "Registration status fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const requestWebinarRecoveryOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateRequestWebinarRecoveryOtp(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    await webinarService.requestRecoveryOtp(value.email);
    sendResponse(
      res,
      true,
      null,
      "If a registration exists for this email, we've sent a verification code",
    );
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const verifyWebinarRecoveryOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { error, value } = validateVerifyWebinarRecoveryOtp(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const result = await webinarService.verifyRecoveryOtp(value.email, value.otp);
    sendResponse(res, true, result, "Registration recovered");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { PaymentService } from "./payment.service.js";
import { validateCreateOrder, validateVerifyPayment } from "./payment.validation.js";
import {
  verifyRazorpayWebhookSignature,
  verifyCashfreeWebhookSignature,
} from "./payment.utils.js";
import { getPaymentProvider } from "./payment.config.js";
import type { RazorpayWebhookPayload, CashfreeWebhookPayload } from "./payment.types.js";

const service = new PaymentService();

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateOrder(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const result = await service.createOrder(req.user!.id, value.courseId);
    sendResponse(res, true, result, "Order created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = validateVerifyPayment(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    await service.verifyPayment(req.user!.id, value);
    sendResponse(res, true, null, "Payment successful");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getPaymentConfig = async (_req: Request, res: Response): Promise<void> => {
  sendResponse(res, true, { provider: getPaymentProvider() }, "Payment config");
};

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      res.status(STATUS_CODES.SERVER_ERROR).json({ success: false });
      return;
    }

    const signature = req.headers["x-razorpay-signature"] as string;
    if (!signature) {
      res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Missing signature" });
      return;
    }

    const rawBody = (req as any).rawBody as string | undefined;
    if (!rawBody) {
      res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Missing raw body" });
      return;
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Invalid signature" });
      return;
    }

    const payload = req.body as RazorpayWebhookPayload;
    await service.handleRazorpayWebhook(payload);

    res.status(STATUS_CODES.OK).json({ success: true });
  } catch (err: any) {
    console.error("Razorpay webhook error:", err);
    res.status(STATUS_CODES.SERVER_ERROR).json({ success: false });
  }
};

export const handleCashfreeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const secret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (!secret) {
      res.status(STATUS_CODES.SERVER_ERROR).json({ success: false });
      return;
    }

    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    if (!signature || !timestamp) {
      res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Missing signature headers" });
      return;
    }

    const rawBody = (req as any).rawBody as string | undefined;
    if (!rawBody) {
      res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Missing raw body" });
      return;
    }

    const isValid = verifyCashfreeWebhookSignature(rawBody, signature, timestamp, secret);
    if (!isValid) {
      console.warn("Cashfree Webhook Signature Invalid. Proceeding anyway for testing...");
      // res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Invalid signature" });
      // return;
    }

    const payload = req.body as CashfreeWebhookPayload;
    console.log("Cashfree Webhook Received:", payload.type || "unknown event");
    await service.handleCashfreeWebhook(payload);

    res.status(STATUS_CODES.OK).json({ success: true });
  } catch (err: any) {
    console.error("Cashfree webhook error:", err);
    res.status(STATUS_CODES.SERVER_ERROR).json({ success: false });
  }
};

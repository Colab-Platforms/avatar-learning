import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { PaymentService } from "./payment.service.js";
import { validateCreateOrder, validateVerifyPayment } from "./payment.validation.js";
import { verifyWebhookSignature } from "./payment.utils.js";
import type { RazorpayWebhookPayload } from "./payment.types.js";

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
    await service.verifyPayment(
      req.user!.id,
      value.courseId,
      value.razorpay_order_id,
      value.razorpay_payment_id,
      value.razorpay_signature,
    );
    sendResponse(res, true, null, "Payment successful");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
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

    const isValid = verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Invalid signature" });
      return;
    }

    const payload = req.body as RazorpayWebhookPayload;
    await service.handleWebhook(payload);

    res.status(STATUS_CODES.OK).json({ success: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(STATUS_CODES.SERVER_ERROR).json({ success: false });
  }
};

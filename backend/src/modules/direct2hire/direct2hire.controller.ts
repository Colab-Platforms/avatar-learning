import { Response } from "express";
import prisma from "@root/prisma.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { PaymentService } from "@/modules/payment/payment.service.js";

const paymentService = new PaymentService();

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await paymentService.createDirect2HireOrder(req.user!.id);
    sendResponse(res, true, result, "Order created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollment = await prisma.direct2HireEnrollment.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    sendResponse(
      res,
      true,
      { enrolled: enrollment?.status === "PAID", status: enrollment?.status ?? null },
      "Direct2Hire status",
    );
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

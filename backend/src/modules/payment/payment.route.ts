import { Router, Request, Response, NextFunction } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import {
  createOrder,
  verifyPayment,
  getPaymentConfig,
  handleRazorpayWebhook,
  handleCashfreeWebhook,
} from "./payment.controller.js";

const router = Router();

router.post("/webhook", handleRazorpayWebhook);
router.post("/webhook/cashfree", handleCashfreeWebhook);

router.get("/config", getPaymentConfig);
router.post("/create-order", auth("USER"), createOrder);
router.post("/verify", auth("USER"), verifyPayment);

export default router;

import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireCompleteProfile } from "@/middlewares/requireCompleteProfile.js";
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
router.post("/create-order", auth("USER"), requireCompleteProfile, createOrder);
router.post("/verify", auth("USER"), requireCompleteProfile, verifyPayment);

export default router;

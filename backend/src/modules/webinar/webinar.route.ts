import { Router } from "express";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import {
  createWebinarOrder,
  verifyWebinarPayment,
  getWebinarRegistrationStatus,
  requestWebinarRecoveryOtp,
  verifyWebinarRecoveryOtp,
} from "./webinar.controller.js";

const router = Router();

const recoveryLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts. Please try again later.",
});

router.post("/create-order", createWebinarOrder);
router.post("/verify-payment", verifyWebinarPayment);
router.get("/registration/:id/status", getWebinarRegistrationStatus);
router.post("/recovery/request-otp", recoveryLimiter, requestWebinarRecoveryOtp);
router.post("/recovery/verify-otp", recoveryLimiter, verifyWebinarRecoveryOtp);

export default router;

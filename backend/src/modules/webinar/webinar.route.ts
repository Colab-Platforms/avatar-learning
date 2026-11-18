import { Router } from "express";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import {
  createWebinarOrder,
  verifyWebinarPayment,
  getWebinarRegistrationStatus,
  requestWebinarRecoveryOtp,
  verifyWebinarRecoveryOtp,
  getLiveWebinarSchedule,
} from "./webinar.controller.js";

const router = Router();

// Separate buckets so a few mistyped-OTP verify attempts don't burn the
// quota needed to request a fresh code (and vice versa) — sharing one
// limiter across both routes let either action starve the other.
const requestOtpLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts. Please try again later.",
});

const verifyOtpLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts. Please try again later.",
});

router.get("/live-schedule", getLiveWebinarSchedule);
router.post("/create-order", createWebinarOrder);
router.post("/verify-payment", verifyWebinarPayment);
router.get("/registration/:id/status", getWebinarRegistrationStatus);
router.post("/recovery/request-otp", requestOtpLimiter, requestWebinarRecoveryOtp);
router.post("/recovery/verify-otp", verifyOtpLimiter, verifyWebinarRecoveryOtp);

export default router;

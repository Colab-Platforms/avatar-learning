import { Router } from "express";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import * as c from "./adoption.controller.js";

// AI Adoption accounts — mounted at /api/adoption/auth (separate from the learning platform's /api/auth).
const router = Router();

const credentialsLimiter = createLimiter({ windowMs: 15 * 60_000, max: 20, message: "Too many attempts. Please wait a few minutes and try again." });
const emailLimiter = createLimiter({ windowMs: 15 * 60_000, max: 8, message: "Too many emails requested. Please wait a few minutes and try again." });

router.post("/register", emailLimiter, c.register);
router.post("/verify-email", credentialsLimiter, c.verifyEmail);
router.post("/resend-verification", emailLimiter, c.resendVerification);
router.post("/login", credentialsLimiter, c.login);
router.post("/google", credentialsLimiter, c.google);
router.post("/forgot-password", emailLimiter, c.forgotPassword);
router.post("/reset-password", credentialsLimiter, c.resetPassword);
router.get("/me", c.requireAdoptionSession, c.me);
router.post("/logout", c.requireAdoptionSession, c.logout);

export default router;

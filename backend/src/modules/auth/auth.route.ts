import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as authController from "./auth.controller.js";

const router = Router();

// Registration flow
router.post("/register", authController.register);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);

// Login
router.post("/login", authController.login);

// Session management
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/logout-all", auth("USER", "ADMIN", "SUPERADMIN"), authController.logoutAll);

// Password reset
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;

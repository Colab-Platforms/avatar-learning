import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { applyCoupon } from "./coupon.controller.js";

const router = Router();

router.post("/apply", auth("USER"), applyCoupon);

export default router;

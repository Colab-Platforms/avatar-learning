import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as couponController from "./coupon.controller.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/coupons", couponController.listCoupons);
router.post("/coupons", couponController.createCoupon);
router.get("/coupons/:id", couponController.getCoupon);
router.put("/coupons/:id", couponController.updateCoupon);
router.delete("/coupons/:id", couponController.deleteCoupon);
router.get("/coupons/:id/redemptions", couponController.getCouponRedemptions);

export default router;

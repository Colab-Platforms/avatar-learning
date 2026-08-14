import { Router } from "express";
import { createWebinarOrder, verifyWebinarPayment } from "./webinar.controller.js";

const router = Router();

router.post("/create-order", createWebinarOrder);
router.post("/verify-payment", verifyWebinarPayment);

export default router;

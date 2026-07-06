import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { createOrder, getStatus } from "./direct2hire.controller.js";

const router = Router();

router.get("/status", auth("USER"), getStatus);
router.post("/create-order", auth("USER"), createOrder);

export default router;

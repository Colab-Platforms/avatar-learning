import { Router, Request, Response, NextFunction } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { createOrder, verifyPayment, handleWebhook } from "./payment.controller.js";

const router = Router();

// Capture raw body for webhook signature verification before JSON parsing
router.post(
  "/webhook",
  (req: Request, _res: Response, next: NextFunction) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => { data += chunk; });
    req.on("end", () => {
      (req as any).rawBody = data;
      // Parse JSON manually so req.body is still usable
      try { req.body = JSON.parse(data); } catch { req.body = {}; }
      next();
    });
  },
  handleWebhook,
);

router.post("/create-order", auth("USER"), createOrder);
router.post("/verify", auth("USER"), verifyPayment);

export default router;

import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as direct2hireController from "./direct2hire.controller.js";
import counsellingRoutes from "./counselling/counselling.route.js";
import leadRoutes from "./lead/lead.route.js";
import recommendationRoutes from "./recommendation/recommendation.route.js";

const router = Router();

router.get("/me", auth("USER"), direct2hireController.getMyStatus);
router.use("/counselling", counsellingRoutes);
router.use("/lead", leadRoutes);
router.use("/recommendation", recommendationRoutes);

if (process.env.NODE_ENV !== "production") {
  router.post(
    "/dev/continue-as-paid",
    auth("USER"),
    direct2hireController.devContinueAsPaid,
  );
}

export default router;

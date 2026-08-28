import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireAssessmentCounsellingAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as recommendationController from "./recommendation.controller.js";

const router = Router();

router.use(auth("USER"), requireAssessmentCounsellingAccess);

router.get("/", recommendationController.getMyRecommendation);

export default router;

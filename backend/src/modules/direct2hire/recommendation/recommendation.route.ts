import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as recommendationController from "./recommendation.controller.js";

const router = Router();

router.get("/", auth("USER"), recommendationController.getMyRecommendation);

export default router;

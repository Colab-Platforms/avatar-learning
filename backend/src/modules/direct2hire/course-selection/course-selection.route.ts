import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireAssessmentCounsellingAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as courseSelectionController from "./course-selection.controller.js";

const router = Router();

router.use(auth("USER"), requireAssessmentCounsellingAccess);

// Read-only: the Direct2Hire course is fixed at enrollment; students no longer
// pick one after counselling, so there is no POST here anymore.
router.get("/", courseSelectionController.getState);

export default router;

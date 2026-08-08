import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireAssessmentCounsellingAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as courseSelectionController from "./course-selection.controller.js";

const router = Router();

router.use(auth("USER"), requireAssessmentCounsellingAccess);

router.get("/", courseSelectionController.getState);
router.post("/", courseSelectionController.select);

export default router;

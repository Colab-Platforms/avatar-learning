import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireDirect2HireAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as courseSelectionController from "./course-selection.controller.js";

const router = Router();

router.use(auth("USER"), requireDirect2HireAccess);

router.get("/", courseSelectionController.getState);
router.post("/", courseSelectionController.select);

export default router;

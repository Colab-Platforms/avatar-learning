import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as courseSelectionController from "./course-selection.controller.js";

const router = Router();

router.get("/", auth("USER"), courseSelectionController.getState);
router.post("/", auth("USER"), courseSelectionController.select);

export default router;

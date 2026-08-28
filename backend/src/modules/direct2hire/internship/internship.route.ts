import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireDirect2HireAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as internshipController from "./internship.controller.js";

const router = Router();

router.use(auth("USER"), requireDirect2HireAccess);

router.get("/upload/sign", internshipController.getUploadSignature);
router.get("/tasks", internshipController.getMyTasks);
router.get("/tasks/:taskId", internshipController.getMyTask);
router.post("/tasks/:taskId/submit", internshipController.submitTask);

export default router;

import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireInternshipAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as internshipController from "./internship.controller.js";

const router = Router();
const userAuth = [auth("USER"), requireInternshipAccess] as const;

router.get(
  "/upload/sign",
  ...userAuth,
  internshipController.getUploadSignature,
);
router.get("/tasks", ...userAuth, internshipController.getMyTasks);
router.get("/tasks/:taskId", ...userAuth, internshipController.getMyTask);
router.post(
  "/tasks/:taskId/submit",
  ...userAuth,
  internshipController.submitTask,
);

export default router;

import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as internshipController from "./internship.controller.js";

const router = Router();

router.get(
  "/upload/sign",
  auth("USER"),
  internshipController.getUploadSignature,
);
router.get("/tasks", auth("USER"), internshipController.getMyTasks);
router.get("/tasks/:taskId", auth("USER"), internshipController.getMyTask);
router.post(
  "/tasks/:taskId/submit",
  auth("USER"),
  internshipController.submitTask,
);

export default router;

import { Router } from "express";
import * as internshipController from "./internship.controller.js";

const router = Router();

// Parent admin.route already applies auth("ADMIN")

router.get(
  "/upload/sign",
  internshipController.getUploadSignature,
);
router.get(
  "/course/:courseId/internship-tasks",
  internshipController.listAdminTasks,
);
router.post(
  "/course/:courseId/internship-tasks",
  internshipController.createAdminTask,
);
router.put(
  "/internship-tasks/:taskId",
  internshipController.updateAdminTask,
);
router.delete(
  "/internship-tasks/:taskId",
  internshipController.deleteAdminTask,
);
router.patch(
  "/internship-submissions/:submissionId/review",
  internshipController.reviewSubmission,
);

export default router;

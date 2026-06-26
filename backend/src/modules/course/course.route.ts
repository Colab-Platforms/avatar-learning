import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as courseController from "./course.controller.js";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", courseController.getCourses);
router.get("/hero", courseController.getHeroCourses);

// ─── Authenticated User Routes (must be before /:slug to avoid conflicts) ────
router.get("/me/enrollments", auth("USER"), courseController.getMyEnrollments);
router.get(
  "/resources/:resourceId/download",
  auth("USER"),
  courseController.downloadResource,
);
router.post("/:courseId/enroll", auth("USER"), courseController.enrollCourse);
router.delete(
  "/:courseId/enroll",
  auth("USER"),
  courseController.unenrollCourse,
);
router.get(
  "/:courseId/enrollment",
  auth("USER"),
  courseController.checkEnrollment,
);
router.get(
  "/:courseId/learn",
  auth("USER"),
  courseController.getEnrolledCourseDetail,
);

// ─── Public slug route (must be last — catchall param) ───────────────────────
router.get("/:slug", courseController.getCourseBySlug);

export default router;

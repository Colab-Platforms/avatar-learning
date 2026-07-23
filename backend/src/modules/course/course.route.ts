import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as courseController from "./course.controller.js";
import * as assessmentController from "./assessment/assessment.controller.js";
import * as placementController from "./placement/placement.controller.js";

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
router.post(
  "/topics/:topicId/watch",
  auth("USER"),
  courseController.markTopicWatched,
);
router.get(
  "/:courseId/certificate",
  auth("USER"),
  courseController.downloadCertificate,
);

// ─── Assessment (must be before /:slug to avoid conflicts) ───────────────────
router.get(
  "/:courseId/assessments",
  auth("USER"),
  assessmentController.listAssessmentsForUser,
);
router.get(
  "/:courseId/assessments/:assessmentId",
  auth("USER"),
  assessmentController.getAssessmentForUser,
);
router.get(
  "/:courseId/assessments/:assessmentId/attempts",
  auth("USER"),
  assessmentController.getAttemptHistory,
);
router.post(
  "/:courseId/assessments/:assessmentId/attempts",
  auth("USER"),
  assessmentController.startAttempt,
);
// Legacy aliases — prefer /assessments/:assessmentId routes above
router.get(
  "/:courseId/assessment",
  auth("USER"),
  assessmentController.listAssessmentsForUser,
);
router.post(
  "/:courseId/assessment/attempts",
  auth("USER"),
  assessmentController.startAttempt,
);
router.get(
  "/assessments/attempts/:attemptId",
  auth("USER"),
  assessmentController.getAttemptState,
);
router.put(
  "/assessments/attempts/:attemptId/answers/:questionId",
  auth("USER"),
  assessmentController.saveAnswer,
);
router.post(
  "/assessments/attempts/:attemptId/violations",
  auth("USER"),
  assessmentController.reportViolation,
);
router.post(
  "/assessments/attempts/:attemptId/submit",
  auth("USER"),
  assessmentController.submitAttempt,
);
router.get(
  "/assessments/attempts/:attemptId/result",
  auth("USER"),
  assessmentController.getAttemptResult,
);

// ─── Placement Assessment (must be before /:slug to avoid conflicts) ─────────
router.get(
  "/:courseId/placement-assessment",
  auth("USER"),
  placementController.getAssessmentForUser,
);
router.post(
  "/:courseId/placement-assessment/attempts",
  auth("USER"),
  placementController.startAttempt,
);
router.get(
  "/:courseId/placement-assessment/attempts",
  auth("USER"),
  placementController.listUserAttemptHistory,
);
router.get(
  "/placement-assessments/attempts/:attemptId",
  auth("USER"),
  placementController.getAttemptState,
);
router.put(
  "/placement-assessments/attempts/:attemptId/answers/:questionId",
  auth("USER"),
  placementController.saveAnswer,
);
router.post(
  "/placement-assessments/attempts/:attemptId/violations",
  auth("USER"),
  placementController.reportViolation,
);
router.post(
  "/placement-assessments/attempts/:attemptId/submit",
  auth("USER"),
  placementController.submitAttempt,
);
router.get(
  "/placement-assessments/attempts/:attemptId/result",
  auth("USER"),
  placementController.getAttemptResult,
);

// ─── Public slug route (must be last — catchall param) ───────────────────────
router.get("/:slug", courseController.getCourseBySlug);

export default router;

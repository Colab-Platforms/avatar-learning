import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireCompleteProfile } from "@/middlewares/requireCompleteProfile.js";
import * as courseController from "./course.controller.js";
import * as assessmentController from "./assessment/assessment.controller.js";
import * as placementController from "./placement/placement.controller.js";

const router = Router();
const userAuth = [auth("USER"), requireCompleteProfile] as const;

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", courseController.getCourses);
router.get("/hero", courseController.getHeroCourses);

// ─── Authenticated User Routes (must be before /:slug to avoid conflicts) ────
router.get("/me/enrollments", ...userAuth, courseController.getMyEnrollments);
router.get(
  "/resources/:resourceId/download",
  ...userAuth,
  courseController.downloadResource,
);
router.get(
  "/resources/:resourceId/playback",
  ...userAuth,
  courseController.getVideoPlayback,
);
router.post("/:courseId/enroll", ...userAuth, courseController.enrollCourse);
router.delete(
  "/:courseId/enroll",
  ...userAuth,
  courseController.unenrollCourse,
);
router.get(
  "/:courseId/enrollment",
  ...userAuth,
  courseController.checkEnrollment,
);
router.get(
  "/:courseId/learn",
  ...userAuth,
  courseController.getEnrolledCourseDetail,
);
router.post(
  "/topics/:topicId/watch",
  ...userAuth,
  courseController.markTopicWatched,
);
router.get(
  "/:courseId/certificate",
  ...userAuth,
  courseController.downloadCertificate,
);

// ─── Assessment (must be before /:slug to avoid conflicts) ───────────────────
router.get(
  "/:courseId/assessments",
  ...userAuth,
  assessmentController.listAssessmentsForUser,
);
router.get(
  "/:courseId/assessments/:assessmentId",
  ...userAuth,
  assessmentController.getAssessmentForUser,
);
router.get(
  "/:courseId/assessments/:assessmentId/attempts",
  ...userAuth,
  assessmentController.getAttemptHistory,
);
router.post(
  "/:courseId/assessments/:assessmentId/attempts",
  ...userAuth,
  assessmentController.startAttempt,
);
// Legacy aliases — prefer /assessments/:assessmentId routes above
router.get(
  "/:courseId/assessment",
  ...userAuth,
  assessmentController.listAssessmentsForUser,
);
router.post(
  "/:courseId/assessment/attempts",
  ...userAuth,
  assessmentController.startAttempt,
);
router.get(
  "/assessments/attempts/:attemptId",
  ...userAuth,
  assessmentController.getAttemptState,
);
router.put(
  "/assessments/attempts/:attemptId/answers/:questionId",
  ...userAuth,
  assessmentController.saveAnswer,
);
router.post(
  "/assessments/attempts/:attemptId/violations",
  ...userAuth,
  assessmentController.reportViolation,
);
router.post(
  "/assessments/attempts/:attemptId/submit",
  ...userAuth,
  assessmentController.submitAttempt,
);
router.get(
  "/assessments/attempts/:attemptId/result",
  ...userAuth,
  assessmentController.getAttemptResult,
);

// ─── Placement Assessment (must be before /:slug to avoid conflicts) ─────────
router.get(
  "/:courseId/placement-assessment",
  ...userAuth,
  placementController.getAssessmentForUser,
);
router.post(
  "/:courseId/placement-assessment/attempts",
  ...userAuth,
  placementController.startAttempt,
);
router.get(
  "/:courseId/placement-assessment/attempts",
  ...userAuth,
  placementController.listUserAttemptHistory,
);
router.get(
  "/placement-assessments/attempts/:attemptId",
  ...userAuth,
  placementController.getAttemptState,
);
router.put(
  "/placement-assessments/attempts/:attemptId/answers/:questionId",
  ...userAuth,
  placementController.saveAnswer,
);
router.post(
  "/placement-assessments/attempts/:attemptId/violations",
  ...userAuth,
  placementController.reportViolation,
);
router.post(
  "/placement-assessments/attempts/:attemptId/submit",
  ...userAuth,
  placementController.submitAttempt,
);
router.get(
  "/placement-assessments/attempts/:attemptId/result",
  ...userAuth,
  placementController.getAttemptResult,
);

// ─── Public slug route (must be last — catchall param) ───────────────────────
router.get("/:slug", courseController.getCourseBySlug);

export default router;

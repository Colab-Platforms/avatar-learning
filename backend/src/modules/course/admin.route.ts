import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as courseController from "./course.controller.js";
import * as assessmentController from "./assessment/assessment.controller.js";
import * as placementController from "./placement/placement.controller.js";

const router = Router();

// All admin routes require ADMIN role or higher 
router.use(auth("ADMIN"));

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/categories", courseController.getCategories);
router.post("/categories", courseController.createCategory);

// ─── Courses ──────────────────────────────────────────────────────────────────
router.get("/courses", courseController.adminGetAllCourses);
router.post("/courses", courseController.createCourse);
// Static routes must come before /:id to avoid being shadowed
router.get("/courses/images/sign", courseController.signCourseImageUpload);
router.get("/courses/:id", courseController.adminGetCourse);
router.put("/courses/:id", courseController.updateCourse);
router.delete("/courses/:id", courseController.deleteCourse);
router.patch("/courses/:id/publish", courseController.togglePublish);

// ─── Lessons ──────────────────────────────────────────────────────────────────
router.post("/courses/:courseId/lessons", courseController.createLesson);
router.put("/lessons/:lessonId", courseController.updateLesson);
router.delete("/lessons/:lessonId", courseController.deleteLesson);

// ─── Topics ───────────────────────────────────────────────────────────────────
router.post("/lessons/:lessonId/topics", courseController.createTopic);
router.put("/topics/:topicId", courseController.updateTopic);
router.delete("/topics/:topicId", courseController.deleteTopic);

// ─── Assessment ───────────────────────────────────────────────────────────────
router.get("/courses/:courseId/assessments", assessmentController.adminListAssessments);
router.get("/courses/:courseId/assessment", assessmentController.adminGetAssessment); // returns list (multi-stage)
router.post("/courses/:courseId/assessments", assessmentController.createAssessment);
router.post("/courses/:courseId/assessment", assessmentController.createAssessment);
router.get("/assessments/:assessmentId", assessmentController.adminGetAssessmentById);
router.put("/assessments/:assessmentId", assessmentController.updateAssessment);
router.delete("/assessments/:assessmentId", assessmentController.deleteAssessment);
router.patch("/assessments/:assessmentId/publish", assessmentController.toggleAssessmentPublish);
router.post("/assessments/:assessmentId/questions", assessmentController.createQuestion);
router.put("/questions/:questionId", assessmentController.updateQuestion);
router.delete("/questions/:questionId", assessmentController.deleteQuestion);
router.get("/assessments/:assessmentId/attempts", assessmentController.listAttempts);
router.get("/attempts/:attemptId", assessmentController.getAttemptDetail);
router.delete("/attempts/:attemptId", assessmentController.resetAttempt);

// ─── Placement Assessment ───────────────────────────────────────────────────
router.get("/courses/:courseId/placement-assessment", placementController.adminGetAssessment);
router.post("/courses/:courseId/placement-assessment", placementController.createAssessment);
router.put("/placement-assessments/:assessmentId", placementController.updateAssessment);
router.delete("/placement-assessments/:assessmentId", placementController.deleteAssessment);
router.patch("/placement-assessments/:assessmentId/publish", placementController.toggleAssessmentPublish);
router.post("/placement-assessments/:assessmentId/questions", placementController.createQuestion);
router.put("/placement-questions/:questionId", placementController.updateQuestion);
router.delete("/placement-questions/:questionId", placementController.deleteQuestion);
router.get("/placement-assessments/:assessmentId/attempts", placementController.listAttempts);
router.get("/placement-attempts/:attemptId", placementController.getAttemptDetail);
router.delete("/placement-attempts/:attemptId", placementController.resetAttempt);

// ─── Video Upload (two-step direct upload, scoped to a topic) ────────────────
router.post("/topics/:topicId/video/init", courseController.initVideoUpload);
router.post("/topics/:topicId/video/complete", courseController.completeVideoUpload);

// ─── File Upload (signed direct-to-Cloudinary, scoped to a topic) ────────────
router.get("/topics/files/sign", courseController.signCourseFileUpload);
router.post("/topics/:topicId/files", courseController.completeFileUpload);

router.delete("/resources/:resourceId", courseController.deleteResource);

export default router;

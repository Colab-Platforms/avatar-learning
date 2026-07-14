import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as courseController from "./course.controller.js";
import * as assessmentController from "./assessment/assessment.controller.js";

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
router.get("/courses/:courseId/assessment", assessmentController.adminGetAssessment);
router.post("/courses/:courseId/assessment", assessmentController.createAssessment);
router.put("/assessments/:assessmentId", assessmentController.updateAssessment);
router.delete("/assessments/:assessmentId", assessmentController.deleteAssessment);
router.patch("/assessments/:assessmentId/publish", assessmentController.toggleAssessmentPublish);
router.post("/assessments/:assessmentId/questions", assessmentController.createQuestion);
router.put("/questions/:questionId", assessmentController.updateQuestion);
router.delete("/questions/:questionId", assessmentController.deleteQuestion);
router.get("/assessments/:assessmentId/attempts", assessmentController.listAttempts);
router.get("/attempts/:attemptId", assessmentController.getAttemptDetail);
router.delete("/attempts/:attemptId", assessmentController.resetAttempt);

// ─── Video Upload (two-step direct upload, scoped to a topic) ────────────────
router.post("/topics/:topicId/video/init", courseController.initVideoUpload);
router.post("/topics/:topicId/video/complete", courseController.completeVideoUpload);

// ─── File Upload (signed direct-to-Cloudinary, scoped to a topic) ────────────
router.get("/topics/files/sign", courseController.signCourseFileUpload);
router.post("/topics/:topicId/files", courseController.completeFileUpload);

router.delete("/resources/:resourceId", courseController.deleteResource);

export default router;

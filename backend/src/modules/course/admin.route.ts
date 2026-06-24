import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as courseController from "./course.controller.js";

const router = Router();

// All admin routes require ADMIN role or higher 
router.use(auth("ADMIN"));

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/categories", courseController.getCategories);
router.post("/categories", courseController.createCategory);

// ─── Courses ──────────────────────────────────────────────────────────────────
router.get("/courses", courseController.adminGetAllCourses);
router.post("/courses", courseController.createCourse);
router.get("/courses/:id", courseController.adminGetCourse);
router.put("/courses/:id", courseController.updateCourse);
router.delete("/courses/:id", courseController.deleteCourse);
router.patch("/courses/:id/publish", courseController.togglePublish);

// ─── Lessons ──────────────────────────────────────────────────────────────────
router.post("/courses/:courseId/lessons", courseController.createLesson);
router.put("/lessons/:lessonId", courseController.updateLesson);
router.delete("/lessons/:lessonId", courseController.deleteLesson);

// ─── Video Upload (two-step direct upload) ───────────────────────────────────
router.post("/lessons/:lessonId/video/init", courseController.initVideoUpload);
router.post("/lessons/:lessonId/video/complete", courseController.completeVideoUpload);
router.delete("/resources/:resourceId", courseController.deleteResource);

export default router;

import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as introVideoController from "./introVideo.controller.js";

const router = Router();

// All admin routes require ADMIN role or higher
router.use(auth("ADMIN"));

// ─── Intro Video (singleton, two-step direct upload) ─────────────────────────
router.get("/intro-video", introVideoController.getIntroVideo);
router.post("/intro-video/init", introVideoController.initUpload);
router.post("/intro-video/complete", introVideoController.completeUpload);

export default router;

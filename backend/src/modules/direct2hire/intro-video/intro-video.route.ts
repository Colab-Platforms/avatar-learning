import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as introVideoController from "./intro-video.controller.js";

const router = Router();

router.get("/", auth("USER"), introVideoController.getStudentIntro);
router.get("/playback", auth("USER"), introVideoController.getPlayback);
router.post("/complete", auth("USER"), introVideoController.markCompleted);

export default router;

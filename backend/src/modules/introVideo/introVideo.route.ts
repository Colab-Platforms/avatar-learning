import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as introVideoController from "./introVideo.controller.js";

const router = Router();

router.get("/", auth("USER"), introVideoController.getPlayback);
router.post("/watch", auth("USER"), introVideoController.markWatched);

export default router;

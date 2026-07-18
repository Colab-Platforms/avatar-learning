import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as mockInterviewController from "./mock-interview.controller.js";

const router = Router();

router.get("/", auth("USER"), mockInterviewController.getMyInterview);
router.post("/request", auth("USER"), mockInterviewController.requestInterview);

export default router;

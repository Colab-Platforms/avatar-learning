import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireDirect2HireAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as mockInterviewController from "./mock-interview.controller.js";

const router = Router();

router.use(auth("USER"), requireDirect2HireAccess);

router.get("/", mockInterviewController.getMyInterview);
router.post("/request", mockInterviewController.requestInterview);

export default router;

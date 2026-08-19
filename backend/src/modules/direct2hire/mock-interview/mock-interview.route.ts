import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireJobPlacementAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as mockInterviewController from "./mock-interview.controller.js";

const router = Router();
const userAuth = [auth("USER"), requireJobPlacementAccess] as const;

router.get("/", ...userAuth, mockInterviewController.getMyInterview);
router.post("/request", ...userAuth, mockInterviewController.requestInterview);

export default router;

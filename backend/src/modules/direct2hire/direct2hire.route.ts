import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireCompleteProfile } from "@/middlewares/requireCompleteProfile.js";
import { createOrder, getStatus } from "./direct2hire.controller.js";
import * as direct2hireController from "./direct2hire.controller.js";
import counsellingRoutes from "./counselling/counselling.route.js";
import leadRoutes from "./lead/lead.route.js";
import recommendationRoutes from "./recommendation/recommendation.route.js";
import courseSelectionRoutes from "./course-selection/course-selection.route.js";
import internshipRoutes from "./internship/internship.route.js";
import mockInterviewRoutes from "./mock-interview/mock-interview.route.js";
import jobPlacementRoutes from "./job-placement/job-placement.route.js";
import introVideoRoutes from "./intro-video/intro-video.route.js";

const router = Router();

// All Direct2Hire student APIs require a completed profile
router.use(auth("USER"), requireCompleteProfile);

router.get("/status", getStatus);
router.get("/pricing", direct2hireController.getPricing);
router.post("/create-order", createOrder);
router.post(
  "/assessment-counselling/create-order",
  direct2hireController.createAssessmentCounsellingOrder,
);
router.get("/referral-discount", direct2hireController.getReferralDiscount);
router.get("/me", direct2hireController.getMyStatus);

router.use("/intro-video", introVideoRoutes);
router.use("/counselling", counsellingRoutes);
router.use("/lead", leadRoutes);
router.use("/recommendation", recommendationRoutes);
router.use("/course-selection", courseSelectionRoutes);
router.use("/internship", internshipRoutes);
router.use("/mock-interview", mockInterviewRoutes);
router.use("/job-placement", jobPlacementRoutes);

if (process.env.NODE_ENV !== "production") {
  router.post("/dev/continue-as-paid", direct2hireController.devContinueAsPaid);
}

export default router;

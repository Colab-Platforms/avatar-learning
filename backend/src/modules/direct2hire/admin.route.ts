import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as direct2hireController from "./direct2hire.controller.js";
import * as direct2hireAdminController from "./admin/admin.controller.js";
import * as placementController from "../course/placement/placement.controller.js";
import * as mockInterviewController from "./mock-interview/mock-interview.controller.js";
import * as jobPlacementController from "./job-placement/job-placement.controller.js";
import internshipAdminRoutes from "./internship/internship.admin.route.js";
import * as introVideoController from "./intro-video/intro-video.controller.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/direct2hire/intro-video", introVideoController.getAdminIntro);
router.post(
  "/direct2hire/intro-video/init",
  introVideoController.initUpload,
);
router.post(
  "/direct2hire/intro-video/complete",
  introVideoController.completeUpload,
);
router.delete("/direct2hire/intro-video", introVideoController.deleteIntro);

router.get("/direct2hire", direct2hireController.getAllEnrollments);
router.get(
    "/direct2hire/assessment-counselling",
    direct2hireController.getAllAssessmentCounsellingPurchases,
);
router.patch(
    "/direct2hire/:enrollmentId/mark-paid",
    direct2hireController.markPaid,
);
router.patch(
    "/direct2hire/:enrollmentId/mark-refunded",
    direct2hireController.markRefunded,
);
router.get(
    "/direct2hire/students",
    direct2hireAdminController.getAllStudents,
);
router.get(
    "/direct2hire/students/:userId",
    direct2hireAdminController.getStudentProfile,
);
router.post(
    "/direct2hire/students/:userId/payment-link",
    direct2hireAdminController.generatePaymentLink,
);
router.patch(
    "/direct2hire/students/:userId/booking/confirm",
    direct2hireAdminController.confirmBooking,
);
router.patch(
    "/direct2hire/students/:userId/counselling/complete",
    direct2hireAdminController.markCounsellingCompleted,
);
router.get(
    "/direct2hire/students/:userId/counselling/feedback",
    direct2hireAdminController.getCounsellingFeedback,
);
router.put(
    "/direct2hire/students/:userId/counselling/feedback",
    direct2hireAdminController.saveCounsellingFeedback,
);
router.get(
    "/direct2hire/students/:userId/placement/summary",
    placementController.getStudentPlacementSummary,
);
router.get(
    "/direct2hire/students/:userId/placement/attempts",
    placementController.getStudentPlacementAttempts,
);
router.get(
    "/direct2hire/students/:userId/placement/overrides",
    placementController.getStudentPlacementOverrides,
);
router.post(
    "/direct2hire/students/:userId/placement/grant-attempts",
    placementController.grantStudentPlacementAttempts,
);

router.get(
    "/direct2hire/students/:userId/mock-interview",
    mockInterviewController.getStudentInterview,
);
router.patch(
    "/direct2hire/students/:userId/mock-interview/schedule",
    mockInterviewController.scheduleInterview,
);
router.patch(
    "/direct2hire/students/:userId/mock-interview/complete",
    mockInterviewController.markInterviewCompleted,
);
router.patch(
    "/direct2hire/students/:userId/mock-interview/feedback",
    mockInterviewController.publishInterviewFeedback,
);
router.patch(
    "/direct2hire/students/:userId/mock-interview/cancel",
    mockInterviewController.cancelInterview,
);

router.get(
    "/direct2hire/students/:userId/job-placement",
    jobPlacementController.getStudentJourney,
);

router.use("/direct2hire", internshipAdminRoutes);

export default router;

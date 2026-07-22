import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as direct2hireController from "./direct2hire.controller.js";
import * as direct2hireAdminController from "./admin/admin.controller.js";
import * as placementController from "../course/placement/placement.controller.js";
import * as mockInterviewController from "./mock-interview/mock-interview.controller.js";
import internshipAdminRoutes from "./internship/internship.admin.route.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/direct2hire", direct2hireController.getAllEnrollments);
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

router.use("/direct2hire", internshipAdminRoutes);

export default router;

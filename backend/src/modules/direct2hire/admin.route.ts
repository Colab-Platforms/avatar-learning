import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as direct2hireController from "./direct2hire.controller.js";
import * as direct2hireAdminController from "./admin/admin.controller.js";
import internshipAdminRoutes from "./internship/internship.admin.route.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/direct2hire", direct2hireController.getAllEnrollments);
router.patch(
    "/direct2hire/:enrollmentId/mark-paid",
    direct2hireController.markPaid,
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

router.use("/direct2hire", internshipAdminRoutes);

export default router;

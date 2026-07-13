import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as direct2hireController from "./direct2hire.controller.js";
import * as direct2hireAdminController from "./admin/admin.controller.js";

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

export default router;

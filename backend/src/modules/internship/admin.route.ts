import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as internshipController from "./internship.controller.js";

const router = Router();

// All admin routes require ADMIN role or higher
router.use(auth("ADMIN"));

// ─── Internships ──────────────────────────────────────────────────────────────
router.get("/internships", internshipController.adminGetAll);
router.post("/internships", internshipController.createInternship);
router.get("/internships/:id", internshipController.adminGetOne);
router.put("/internships/:id", internshipController.updateInternship);
router.delete("/internships/:id", internshipController.deleteInternship);
router.patch("/internships/:id/publish", internshipController.togglePublish);

// ─── Applications ─────────────────────────────────────────────────────────────
router.get(
  "/internships/:id/applications",
  internshipController.getApplications,
);
router.patch(
  "/applications/:applicationId/status",
  internshipController.updateApplicationStatus,
);

export default router;

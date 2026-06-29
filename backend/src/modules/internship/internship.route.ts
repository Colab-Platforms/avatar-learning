import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as internshipController from "./internship.controller.js";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", internshipController.getInternships);

// ─── Authenticated User Routes (must be before /:slug to avoid conflicts) ────
router.get("/me/applications", auth("USER"), internshipController.getMyApplications);
router.post(
  "/:internshipId/apply",
  auth("USER"),
  internshipController.applyInternship,
);
router.delete(
  "/:internshipId/apply",
  auth("USER"),
  internshipController.withdrawApplication,
);
router.get(
  "/:internshipId/application",
  auth("USER"),
  internshipController.checkApplication,
);

// ─── Public slug route (must be last — catchall param) ───────────────────────
router.get("/:slug", internshipController.getInternshipBySlug);

export default router;

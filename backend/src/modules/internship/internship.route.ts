import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireCompleteProfile } from "@/middlewares/requireCompleteProfile.js";
import * as internshipController from "./internship.controller.js";

const router = Router();
const userAuth = [auth("USER"), requireCompleteProfile] as const;

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", internshipController.getInternships);

// ─── Authenticated User Routes (must be before /:slug to avoid conflicts) ────
router.get("/me/applications", ...userAuth, internshipController.getMyApplications);
router.post(
  "/:internshipId/apply",
  ...userAuth,
  internshipController.applyInternship,
);
router.delete(
  "/:internshipId/apply",
  ...userAuth,
  internshipController.withdrawApplication,
);
router.get(
  "/:internshipId/application",
  ...userAuth,
  internshipController.checkApplication,
);

// ─── Public slug route (must be last — catchall param) ───────────────────────
router.get("/:slug", internshipController.getInternshipBySlug);

export default router;

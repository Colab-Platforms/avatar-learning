import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import {
  requireAssessmentCounsellingAccess,
  requireDirect2HireAccess,
} from "../assessmentCounsellingAccess.middleware.js";
import * as counsellingController from "./counselling.controller.js";

const router = Router();

router.use(auth("USER"));

// Assessment questionnaire — every paid plan (Basic included) gets this.
router.get("/", requireDirect2HireAccess, counsellingController.getMyProfile);
router.post(
  "/",
  requireDirect2HireAccess,
  counsellingController.createProfile,
);
router.put(
  "/",
  requireDirect2HireAccess,
  counsellingController.updateProfile,
);

// Live 1-on-1 counselling — Standard/Pro only; Basic gets recorded instead.
router.get(
  "/booking",
  requireAssessmentCounsellingAccess,
  counsellingController.getBooking,
);
router.post(
  "/booking",
  requireAssessmentCounsellingAccess,
  counsellingController.createBooking,
);
router.get(
  "/feedback",
  requireAssessmentCounsellingAccess,
  counsellingController.getMyFeedback,
);

export default router;

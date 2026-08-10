import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireAssessmentCounsellingAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as counsellingController from "./counselling.controller.js";

const router = Router();

router.use(auth("USER"), requireAssessmentCounsellingAccess);

router.get("/", counsellingController.getMyProfile);
router.post("/", counsellingController.createProfile);
router.put("/", counsellingController.updateProfile);

router.get("/booking", counsellingController.getBooking);
router.post("/booking", counsellingController.createBooking);
router.get("/feedback", counsellingController.getMyFeedback);

export default router;

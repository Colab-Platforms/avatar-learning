import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireDirect2HireAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as jobPlacementController from "./job-placement.controller.js";

const router = Router();

router.use(auth("USER"), requireDirect2HireAccess);

router.get("/", jobPlacementController.getMyJourney);
router.post("/", jobPlacementController.createEntry);
router.put("/:entryId", jobPlacementController.updateEntry);
router.delete("/:entryId", jobPlacementController.deleteEntry);

export default router;

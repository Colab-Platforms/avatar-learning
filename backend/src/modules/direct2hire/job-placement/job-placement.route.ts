import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireJobPlacementAccess } from "../assessmentCounsellingAccess.middleware.js";
import * as jobPlacementController from "./job-placement.controller.js";

const router = Router();
const userAuth = [auth("USER"), requireJobPlacementAccess] as const;

router.get("/", ...userAuth, jobPlacementController.getMyJourney);
router.post("/", ...userAuth, jobPlacementController.createEntry);
router.put("/:entryId", ...userAuth, jobPlacementController.updateEntry);
router.delete("/:entryId", ...userAuth, jobPlacementController.deleteEntry);

export default router;

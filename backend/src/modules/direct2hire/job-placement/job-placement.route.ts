import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as jobPlacementController from "./job-placement.controller.js";

const router = Router();

router.get("/", auth("USER"), jobPlacementController.getMyJourney);
router.post("/", auth("USER"), jobPlacementController.createEntry);
router.put("/:entryId", auth("USER"), jobPlacementController.updateEntry);
router.delete("/:entryId", auth("USER"), jobPlacementController.deleteEntry);

export default router;

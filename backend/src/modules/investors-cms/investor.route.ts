import { Router } from "express";
import * as investorController from "./investor.controller.js";

const router = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get("/", investorController.getPublicCategories);

export default router;

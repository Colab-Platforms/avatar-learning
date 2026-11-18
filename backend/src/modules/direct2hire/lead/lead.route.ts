import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as leadController from "./lead.controller.js";

const router = Router();

router.get("/", auth("USER"), leadController.getMyLead);
router.post("/", auth("USER"), leadController.upsertLead);

export default router;

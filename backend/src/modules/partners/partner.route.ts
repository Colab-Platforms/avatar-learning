import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as partnerController from "./partner.controller.js";

const router = Router();

router.post("/apply", auth("USER"), partnerController.apply);
router.get("/me", auth("USER"), partnerController.getMine);
router.get("/me/referrals", auth("USER"), partnerController.getMyReferrals);
router.post("/me/claim", auth("USER"), partnerController.claim);

export default router;

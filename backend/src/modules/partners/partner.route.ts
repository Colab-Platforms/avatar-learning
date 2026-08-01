import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireCompleteProfile } from "@/middlewares/requireCompleteProfile.js";
import * as partnerController from "./partner.controller.js";

const router = Router();

const userAuth = [auth("USER"), requireCompleteProfile] as const;

router.get("/kyc/upload/sign", ...userAuth, partnerController.signKycUpload);
router.post("/apply", ...userAuth, partnerController.apply);
router.get("/me", ...userAuth, partnerController.getMine);
router.get("/me/referrals", ...userAuth, partnerController.getMyReferrals);
router.post("/me/claim", ...userAuth, partnerController.claim);

export default router;

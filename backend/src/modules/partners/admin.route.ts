import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as partnerController from "./partner.controller.js";

const router = Router();

router.use(auth("ADMIN"));

// Static routes must come before /partners/:id to avoid being shadowed
router.get("/partners/claims", partnerController.adminListClaims);
router.patch("/partners/claims/:claimId/mark-paid", partnerController.adminMarkClaimPaid);

router.get("/partners", partnerController.adminList);
router.get("/partners/:id", partnerController.adminGetById);
router.patch("/partners/:id/approve", partnerController.adminApprove);
router.patch("/partners/:id/reject", partnerController.adminReject);

export default router;

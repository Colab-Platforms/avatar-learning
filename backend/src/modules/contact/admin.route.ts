import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as contactController from "./contact.controller.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/contacts", contactController.adminGetAll);
router.get("/contacts/unread-count", contactController.adminGetUnreadCount);
router.patch("/contacts/:id/read", contactController.adminMarkRead);
router.delete("/contacts/:id", contactController.adminDelete);

export default router;

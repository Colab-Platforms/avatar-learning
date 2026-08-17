import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as adminWebinarController from "./admin.controller.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/webinar/registrations", adminWebinarController.adminGetAll);
router.get("/webinar/registrations/:id", adminWebinarController.adminGetById);

export default router;

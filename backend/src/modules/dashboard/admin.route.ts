import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as dashboardController from "./dashboard.controller.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/dashboard/overview", dashboardController.adminGetOverview);

export default router;

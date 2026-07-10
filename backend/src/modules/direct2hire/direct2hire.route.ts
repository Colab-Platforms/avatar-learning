import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as direct2hireController from "./direct2hire.controller.js";
import counsellingRoutes from "./counselling/counselling.route.js";

const router = Router();

router.get("/me", auth("USER"), direct2hireController.getMyStatus);
router.use("/counselling", counsellingRoutes);

export default router;

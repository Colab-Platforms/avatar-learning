import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as direct2hireController from "./direct2hire.controller.js";

const router = Router();

router.get("/me", auth("USER"), direct2hireController.getMyStatus);

export default router;

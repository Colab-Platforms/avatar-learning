import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as counsellingController from "./counselling.controller.js";

const router = Router();

router.get("/", auth("USER"), counsellingController.getMyProfile);
router.post("/", auth("USER"), counsellingController.createProfile);
router.put("/", auth("USER"), counsellingController.updateProfile);

export default router;

import { Router } from "express";
import * as contactController from "./contact.controller.js";

const router = Router();

router.post("/", contactController.submitContact);

export default router;

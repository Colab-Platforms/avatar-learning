import { Router } from "express";
import * as chatbotController from "./chatbot.controller.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Chatbot service is healthy" });
});

router.post("/", chatbotController.chat);
router.delete("/:sessionId", chatbotController.clearChatSession);

export default router;

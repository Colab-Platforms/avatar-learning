import { Router } from "express";
import * as chatbotController from "./chatbot.controller.js";
import { createLimiter } from "@/middlewares/rateLimiter.js";

const router = Router();

// Each chat message triggers an LLM call (cost + latency), so this is
// tighter than a typical API route — generous enough for a real conversation,
// tight enough to block scripted abuse.
const chatLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, //15 minutes
  max: 10,
  message:
    "You're sending messages too quickly. Please wait a bit and try again.",
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Chatbot service is healthy" });
});

router.post("/", chatLimiter, chatbotController.chat);
router.delete("/:sessionId", chatLimiter, chatbotController.clearChatSession);

export default router;

import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import ChatbotService from "./chatbot.service.js";
import { validateChatRequestSchema } from "./chatbot.validators.js";

const chatbotService = new ChatbotService();

export const chat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateChatRequestSchema(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }

    const result = await chatbotService.ask(value);
    sendResponse(
      res,
      true,
      result,
      "Chatbot response generated",
      STATUS_CODES.OK,
    );
  } catch (error: any) {
    sendResponse(
      res,
      false,
      null,
      error.message,
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

export const clearChatSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawSessionId = req.params.sessionId;
    const sessionId =
      typeof rawSessionId === "string" ? rawSessionId.trim() : "";
    if (!sessionId) {
      sendResponse(
        res,
        false,
        null,
        "Session id is required",
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }

    chatbotService.clearSession(sessionId);
    sendResponse(res, true, null, "Chat session cleared", STATUS_CODES.OK);
  } catch (error: any) {
    sendResponse(
      res,
      false,
      null,
      error.message,
      error.statusCode ?? STATUS_CODES.SERVER_ERROR,
    );
  }
};

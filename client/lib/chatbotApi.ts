import { apiPost } from "./api";
import type { ApiResponse } from "@/types";

export interface ChatbotPayload {
  message: string;
  sessionId?: string;
  user?: {
    name?: string;
    email?: string;
    role?: string;
    interest?: string;
  };
}

export interface ChatbotApiReply {
  reply: string;
  sessionId: string;
  historyLength: number;
}

export async function sendChatbotMessage(
  payload: ChatbotPayload,
): Promise<ChatbotApiReply> {
  const response = await apiPost<ApiResponse<ChatbotApiReply>>(
    "/chatbot",
    payload,
  );

  if (!response.status) {
    throw new Error(response.message || "Chatbot request failed.");
  }

  return response.data;
}

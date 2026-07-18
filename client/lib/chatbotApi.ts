import { AxiosError } from "axios";
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

export class ChatbotError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ChatbotError";
    this.status = status;
  }
}

export async function sendChatbotMessage(
  payload: ChatbotPayload,
): Promise<ChatbotApiReply> {
  try {
    const response = await apiPost<ApiResponse<ChatbotApiReply>>(
      "/chatbot",
      payload,
    );

    if (!response.status) {
      throw new ChatbotError(response.message || "Chatbot request failed.");
    }

    return response.data;
  } catch (err) {
    if (err instanceof ChatbotError) throw err;

    if (err instanceof AxiosError) {
      const status = err.response?.status;
      const serverMessage = (err.response?.data as ApiResponse<unknown> | undefined)
        ?.message;
      const fallback =
        status === 429
          ? "You're sending messages too quickly. Please wait a moment and try again."
          : "Something went wrong. Please try again.";
      throw new ChatbotError(serverMessage || fallback, status);
    }

    throw err;
  }
}

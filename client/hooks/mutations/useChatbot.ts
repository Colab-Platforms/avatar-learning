"use client";

import { useMutation } from "@tanstack/react-query";
import {
  sendChatbotMessage,
  type ChatbotApiReply,
  type ChatbotPayload,
} from "@/lib/chatbotApi";

export function useChatbotMutation() {
  return useMutation<ChatbotApiReply, Error, ChatbotPayload>({
    mutationFn: sendChatbotMessage,
    retry: 1,
    retryDelay: 2000,
  });
}

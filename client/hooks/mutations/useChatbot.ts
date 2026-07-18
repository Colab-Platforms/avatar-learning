"use client";

import { useMutation } from "@tanstack/react-query";
import {
  sendChatbotMessage,
  ChatbotError,
  type ChatbotApiReply,
  type ChatbotPayload,
} from "@/lib/chatbotApi";

export function useChatbotMutation() {
  return useMutation<ChatbotApiReply, ChatbotError, ChatbotPayload>({
    mutationFn: sendChatbotMessage,
    retry: (failureCount, error) => {
      if (error instanceof ChatbotError && error.status === 429) return false;
      return failureCount < 1;
    },
    retryDelay: 2000,
  });
}

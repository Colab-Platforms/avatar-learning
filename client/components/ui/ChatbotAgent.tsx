"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  Loader,
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { layout, prepare } from "@chenglou/pretext";
import { useChatbotMutation } from "@/hooks/mutations/useChatbot";
import type { ChatbotPayload } from "@/lib/chatbotApi";

type ChatMessageType = "user" | "bot";

type ChatMessage = {
  id: string;
  type: ChatMessageType;
  text: string;
  timestamp: string;
  isError?: boolean;
  canRetry?: boolean;
};

const STORAGE_KEY = "avatar-chatbot-session";
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    type: "bot",
    text: "🤖 **Welcome to Avatar Learning Assistant!**\n\nAsk me about courses, enrollment, certification, or the platform and I’ll give you a fast answer.",
    timestamp: new Date().toISOString(),
  },
];

export default function ChatbotAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const mutation = useChatbotMutation();

  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSessionId(stored);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (mutation.isError && mutation.error) {
      const failed = {
        id: `error-${Date.now()}`,
        type: "bot" as const,
        text: `⚠️ **Error:** ${mutation.error.message}`,
        timestamp: new Date().toISOString(),
        isError: true,
        canRetry: true,
      };
      setMessages((prev) => [...prev, failed]);
    }
  }, [mutation.isError, mutation.error]);

  const computedHeights = useMemo(() => {
    return new Map(
      messages.map((message) => {
        try {
          const prepared = prepare(message.text, "16px Inter", {
            whiteSpace: "pre-wrap",
          });
          const { height } = layout(prepared, 280, 24);
          return [message.id, Math.max(height, 48) + 16];
        } catch {
          return [message.id, 56];
        }
      }),
    );
  }, [messages]);

  const handleSendMessage = async (
    event?: React.FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    const userText = inputValue.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setErrorHint(null);

    await mutation
      .mutateAsync({
        message: userText,
        sessionId: sessionId || undefined,
        user: {},
      } as ChatbotPayload)
      .then((reply) => {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          type: "bot",
          text: reply.reply,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, botMessage]);

        if (reply.sessionId && reply.sessionId !== sessionId) {
          setSessionId(reply.sessionId);
          window.sessionStorage.setItem(STORAGE_KEY, reply.sessionId);
        }
      })
      .catch((error) => {
        setErrorHint(error.message);
      });
  };

  const retryLastMessage = async () => {
    const lastUser = [...messages]
      .reverse()
      .find((message) => message.type === "user");
    if (!lastUser) return;
    setErrorHint(null);
    await mutation
      .mutateAsync({
        message: lastUser.text,
        sessionId: sessionId || undefined,
        user: {},
      } as ChatbotPayload)
      .then((reply) => {
        const botMessage: ChatMessage = {
          id: `bot-retry-${Date.now()}`,
          type: "bot",
          text: reply.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMessage]);
      })
      .catch((error) => {
        setErrorHint(error.message);
      });
  };

  const renderFormattedMessage = (text: string) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const formatted = escaped
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");

    return (
      <div
        dangerouslySetInnerHTML={{ __html: formatted }}
        className="whitespace-pre-wrap text-sm leading-6"
      />
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="fixed md:right-20 md:bottom-20 right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-white shadow-[0_22px_50px_rgba(14,165,233,0.3)] transition-transform duration-300 hover:scale-105"
        style={{
          animation: "chatbotFloat 2400ms ease-in-out infinite alternate",
        }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-28 left-4 right-4 md:mb-4 z-40 mx-auto w-[min(95vw,420px)] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/95 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:right-20 sm:left-auto"
          style={{ animation: "chatbotPanelReveal 220ms ease-out forwards" }}
        >
          <div className="rounded-t-[28px] border-b border-cyan-500/12 bg-gradient-to-br from-slate-900/95 to-slate-950/85 px-5 py-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-500/20 to-sky-500/12 text-cyan-300 shadow-inner shadow-cyan-500/10 ring-1 ring-cyan-400/15">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Learning assistant
                  </p>
                  <p className="truncate text-base font-semibold text-white">
                    AI course companion
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
                Live
              </span>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-4 py-5 sm:max-h-[420px]">
            <div className="mb-4 space-y-3 rounded-3xl bg-slate-950/70 p-4 text-sm text-slate-400 ring-1 ring-white/5">
              <p className="font-semibold text-slate-100">Tip</p>
              <p className="text-[13px] leading-5">
                You can ask about course paths, enrollment timing, project
                support, or certification details.
              </p>
            </div>
            {messages.map((message) => {
              const minHeight = computedHeights.get(message.id) ?? 56;
              const isUser = message.type === "user";

              return (
                <div
                  key={message.id}
                  className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    style={{ minHeight }}
                    className={`min-w-[140px] max-w-[88%] rounded-[28px] px-4 py-3.5 text-sm leading-6 shadow-xl shadow-slate-950/20 transition-all duration-300 ${
                      isUser
                        ? "bg-gradient-to-br from-sky-500 via-cyan-500 to-teal-400 text-white ring-1 ring-cyan-300/20 shadow-[0_20px_40px_rgba(14,165,233,0.17)]"
                        : message.isError
                          ? "bg-red-950/95 border border-red-700/60 text-red-100 ring-1 ring-red-500/20 shadow-[0_20px_40px_rgba(220,38,38,0.16)]"
                          : "bg-slate-900/95 border border-white/10 text-slate-100 ring-1 ring-white/10 shadow-[0_20px_40px_rgba(15,23,42,0.22)]"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    ) : (
                      renderFormattedMessage(message.text)
                    )}
                    <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.canRetry && (
                        <button
                          type="button"
                          onClick={retryLastMessage}
                          className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-xs text-cyan-300 transition hover:bg-white/10"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="rounded-b-3xl border-t border-white/10 bg-slate-950 px-4 py-4"
          >
            <div className="flex gap-3">
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask about a course, mentor, or AI learning path..."
                disabled={mutation.isPending}
                className="flex-1 rounded-full border border-white/10 bg-slate-900/95 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || mutation.isPending}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mutation.isPending ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            {errorHint && (
              <p className="mt-2 text-xs text-red-300">{errorHint}</p>
            )}
          </form>
        </div>
      )}
    </>
  );
}

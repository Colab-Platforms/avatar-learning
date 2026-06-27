"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  Loader,
  Shield,
  RefreshCw,
  Sparkles,
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
      .replace(
        /\*\*(.*?)\*\*/g,
        "<strong class='font-semibold text-cyan-200'>$1</strong>",
      )
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");

    return (
      <div
        dangerouslySetInnerHTML={{ __html: formatted }}
        className="whitespace-pre-wrap text-sm leading-relaxed"
      />
    );
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="fixed md:right-8 md:bottom-8 right-4 bottom-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6 transform rotate-0 transition-transform duration-200" />
        ) : (
          <Bot className="h-6 w-6 transform scale-110" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 mx-auto flex flex-col w-[min(calc(100vw-2rem),400px)] h-[580px] max-h-[85vh] overflow-hidden rounded-3xl border border-slate-800 shadow-2xl bg-slate-950/95 backdrop-blur-xl sm:right-8 sm:left-auto"
          style={{
            animation:
              "chatbotPanelReveal 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Header */}
          <div className="relative border-b border-slate-800/60 bg-slate-900/40 px-5 py-4 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Learning assistant
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    AI Course Companion
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* Chat Space Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Quick Context Tip Box */}
            <div className="flex gap-2.5 rounded-2xl bg-slate-900/50 p-3.5 text-xs text-slate-400 ring-1 ring-slate-800/80">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200 mb-0.5">Quick Tip</p>
                <p className="leading-normal text-slate-400">
                  You can ask about course tracks, module support, enrollment
                  windows, or certificate completions.
                </p>
              </div>
            </div>

            {/* Rendered Messages */}
            {messages.map((message) => {
              const minHeight = computedHeights.get(message.id) ?? 56;
              const isUser = message.type === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    style={{ minHeight }}
                    className={`max-w-[85%] flex flex-col rounded-2xl px-4 py-3 text-sm shadow-md transition-all ${
                      isUser
                        ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-cyan-950/10"
                        : message.isError
                          ? "bg-red-950/40 border border-red-900/50 text-red-200 rounded-tl-none"
                          : "bg-slate-900/80 border border-slate-800/80 text-slate-100 rounded-tl-none"
                    }`}
                  >
                    <div className="flex-1">
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.text}
                        </p>
                      ) : (
                        renderFormattedMessage(message.text)
                      )}
                    </div>

                    <div
                      className={`mt-2 flex items-center justify-between gap-4 text-[10px] ${isUser ? "text-cyan-200/70" : "text-slate-400"}`}
                    >
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
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400 transition hover:bg-white/10"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
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

          {/* Form Input Footer Container */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-slate-900 bg-slate-950 px-4 py-3.5"
          >
            <div className="flex items-center gap-2 bg-slate-900/60 rounded-full border border-slate-800 px-3 py-1.5 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask something..."
                disabled={mutation.isPending}
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-slate-500 outline-none disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || mutation.isPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md shadow-cyan-500/10 transition hover:bg-cyan-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {mutation.isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {errorHint && (
              <p className="mt-2 pl-3 text-xs text-red-400 font-medium">
                {errorHint}
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}

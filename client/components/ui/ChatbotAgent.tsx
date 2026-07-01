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
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
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
      {/* Ripples rendered at fixed position outside button */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="chatbot-ripple"
          style={{ top: r.y, left: r.x }}
        />
      ))}

      {/* Floating Toggle Button */}
      <div className="fixed md:right-19 md:bottom-16 right-4 bottom-12 z-50 group">
        {/* idle pulse rings and backlight — only when closed */}
        {!isOpen && (
          <>
            <div className="chatbot-backlight" />
            <span className="chatbot-ring chatbot-ring-1" />
            <span className="chatbot-ring chatbot-ring-2" />
            <span className="chatbot-ring chatbot-ring-3" />
          </>
        )}

        <button
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const id = Date.now();
            setRipples((prev) => [...prev, { id, x: cx, y: cy }]);
            setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 850);
            setIsOpen((c) => !c);
          }}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-300
            ${!isOpen ? "chatbot-toggle-button hover:scale-110" : "hover:rotate-90 hover:scale-105 active:scale-95"}`}
          style={{
            background: "linear-gradient(135deg, #00C8FF 0%, #0062FF 100%)",
            boxShadow: isOpen ? "0 6px 20px rgba(0, 0, 0, 0.4)" : undefined,
          }}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-200" />
          ) : (
            <>
              <Bot className="h-6 w-6 scale-110" />
              {/* Hover Tooltip */}
              <div className="absolute right-full mr-4 top-1/2 -translate-y-[58%] whitespace-nowrap opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                <div className="px-4 py-2 rounded-2xl text-xs font-semibold text-white/95 border border-cyan-500/30 shadow-xl flex items-center bg-[#0b1528]/95 backdrop-blur-md">
                  <span>Try using Ava!</span>
                  <div className="absolute top-1/2 -translate-y-1/2 left-full w-2 h-2 border-r border-t border-cyan-500/30 bg-[#0b1528] rotate-45 -ml-1" />
                </div>
              </div>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed bottom-28 sm:bottom-32 left-4 right-4 z-50 mx-auto flex flex-col w-[min(calc(100vw-2rem),400px)] h-[580px] max-h-[85vh] overflow-hidden rounded-3xl chatbot-panel sm:right-8 sm:left-auto"
        >
          {/* Header */}
          <div
            className="relative px-5 py-4 backdrop-blur-md"
            style={{
              borderBottom: "1px solid rgba(0,200,255,0.12)",
              background: "rgba(8,16,30,0.85)",
            }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top right,rgba(0,200,255,0.08) 0%,transparent 70%)" }} />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-[#00C8FF]"
                  style={{ background: "rgba(0,200,255,0.15)", border: "1px solid rgba(0,200,255,0.35)" }}>
                  <Shield className="h-5 w-5 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                    Learning assistant
                  </p>
                  <p className="truncate text-sm font-semibold text-white">
                    AI Course Companion
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-emerald-400"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Space Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chatbot-messages">
            {/* Quick Context Tip Box */}
            <div className="flex gap-2.5 rounded-2xl p-3.5 text-xs"
              style={{ background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.20)" }}>
              <Sparkles className="h-4 w-4 text-[#00C8FF] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white/85 mb-0.5">Quick Tip</p>
                <p className="leading-normal text-white/55">
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
                  className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5 items-start`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-950/85 border border-cyan-500/30 text-[#00C8FF] shadow-md">
                      {message.isError ? (
                        <Shield className="h-4.5 w-4.5 text-red-400" />
                      ) : (
                        <Bot className="h-4.5 w-4.5" />
                      )}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] flex flex-col rounded-2xl px-4 py-3 text-sm transition-all ${
                      isUser
                        ? "text-white rounded-tr-none"
                        : message.isError
                          ? "text-red-300 rounded-tl-none"
                          : "text-white/90 rounded-tl-none"
                    }`}
                    style={
                      isUser
                        ? {
                            minHeight,
                            background: "linear-gradient(135deg,#00C8FF 0%,#0062FF 100%)",
                            boxShadow: "0 4px 16px rgba(0,200,255,0.18)",
                          }
                        : message.isError
                          ? { minHeight, background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.35)" }
                          : { minHeight, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,200,255,0.12)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }
                    }
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
                      className={`mt-2 flex items-center justify-between gap-4 text-[10px] ${isUser ? "text-white/50" : "text-white/25"}`}
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
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-[#00C8FF] transition hover:bg-white/10"
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

            {/* Typing Indicator */}
            {mutation.isPending && (
              <div className="flex justify-start gap-2.5 items-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-950/85 border border-cyan-500/30 text-[#00C8FF] shadow-md animate-pulse">
                  <Bot className="h-4.5 w-4.5 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl px-4 py-3 bg-white/[0.05] border border-cyan-500/10 shadow-md">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Footer Container */}
          <form
            onSubmit={handleSendMessage}
            className="px-4 py-3.5"
            style={{ borderTop: "1px solid rgba(0,200,255,0.12)", background: "rgba(8,16,30,0.98)" }}
          >
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(0,200,255,0.25)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              <input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask something..."
                disabled={mutation.isPending}
                className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/40 outline-none disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || mutation.isPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                style={{ background: "linear-gradient(135deg,#00C8FF 0%,#0062FF 100%)", boxShadow: "0 2px 12px rgba(0,200,255,0.25)" }}
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

"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  X,
  Send,
  Loader,
  RefreshCw,
  Sparkles,
  Bot,
  RotateCcw,
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
  isNew?: boolean;
};

const STORAGE_KEY = "avatar-chatbot-session";
const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    type: "bot",
    text: "Welcome to **Avatar Learning**! I'm **Ava**, your AI learning companion.\n\nAsk me about courses, enrollment, certifications, or anything about the platform.",
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTION_CHIPS = [
  "Tell me about course tracks",
  "How does certification work?",
  "What is Avatar Learning?",
  "How do I enroll?",
];

/* ── Typewriter hook ── */
function useTypewriter(text: string, enabled: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, enabled, speed]);

  return displayed;
}

/* ── Bot bubble with typewriter ── */
function BotBubble({
  message,
  isNew,
  computedHeight,
  onRetry,
}: {
  message: ChatMessage;
  isNew: boolean;
  computedHeight: number;
  onRetry: () => void;
}) {
  const displayed = useTypewriter(message.text, isNew, 14);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-start gap-2.5 items-start"
    >
      {/* Avatar */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm"
        style={{
          background: message.isError
            ? "rgba(220,38,38,0.08)"
            : "rgba(42,120,204,0.08)",
          border: message.isError
            ? "1px solid rgba(220,38,38,0.25)"
            : "1px solid rgba(42,120,204,0.25)",
        }}
      >
        <Bot
          className="h-4 w-4"
          style={{ color: message.isError ? "#dc2626" : "#2A78CC" }}
        />
      </div>

      {/* Bubble */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-[82%] rounded-2xl rounded-tl-none px-4 py-3 text-sm overflow-hidden"
        style={
          message.isError
            ? {
                background: "rgba(220,38,38,0.06)",
                border: "1px solid rgba(220,38,38,0.20)",
              }
            : {
                background: "#F8FAFC",
                border: "1px solid #D3DCE6",
                borderLeft: "2px solid #2A78CC",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }
        }
      >
        <div
          className={`leading-relaxed ${message.isError ? "text-red-600" : "text-text"} chatbot-markdown`}
        >
          <ReactMarkdown>{displayed}</ReactMarkdown>
        </div>

        <div className="mt-2 flex items-center justify-between gap-4 text-[10px] text-text-subtle">
          <span>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {message.canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-500 transition hover:bg-brand-100"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              Retry
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ChatbotAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const [newBotId, setNewBotId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  const mutation = useChatbotMutation();

  const showSuggestions = messages.length === 1 && messages[0].id === "welcome";

  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) setSessionId(stored);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "instant" }), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        toggleRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
      setNewBotId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    if (mutation.isError && mutation.error) {
      const failed: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "bot",
        text: `**Error:** ${mutation.error.message}`,
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
          const prepared = prepare(message.text, "14px Inter", {
            whiteSpace: "pre-wrap",
          });
          const { height } = layout(prepared, 260, 20);
          return [message.id, Math.max(height, 40) + 24];
        } catch {
          return [message.id, 56];
        }
      }),
    );
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setErrorHint(null);

      await mutation
        .mutateAsync({
          message: text.trim(),
          sessionId: sessionId || undefined,
          user: {},
        } as ChatbotPayload)
        .then((reply) => {
          const id = `bot-${Date.now()}`;
          const botMessage: ChatMessage = {
            id,
            type: "bot",
            text: reply.reply,
            timestamp: new Date().toISOString(),
            isNew: true,
          };
          setNewBotId(id);
          setMessages((prev) => [...prev, botMessage]);
          if (reply.sessionId && reply.sessionId !== sessionId) {
            setSessionId(reply.sessionId);
            window.sessionStorage.setItem(STORAGE_KEY, reply.sessionId);
          }
        })
        .catch((error) => {
          setErrorHint(error.message);
        });
    },
    [mutation, sessionId],
  );

  const handleSendMessage = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    sendMessage(inputValue);
  };

  const retryLastMessage = async () => {
    const lastUser = [...messages].reverse().find((m) => m.type === "user");
    if (!lastUser) return;
    setErrorHint(null);
    await mutation
      .mutateAsync({
        message: lastUser.text,
        sessionId: sessionId || undefined,
        user: {},
      } as ChatbotPayload)
      .then((reply) => {
        const id = `bot-retry-${Date.now()}`;
        const botMessage: ChatMessage = {
          id,
          type: "bot",
          text: reply.reply,
          timestamp: new Date().toISOString(),
          isNew: true,
        };
        setNewBotId(id);
        setMessages((prev) => [...prev, botMessage]);
      })
      .catch((error) => setErrorHint(error.message));
  };

  const clearChat = () => {
    setMessages(DEFAULT_MESSAGES);
    setNewBotId(null);
    setErrorHint(null);
  };

  return (
    <>
      {/* Ripple layer */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="chatbot-ripple"
          style={{ top: r.y, left: r.x }}
        />
      ))}

      {/* ── Toggle Button ── */}
      <div className="fixed md:right-19 md:bottom-16 right-4 bottom-[108px] z-50 group">
        {!isOpen && (
          <>
            <div className="chatbot-backlight" />
            <span className="chatbot-ring chatbot-ring-1" />
            <span className="chatbot-ring chatbot-ring-2" />
            <span className="chatbot-ring chatbot-ring-3" />
          </>
        )}

        <button
          ref={toggleRef}
          onClick={() => setIsOpen((c) => { if (c) setNewBotId(null); return !c; })}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200
            ${!isOpen ? "hover:scale-105" : "hover:rotate-90 active:scale-95"}`}
          style={{
            background: "linear-gradient(135deg, #2A78CC 0%, #205A99 100%)",
            boxShadow: isOpen ? "0 6px 20px rgba(42,120,204,0.35)" : undefined,
          }}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Bot className="h-6 w-6 scale-110" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute right-full mr-4 top-1/2 -translate-y-[58%] whitespace-nowrap opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
              <div className="px-4 py-2 rounded-2xl text-xs font-semibold text-text border border-border shadow-xl flex items-center bg-white/95 backdrop-blur-md">
                <span>Try using Ava!</span>
                <div className="absolute top-1/2 -translate-y-1/2 left-full w-2 h-2 border-r border-t border-border bg-white rotate-45 -ml-1" />
              </div>
            </div>
          )}
        </button>
      </div>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            key="chatbot-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-44 sm:bottom-32 left-4 right-4 z-50 mx-auto flex flex-col w-[min(calc(100vw-2rem),400px)] h-[580px] max-h-[85dvh] overflow-hidden rounded-3xl chatbot-panel sm:right-8 sm:left-auto"
          >
            {/* ── Header ── */}
            <div
              className="relative px-5 py-4 shrink-0"
              style={{
                borderBottom: "1px solid #D3DCE6",
                background: "#FFFFFF",
              }}
            >
              {/* Corner accent */}
              <div
                className="absolute top-0 right-0 w-48 h-32 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at top right, rgba(42,120,204,0.06) 0%, transparent 70%)",
                }}
              />

              <div className="relative z-10 flex items-center justify-between gap-3">
                {/* Left: AI avatar + name */}
                <div className="flex items-center gap-3">
                  {/* AI core */}
                  <div className="relative shrink-0">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(42,120,204,0.14) 0%, rgba(42,120,204,0.08) 100%)",
                        border: "1px solid rgba(42,120,204,0.30)",
                        boxShadow: "0 2px 10px rgba(42,120,204,0.15)",
                      }}
                    >
                      <Sparkles className="h-4.5 w-4.5 text-brand-500 chatbot-avatar-breathe" />
                    </div>
                    {/* Pulse ring */}
                    <span className="absolute inset-0 rounded-full chatbot-avatar-ring" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">
                      AI Learning Companion
                    </p>
                    <p className="text-sm font-semibold text-text leading-tight">
                      Ava
                    </p>
                  </div>
                </div>

                {/* Right: status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-emerald-600"
                    style={{
                      background: "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(16,185,129,0.22)",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>

                  {/* Clear chat */}
                  <button
                    type="button"
                    onClick={clearChat}
                    title="Clear chat"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted hover:text-brand-500 hover:bg-brand-50 transition-all duration-200 group/clear"
                  >
                    <RotateCcw className="h-3.5 w-3.5 group-hover/clear:rotate-[-360deg] transition-transform duration-500" />
                  </button>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setNewBotId(null); }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-sunken transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chatbot-messages bg-surface-alt">
              {messages.map((message) => {
                const minH = computedHeights.get(message.id) ?? 56;
                const isUser = message.type === "user";

                if (!isUser) {
                  return (
                    <BotBubble
                      key={message.id}
                      message={message}
                      isNew={message.id === newBotId}
                      computedHeight={minH}
                      onRetry={retryLastMessage}
                    />
                  );
                }

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="flex justify-end"
                  >
                    <div
                      className="max-w-[80%] rounded-2xl rounded-tr-none px-4 py-3 text-sm text-white leading-relaxed"
                      style={{
                        background:
                          "linear-gradient(135deg, #2A78CC 0%, #205A99 100%)",
                        boxShadow: "0 4px 16px rgba(42,120,204,0.25)",
                        minHeight: minH,
                      }}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <p className="mt-2 text-[10px] text-white/60">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Suggestion chips — only on welcome state */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    className="flex flex-col gap-2 pt-1"
                  >
                    <p className="text-[11px] text-text-subtle font-medium px-1">
                      Suggested questions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTION_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => sendMessage(chip)}
                          className="chatbot-chip"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Typing indicator */}
              {mutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start gap-2.5 items-start"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(42,120,204,0.08)",
                      border: "1px solid rgba(42,120,204,0.22)",
                    }}
                  >
                    <Bot className="h-4 w-4 text-brand-500 animate-pulse" />
                  </div>
                  <div
                    className="flex items-center gap-1.5 rounded-2xl rounded-tl-none px-4 py-3"
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #D3DCE6",
                    }}
                  >
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Footer ── */}
            <form
              onSubmit={handleSendMessage}
              className="px-4 py-3.5 shrink-0"
              style={{
                borderTop: "1px solid #D3DCE6",
                background: "#FFFFFF",
              }}
            >
              <div
                className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200 focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-200"
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #D3DCE6",
                }}
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Ava anything..."
                  disabled={mutation.isPending}
                  className="flex-1 bg-transparent px-2 py-1.5 text-sm text-text placeholder:text-text-subtle outline-none disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || mutation.isPending}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    background:
                      "linear-gradient(135deg, #2A78CC 0%, #205A99 100%)",
                    boxShadow: "0 2px 10px rgba(42,120,204,0.30)",
                  }}
                >
                  {mutation.isPending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {errorHint && (
                <p className="mt-2 pl-3 text-xs text-red-600 font-medium">
                  {errorHint}
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

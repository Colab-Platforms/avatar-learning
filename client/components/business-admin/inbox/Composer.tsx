"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, FileUp, Loader2, Paperclip, Send, X } from "lucide-react";
import { ATTACHMENT_ACCEPT, checkAttachment, composerBlock, formatBytes, MAX_MESSAGE_LENGTH, windowLabel, type AttachmentKind } from "@/lib/inboxLogic";
import type { ReplyRef } from "@/lib/businessAdminApi";

export interface PendingAttachment {
  file: File;
  kind: AttachmentKind;
  previewUrl: string | null;
}

export interface ComposerProps {
  onSendText: (text: string) => void;
  onSendFile: (attachment: PendingAttachment, caption: string) => void;
  outboundReady: boolean | undefined;
  windowOpen: boolean | undefined;
  windowExpiresAt: string | null | undefined;
  /** Messages currently waiting for WhatsApp (shown as a hint). */
  sending: number;
  replyTo: { label: string; ref: Pick<ReplyRef, "text" | "kind"> } | null;
  onCancelReply: () => void;
  /** Opens the template picker (the only way to message outside the 24-hour window). */
  onOpenTemplates: () => void;
  /** Customer withdrew WhatsApp consent: sending of every kind is blocked. */
  consentWithdrawn?: boolean;
}

const previewOf = (ref: Pick<ReplyRef, "text" | "kind">) => ref.text ?? `[${ref.kind}]`;

export function Composer(p: ComposerProps) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);
  const [fileError, setFileError] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const block = p.consentWithdrawn ? "consent" : composerBlock({ outboundReady: p.outboundReady, windowOpen: p.windowOpen });
  const trimmed = text.trim();
  const tooLong = text.length > (attachment ? 1024 : MAX_MESSAGE_LENGTH);
  const canSend = !block && !tooLong && (attachment ? attachment.kind !== "audio" || trimmed === "" : trimmed.length > 0);
  const win = p.windowOpen !== undefined ? windowLabel(p.windowOpen, p.windowExpiresAt ?? null) : null;

  useEffect(
    () => () => {
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    },
    [attachment],
  );
  useEffect(() => {
    if (p.replyTo) ref.current?.focus();
  }, [p.replyTo]);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const r = checkAttachment(file);
    if (!r.ok) return setFileError(r.reason);
    setFileError("");
    setAttachment({ file, kind: r.kind, previewUrl: r.kind === "image" ? URL.createObjectURL(file) : null });
  };

  const submit = () => {
    if (!canSend) return;
    if (attachment) {
      p.onSendFile(attachment, trimmed);
      setAttachment(null);
    } else p.onSendText(trimmed);
    setText("");
    ref.current?.focus();
  };

  if (block === "not-configured") {
    return (
      <div role="status" className="border-t border-white/5 bg-ink-900 px-4 py-3 text-xs text-white/50">
        <p className="font-semibold text-white/70">Replies are not enabled on this server</p>
        <p className="mt-0.5">An administrator must switch on WhatsApp sending before the team can reply from here. You can still read conversations and add internal notes.</p>
      </div>
    );
  }
  if (block === "consent") {
    return (
      <div role="status" data-testid="consent-withdrawn" className="border-t border-white/5 bg-ink-900 px-4 py-3 text-xs text-red-200">
        <p className="font-semibold">This customer has opted out of WhatsApp messages</p>
        <p className="mt-0.5 text-red-200/70">Sending is blocked for every message type. They can opt back in by messaging you again and you recording new consent on their contact.</p>
      </div>
    );
  }
  if (block === "window-closed") {
    return (
      <div role="status" data-testid="window-closed" className="border-t border-white/5 bg-ink-900 px-4 py-3 text-xs">
        <p className="text-sm font-bold text-amber-200">24-hour customer service window closed</p>
        <p className="mt-0.5 text-sm text-amber-100/70">
          WhatsApp only allows an approved message template once 24 hours have passed since the customer&apos;s last message. The customer must have opted in.
        </p>
        <button type="button" onClick={p.onOpenTemplates} data-testid="open-templates" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600">
          <FileText size={13} /> Send a template
        </button>
      </div>
    );
  }

  return (
    <form
      className="border-t border-white/5 bg-ink-900 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        pick(e.dataTransfer.files);
      }}
    >
      {p.replyTo && (
        <div className="mb-2 flex items-start gap-2 rounded-lg border-l-4 border-brand-500 bg-white/5 px-3 py-1.5 text-xs" data-testid="reply-bar">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-brand-300">Replying to {p.replyTo.label}</p>
            <p className="truncate text-white/60">{previewOf(p.replyTo.ref)}</p>
          </div>
          <button type="button" onClick={p.onCancelReply} aria-label="Cancel reply" className="rounded p-1 text-white/50 hover:bg-white/10"><X size={14} /></button>
        </div>
      )}
      {attachment && (
        <div className="mb-2 flex items-center gap-3 rounded-lg border border-white/8 bg-white/4 p-2" data-testid="attachment-preview">
          {attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={attachment.previewUrl} alt="Selected photo" className="h-14 w-14 rounded object-cover" />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded bg-white/8 text-white/60"><FileUp size={22} /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white/90">{attachment.file.name}</p>
            <p className="text-[11px] text-white/45">{attachment.kind} · {formatBytes(attachment.file.size)}{attachment.kind === "audio" ? " · audio cannot have a caption" : ""}</p>
          </div>
          <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment" className="rounded p-1.5 text-white/50 hover:bg-white/10"><X size={16} /></button>
        </div>
      )}
      {fileError && <p role="alert" className="mb-2 text-xs text-amber-200">{fileError}</p>}
      <div className="flex items-end gap-2">
        <input ref={picker} type="file" accept={ATTACHMENT_ACCEPT} className="sr-only" data-testid="file-input" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
        <button type="button" onClick={() => picker.current?.click()} aria-label="Attach a file" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
          <Paperclip size={18} />
        </button>
        <label className="min-w-0 flex-1">
          <span className="sr-only">Message</span>
          <textarea
            ref={ref}
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter inserts a newline. IME composition (e.g. Hindi input) must not send.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={attachment ? (attachment.kind === "audio" ? "Audio cannot have a caption" : "Add a caption (optional)") : "Write a reply…"}
            disabled={attachment?.kind === "audio"}
            aria-invalid={tooLong}
            className="max-h-40 min-h-[2.75rem] w-full resize-y rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-brand-500/50 focus:outline-none disabled:opacity-50"
          />
        </label>
        <button type="submit" disabled={!canSend} aria-label="Send message" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40">
          {p.sending > 0 ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-white/35">
        <span>{win?.text ?? ""}{p.sending > 0 ? ` · ${p.sending} sending…` : ""}</span>
        <span className={tooLong ? "text-red-300" : ""}>{tooLong ? `Too long (${text.length})` : "Enter to send · Shift+Enter for a new line"}</span>
      </div>
    </form>
  );
}

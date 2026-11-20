"use client";

import { Copy, ExternalLink, Image as ImageIcon, MessageSquareReply, Phone } from "lucide-react";
import { segmentTemplate } from "@/lib/templateLogic";

export interface PreviewButton {
  type: string;
  text?: string;
}
export interface PreviewHeader {
  /** TEXT, IMAGE, VIDEO or DOCUMENT. */
  format: string;
  text?: string | null;
}

/** The picker's /templates data has the header as one string; media headers arrive as "[image header]". */
export function headerFromInfo(header: string | null | undefined): PreviewHeader | null {
  if (header === null || header === undefined || header === "") return null;
  const media = /^\[(image|video|document) header\]$/.exec(header);
  return media ? { format: media[1].toUpperCase() } : { format: "TEXT", text: header };
}

function Segments({ text, values }: { text: string; values: Record<string, string> }) {
  return (
    <>
      {segmentTemplate(text, values).map((s, i) =>
        s.kind === "text" ? (
          <span key={i}>{s.text}</span>
        ) : s.filled ? (
          <mark key={i} className="ba-var-fill" data-testid="var-filled" data-var={s.name}>{s.text}</mark>
        ) : (
          <span key={i} className="ba-var-empty" data-testid="var-empty" data-var={s.name}>{s.text}</span>
        ),
      )}
    </>
  );
}

const BTN_ICON: Record<string, typeof Copy> = { URL: ExternalLink, PHONE_NUMBER: Phone, COPY_CODE: Copy, QUICK_REPLY: MessageSquareReply };

/**
 * WhatsApp-style rendering of a template: header, body, footer and buttons exactly as given.
 * `values` maps variable name -> text. A variable with a value is highlighted as real content; one without stays
 * visible as its {{placeholder}}. Nothing is invented: no buttons are drawn unless they were supplied.
 */
export function TemplatePreview({ header, body, footer, buttons = [], values = {}, authentication = false }: {
  header?: PreviewHeader | null;
  body: string;
  footer?: string | null;
  buttons?: PreviewButton[];
  values?: Record<string, string>;
  authentication?: boolean;
}) {
  return (
    <div className="ba-chat-bg rounded-xl p-3 sm:p-4" data-testid="template-preview">
      <div className="max-w-[26rem]">
        <div className="ba-bubble ba-bubble--in text-[13.5px] leading-snug">
          {header?.format === "TEXT" && header.text && (
            <p className="mb-1 font-bold" data-testid="preview-header"><Segments text={header.text} values={values} /></p>
          )}
          {header && header.format !== "TEXT" && (
            <div className="mb-2 flex h-28 items-center justify-center gap-2 rounded-lg bg-black/10 text-xs font-semibold ba-bubble-meta" data-testid="preview-header-media">
              <ImageIcon size={16} /> {header.format.toLowerCase()} header
            </div>
          )}
          <p className="whitespace-pre-wrap break-words" data-testid="preview-body">
            {authentication ? "123456 is your verification code." : <Segments text={body} values={values} />}
          </p>
          {footer && <p className="mt-1.5 text-[11.5px] ba-bubble-meta" data-testid="preview-footer">{footer}</p>}
        </div>
        {buttons.length > 0 && (
          <div className="mt-1 space-y-1" data-testid="preview-buttons">
            {buttons.map((b, i) => {
              const Icon = BTN_ICON[b.type] ?? MessageSquareReply;
              return (
                <div key={i} className="ba-wa-btn" data-button-type={b.type}>
                  <Icon size={14} /> {b.type === "COPY_CODE" ? "Copy code" : b.text || "Button"}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Colour-coded status pill for template approval (and local drafts). One palette across the whole inbox. */
export function ApprovalPill({ kind, children }: { kind: "approved" | "pending" | "rejected" | "draft" | "other"; children: React.ReactNode }) {
  return <span className={`ba-pill ba-pill--${kind}`} data-testid="status-pill" data-status={kind}>{children}</span>;
}

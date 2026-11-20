import { getWhatsappConfig } from "./whatsapp.config.js";
import type { WhatsappConfig } from "./whatsapp.types.js";

type FetchResponseLike = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  headers?: { get(name: string): string | null };
  body?: ReadableStream<Uint8Array> | null;
};

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string | FormData; signal?: AbortSignal },
) => Promise<FetchResponseLike>;

export class WhatsappApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus?: number,
    readonly metaCode?: number,
    /**
     * True when we cannot know whether WhatsApp accepted the message (timeout, network drop, 5xx).
     * Callers must not blindly resend: the customer may already have it.
     */
    readonly ambiguous: boolean = false,
  ) {
    super(message);
    this.name = "WhatsappApiError";
  }
}

export interface WhatsappClientOptions {
  config?: WhatsappConfig;
  /** Inject a mock in tests. Defaults to the global fetch. */
  fetchImpl?: FetchLike;
  /** Per-request timeout in ms (default 15000; uploads and downloads use 60000). */
  timeoutMs?: number;
}

export type OutboundMediaKind = "image" | "video" | "audio" | "document";

export interface SendOptions {
  /** WhatsApp message id (wamid) of the message being replied to; shows the quoted message to the customer. */
  replyTo?: string;
}

export interface MediaInfo {
  url: string;
  mimeType: string;
  fileSize: number | null;
}

export interface TemplateDefinition {
  name: string;
  language: string;
  status: string;
  category: string;
  components: Array<Record<string, unknown>>;
  /** Meta's template id (present on every template Meta returns). */
  id?: string;
  /** Why Meta rejected it (only when status is REJECTED and Meta supplied a reason). */
  rejectedReason?: string | null;
  /** POSITIONAL ({{1}}) or NAMED ({{first_name}}). */
  parameterFormat?: "POSITIONAL" | "NAMED";
}

/** What Meta needs to create a template (built and validated by the Template Manager). */
export interface TemplateSubmission {
  name: string;
  language: string;
  category: string;
  parameterFormat: "POSITIONAL" | "NAMED";
  components: Array<Record<string, unknown>>;
}

export interface TemplateSubmitResult {
  id: string;
  status: string;
  category: string;
}

const MAX_TEMPLATE_PAGES = 25;
const TEMPLATE_FIELDS = "name,language,status,category,components,rejected_reason,parameter_format";
const toDefinition = (r: Record<string, unknown>): TemplateDefinition => ({
  id: typeof r.id === "string" ? r.id : undefined,
  name: String(r.name ?? ""),
  language: String(r.language ?? ""),
  status: String(r.status ?? ""),
  category: String(r.category ?? ""),
  components: Array.isArray(r.components) ? (r.components as Array<Record<string, unknown>>) : [],
  rejectedReason: typeof r.rejected_reason === "string" && r.rejected_reason && r.rejected_reason !== "NONE" ? r.rejected_reason : null,
  parameterFormat: r.parameter_format === "NAMED" ? "NAMED" : "POSITIONAL",
});

/** Media is only ever fetched from Meta's own hosts: the URL comes from an API response and is never user-supplied. */
const MEDIA_HOST_SUFFIXES = ["fbsbx.com", "facebook.com", "fbcdn.net", "whatsapp.net", "whatsapp.com"];
export function isMetaMediaUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && MEDIA_HOST_SUFFIXES.some((s) => u.hostname === s || u.hostname.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

/**
 * Graph API client for outbound calls. The access token is only ever placed in the Authorization header - never in a
 * URL, log line or error message. Nothing in the webhook flow calls it; the Business Admin inbox does, and only when
 * outbound sending has been explicitly switched on.
 */
export class WhatsappClient {
  private readonly config: WhatsappConfig;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: WhatsappClientOptions = {}) {
    this.config = options.config ?? getWhatsappConfig();
    this.fetchImpl = options.fetchImpl ?? (fetch as unknown as FetchLike);
    this.timeoutMs = options.timeoutMs ?? 15000;
  }

  private assertReady(): { accessToken: string; phoneNumberId: string } {
    const { enabled, accessToken, phoneNumberId } = this.config;
    if (!enabled) throw new WhatsappApiError("WhatsApp integration is disabled (WHATSAPP_ENABLED).");
    if (!accessToken) throw new WhatsappApiError("WHATSAPP_ACCESS_TOKEN is not configured.");
    if (!phoneNumberId) throw new WhatsappApiError("WHATSAPP_PHONE_NUMBER_ID is not configured.");
    return { accessToken, phoneNumberId };
  }

  private graph(path: string): string {
    return `https://graph.facebook.com/${this.config.graphApiVersion}/${path}`;
  }

  /** One HTTP call with a timeout. No response at all is reported as an ambiguous outcome. */
  private async call(
    method: string,
    url: string,
    init: { headers: Record<string, string>; body?: string | FormData },
    timeoutMs = this.timeoutMs,
  ): Promise<FetchResponseLike> {
    try {
      return await this.fetchImpl(url, { method, headers: init.headers, body: init.body, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      // No response at all: the request may or may not have reached WhatsApp. Never include the cause (it can echo the URL).
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      throw new WhatsappApiError(timedOut ? "WhatsApp API request timed out." : "WhatsApp API request could not be completed.", undefined, undefined, true);
    }
  }

  private async fail(response: FetchResponseLike, data: Record<string, unknown>): Promise<never> {
    const err = (data.error ?? {}) as { message?: string; code?: number; error_user_title?: string; error_user_msg?: string };
    // Template calls return the actionable reason in error_user_msg (e.g. why a template was refused).
    const detail = [err.message, err.error_user_title, err.error_user_msg].filter((x, i, a) => x && a.indexOf(x) === i).join(" - ");
    throw new WhatsappApiError(
      `WhatsApp API request failed (${response.status}${err.code ? `, code ${err.code}` : ""}): ${detail || "no details"}`,
      response.status,
      err.code,
      response.status >= 500,
    );
  }

  private async json(response: FetchResponseLike): Promise<Record<string, unknown>> {
    return (await response.json().catch(() => ({}))) as Record<string, unknown>;
  }

  private async post(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { accessToken, phoneNumberId } = this.assertReady();
    const response = await this.call("POST", this.graph(`${phoneNumberId}/${path}`), {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    });
    const data = await this.json(response);
    if (!response.ok) await this.fail(response, data);
    return data;
  }

  private messageId(data: Record<string, unknown>): { waMessageId: string } {
    const id = Array.isArray(data.messages) ? (data.messages[0] as { id?: string } | undefined)?.id : undefined;
    if (!id) throw new WhatsappApiError("WhatsApp API response did not include a message id.");
    return { waMessageId: id };
  }

  private withContext(body: Record<string, unknown>, opts?: SendOptions): Record<string, unknown> {
    return opts?.replyTo ? { ...body, context: { message_id: opts.replyTo } } : body;
  }

  /** Sends a free-form text message (only deliverable inside the 24h customer-service window). */
  async sendTextMessage(to: string, text: string, opts?: SendOptions): Promise<{ waMessageId: string }> {
    const data = await this.post(
      "messages",
      this.withContext({ recipient_type: "individual", to, type: "text", text: { body: text, preview_url: false } }, opts),
    );
    return this.messageId(data);
  }

  /** Sends an image/video/audio/document that was uploaded with uploadMedia(). Free-form: 24h window only. */
  async sendMediaMessage(
    to: string,
    media: { kind: OutboundMediaKind; mediaId: string; caption?: string; filename?: string },
    opts?: SendOptions,
  ): Promise<{ waMessageId: string }> {
    const object: Record<string, unknown> = { id: media.mediaId };
    // Captions exist for image/video/document only; audio has none. Filename is only meaningful for documents.
    if (media.caption && media.kind !== "audio") object.caption = media.caption;
    if (media.filename && media.kind === "document") object.filename = media.filename;
    const data = await this.post("messages", this.withContext({ recipient_type: "individual", to, type: media.kind, [media.kind]: object }, opts));
    return this.messageId(data);
  }

  /** Sends an approved template (works outside the 24h window). Body variables only. */
  async sendTemplateMessage(
    to: string,
    template: { name: string; language: string; bodyParams: string[]; /** NAMED templates: the variable names, same order as bodyParams. */ paramNames?: string[] },
    opts?: SendOptions,
  ): Promise<{ waMessageId: string }> {
    const body: Record<string, unknown> = {
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        ...(template.bodyParams.length > 0 ? { components: [{ type: "body", parameters: template.bodyParams.map((text, i) => ({ type: "text", ...(template.paramNames?.[i] ? { parameter_name: template.paramNames[i] } : {}), text })) }] } : {}),
      },
    };
    return this.messageId(await this.post("messages", this.withContext(body, opts)));
  }

  /** Uploads a file to WhatsApp media storage and returns its media id (valid for about 30 days). */
  async uploadMedia(file: { data: Uint8Array; mimeType: string; filename: string }): Promise<{ mediaId: string }> {
    const { accessToken, phoneNumberId } = this.assertReady();
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", file.mimeType);
    form.append("file", new Blob([Buffer.from(file.data)], { type: file.mimeType }), file.filename);
    // No Content-Type header: fetch sets the multipart boundary itself.
    const response = await this.call("POST", this.graph(`${phoneNumberId}/media`), { headers: { Authorization: `Bearer ${accessToken}` }, body: form }, 60000);
    const data = await this.json(response);
    if (!response.ok) await this.fail(response, data);
    const id = typeof data.id === "string" ? data.id : undefined;
    if (!id) throw new WhatsappApiError("WhatsApp API response did not include a media id.");
    return { mediaId: id };
  }

  /** Looks up the temporary download URL of a media id (inbound or previously uploaded). */
  async getMediaInfo(mediaId: string): Promise<MediaInfo> {
    const { accessToken } = this.assertReady();
    if (!/^\d{5,40}$/.test(mediaId)) throw new WhatsappApiError("Invalid media id.");
    const response = await this.call("GET", this.graph(mediaId), { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await this.json(response);
    if (!response.ok) await this.fail(response, data);
    const url = typeof data.url === "string" ? data.url : "";
    if (!isMetaMediaUrl(url)) throw new WhatsappApiError("WhatsApp returned an unexpected media location.");
    return { url, mimeType: typeof data.mime_type === "string" ? data.mime_type : "application/octet-stream", fileSize: typeof data.file_size === "number" ? data.file_size : null };
  }

  /** Opens the media download stream. The URL must be one returned by getMediaInfo(); other hosts are refused. */
  async openMedia(url: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string; contentLength: number | null }> {
    const { accessToken } = this.assertReady();
    if (!isMetaMediaUrl(url)) throw new WhatsappApiError("Refused to download media from an unexpected host.");
    const response = await this.call("GET", url, { headers: { Authorization: `Bearer ${accessToken}` } }, 60000);
    if (!response.ok || !response.body) throw new WhatsappApiError(`WhatsApp media download failed (${response.status}).`, response.status, undefined, response.status >= 500);
    const length = Number(response.headers?.get("content-length") ?? "");
    return { stream: response.body, contentType: response.headers?.get("content-type") ?? "application/octet-stream", contentLength: Number.isFinite(length) && length > 0 ? length : null };
  }

  /** Lists the message templates of the WhatsApp Business Account (requires WHATSAPP_BUSINESS_ACCOUNT_ID). */
  async listTemplates(): Promise<TemplateDefinition[]> {
    const { accessToken } = this.assertReady();
    const waba = this.requireWaba();
    const out: TemplateDefinition[] = [];
    let after: string | undefined;
    // Follows Meta's cursor pagination; the page cap means a misbehaving response can never loop forever.
    for (let page = 0; page < MAX_TEMPLATE_PAGES; page++) {
      const cursor = after ? `&after=${encodeURIComponent(after)}` : "";
      const response = await this.call("GET", this.graph(`${waba}/message_templates?fields=${TEMPLATE_FIELDS}&limit=100${cursor}`), { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await this.json(response);
      if (!response.ok) await this.fail(response, data);
      out.push(...(Array.isArray(data.data) ? (data.data as Array<Record<string, unknown>>) : []).map(toDefinition));
      const paging = (data.paging ?? {}) as { cursors?: { after?: string }; next?: string };
      after = paging.next ? paging.cursors?.after : undefined;
      if (!after) break;
    }
    return out;
  }

  private requireWaba(): string {
    const waba = this.config.businessAccountId;
    if (!waba) throw new WhatsappApiError("WHATSAPP_BUSINESS_ACCOUNT_ID is not configured.");
    return waba;
  }

  private jsonHeaders(): { Authorization: string; "Content-Type": string } {
    return { Authorization: `Bearer ${this.assertReady().accessToken}`, "Content-Type": "application/json" };
  }

  /** One template by Meta id (used to read the real status right after an edit). */
  async getTemplate(templateId: string): Promise<TemplateDefinition> {
    const { accessToken } = this.assertReady();
    if (!/^\d{5,30}$/.test(templateId)) throw new WhatsappApiError("Invalid template id.");
    const response = await this.call("GET", this.graph(`${templateId}?fields=${TEMPLATE_FIELDS}`), { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await this.json(response);
    if (!response.ok) await this.fail(response, data);
    return toDefinition({ ...data, id: data.id ?? templateId });
  }

  /** Submits a NEW template for Meta's review. Whatever Meta answers is the only source of its status. */
  async createTemplate(t: TemplateSubmission): Promise<TemplateSubmitResult> {
    const waba = this.requireWaba();
    const response = await this.call("POST", this.graph(`${waba}/message_templates`), {
      headers: this.jsonHeaders(),
      body: JSON.stringify({ name: t.name, language: t.language, category: t.category, parameter_format: t.parameterFormat, components: t.components }),
    });
    const data = await this.json(response);
    if (!response.ok) await this.fail(response, data);
    const id = typeof data.id === "string" ? data.id : "";
    if (!id) throw new WhatsappApiError("WhatsApp API response did not include a template id.");
    return { id, status: typeof data.status === "string" ? data.status : "", category: typeof data.category === "string" ? data.category : t.category };
  }

  /** Edits an existing template (e.g. to fix a rejection). Meta puts the edited template back into review. */
  async editTemplate(templateId: string, t: { category?: string; components: Array<Record<string, unknown>> }): Promise<void> {
    if (!/^\d{5,30}$/.test(templateId)) throw new WhatsappApiError("Invalid template id.");
    const response = await this.call("POST", this.graph(templateId), {
      headers: this.jsonHeaders(),
      body: JSON.stringify({ ...(t.category ? { category: t.category } : {}), components: t.components }),
    });
    const data = await this.json(response);
    if (!response.ok) await this.fail(response, data);
  }

  /**
   * Uploads a sample file for a template's image/video/document header (Meta's Resumable Upload API) and returns the
   * header handle Meta requires as the example. Needs the Meta app id (WHATSAPP_APP_ID).
   */
  async uploadTemplateExample(file: { data: Uint8Array; mimeType: string; filename: string }): Promise<{ handle: string }> {
    const { accessToken } = this.assertReady();
    const appId = this.config.appId;
    if (!appId || !/^\d{5,30}$/.test(appId)) throw new WhatsappApiError("WHATSAPP_APP_ID is not configured, so sample media cannot be uploaded.");
    const start = await this.call(
      "POST",
      this.graph(`${appId}/uploads?file_length=${file.data.byteLength}&file_type=${encodeURIComponent(file.mimeType)}&file_name=${encodeURIComponent(file.filename)}`),
      { headers: { Authorization: `Bearer ${accessToken}` } },
      60000,
    );
    const session = await this.json(start);
    if (!start.ok) await this.fail(start, session);
    const sessionId = typeof session.id === "string" ? session.id : "";
    if (!/^upload:[A-Za-z0-9_:=.-]+$/.test(sessionId)) throw new WhatsappApiError("WhatsApp API did not return an upload session.");
    const done = await this.call("POST", this.graph(sessionId), { headers: { Authorization: `OAuth ${accessToken}`, file_offset: "0" }, body: Buffer.from(file.data) as unknown as string }, 60000);
    const result = await this.json(done);
    if (!done.ok) await this.fail(done, result);
    const handle = typeof result.h === "string" ? result.h : "";
    if (!handle) throw new WhatsappApiError("WhatsApp API did not return a media handle.");
    return { handle };
  }

  /** Marks an inbound message as read (shows the blue ticks to the customer). */
  async markMessageAsRead(waMessageId: string): Promise<void> {
    await this.post("messages", { status: "read", message_id: waMessageId });
  }
}

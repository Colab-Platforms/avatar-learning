import apiClient from "./apiClient";

// Business Admin API (Avatar Adaption). Every endpoint is enforced server-side; the UI never decides access.

export type BusinessAccess = "superadmin" | "permissions" | "allowlist";

export interface BusinessAdminMe {
  role: "ADMIN" | "SUPERADMIN" | "BUSINESS_ADMIN";
  access: BusinessAccess;
  userId?: string;
  /** Modules this person may use (the server enforces the same list on every endpoint). */
  modules: string[];
  /** What they may do in each module (view | create | edit | delete | manage). */
  permissions?: Record<string, string[]>;
  isSuperAdmin: boolean;
}

export interface WhatsappOverview {
  totalInbound: number;
  totalOutbound: number;
  inboundLast24h: number;
  inboundLast7d: number;
  lastInboundAt: string | null;
  contacts: number;
}

export interface IntegrationStatus {
  whatsapp: {
    webhookEnabled: boolean;
    webhookConfigured: boolean;
    missingVariables: string[];
    accessTokenSet: boolean;
    phoneNumberIdSet: boolean;
    outboundEnabled: boolean;
    outboundSending: "inactive" | "ready";
  };
  email: { configured: boolean };
}

export interface BusinessOverview {
  whatsapp: WhatsappOverview;
  integrations: IntegrationStatus;
}

export const fetchBusinessMe = (): Promise<BusinessAdminMe> => apiClient.get("/business-admin/me").then((r) => r.data.data);

export const fetchBusinessOverview = (): Promise<BusinessOverview> => apiClient.get("/business-admin/overview").then((r) => r.data.data);

// ─── WhatsApp Inbox ──────────────────────────────────────────────────────────
export type InboxFilter = "all" | "unread" | "mine" | "unassigned";
/** Real WhatsApp: sending -> accepted (API said yes) -> sent (WhatsApp confirmed) -> delivered -> read | failed. "simulated" = dev sandbox only. */
export type MessageState = "sending" | "accepted" | "sent" | "delivered" | "read" | "failed" | "unconfirmed" | "received" | "simulated";

export interface PersonRef {
  id: string;
  name: string;
}

export type MessageKind = "text" | "image" | "video" | "audio" | "document" | "sticker" | "template" | "other";

export interface MediaInfo {
  kind: "image" | "video" | "audio" | "document" | "sticker";
  mimeType: string | null;
  filename: string | null;
  sizeBytes: number | null;
  caption: string | null;
  voice: boolean;
  available: boolean;
}

export interface ReplyRef {
  id: string | null;
  text: string | null;
  kind: MessageKind;
  direction: "INBOUND" | "OUTBOUND" | null;
}

export interface InboxConversation {
  contactWaId: string;
  contactName: string | null;
  messageCount: number;
  unreadCount: number;
  lastMessageAt: string;
  lastDirection: "INBOUND" | "OUTBOUND";
  lastState: MessageState;
  lastMessageType: string | null;
  lastKind: MessageKind;
  lastPreview: string | null;
  assignee: PersonRef | null;
  windowOpen: boolean;
  windowExpiresAt: string | null;
}

export interface ConversationPage {
  items: InboxConversation[];
  total: number;
  unreadTotal: number;
  page: number;
  pageSize: number;
}

export interface ContactDetail {
  contactWaId: string;
  contactName: string | null;
  messageCount: number;
  unreadCount: number;
  firstMessageAt: string | null;
  lastInboundAt: string | null;
  assignee: PersonRef | null;
  assignedAt: string | null;
  lastReadAt: string | null;
  windowOpen: boolean;
  windowExpiresAt: string | null;
}

export interface InboxMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  state: MessageState;
  type: string | null;
  kind: MessageKind;
  text: string | null;
  media: MediaInfo | null;
  template: { name: string; language: string } | null;
  replyTo: ReplyRef | null;
  at: string;
  sentBy: PersonRef | null;
  error: { code: number | null; title: string | null; ambiguous: boolean } | null;
  /** True for dev-sandbox messages: a mock sender handled them and nothing reached WhatsApp. */
  simulated?: boolean;
  /** When each stage was recorded (null = not reached / not reported). */
  timeline?: { acceptedAt: string | null; sentAt: string | null; deliveredAt: string | null; readAt: string | null; failedAt: string | null };
  canRetry: boolean;
  clientRequestId: string | null;
}

export interface MessagePage {
  contactWaId: string;
  items: InboxMessage[];
  hasMore: boolean;
  nextBefore: string | null;
}

export interface ConversationEvent {
  id: string;
  type: "ASSIGNED" | "UNASSIGNED" | "NOTE";
  body: string | null;
  author: PersonRef | null;
  assignee: PersonRef | null;
  createdAt: string;
}

export interface ConversationQuery {
  filter: InboxFilter;
  assignee?: string;
  q?: string;
}

const wa = "/business-admin/whatsapp";

export const fetchConversations = (query: ConversationQuery, page = 1, pageSize = 25): Promise<ConversationPage> =>
  apiClient
    .get(`${wa}/conversations`, { params: { page, pageSize, filter: query.filter, ...(query.assignee && { assignee: query.assignee }), ...(query.q && { q: query.q }) } })
    .then((r) => r.data.data);

export const fetchContact = (waId: string): Promise<ContactDetail> => apiClient.get(`${wa}/conversations/${encodeURIComponent(waId)}`).then((r) => r.data.data);

export const fetchMessages = (waId: string, opts: { limit?: number; before?: string; until?: string } = {}): Promise<MessagePage> =>
  apiClient
    .get(`${wa}/conversations/${encodeURIComponent(waId)}/messages`, { params: { limit: opts.limit ?? 50, ...(opts.before && { before: opts.before }), ...(opts.until && { until: opts.until }) } })
    .then((r) => r.data.data);

export interface SendResult {
  message: InboxMessage;
  created: boolean;
}

export const sendMessage = (waId: string, text: string, clientRequestId: string, replyToMessageId?: string): Promise<SendResult> =>
  apiClient.post(`${wa}/conversations/${encodeURIComponent(waId)}/messages`, { text, clientRequestId, ...(replyToMessageId && { replyToMessageId }) }).then((r) => r.data.data);

/** Uploads one file (multipart) and sends it. onProgress reports 0-100 of the browser-to-server upload. */
export const sendMedia = (
  waId: string,
  file: File,
  opts: { clientRequestId: string; caption?: string; replyToMessageId?: string; onProgress?: (percent: number) => void; signal?: AbortSignal },
): Promise<SendResult> => {
  const form = new FormData();
  form.append("clientRequestId", opts.clientRequestId);
  if (opts.caption) form.append("caption", opts.caption);
  if (opts.replyToMessageId) form.append("replyToMessageId", opts.replyToMessageId);
  form.append("file", file, file.name);
  return apiClient
    .post(`${wa}/conversations/${encodeURIComponent(waId)}/media`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120_000,
      signal: opts.signal,
      onUploadProgress: (e) => opts.onProgress?.(e.total ? Math.min(100, Math.round((e.loaded / e.total) * 100)) : 0),
    })
    .then((r) => r.data.data);
};

/** Authenticated download of a message's file as a Blob (the access token never leaves the server). */
export const fetchMediaBlob = (messageId: string): Promise<Blob> =>
  apiClient.get(`${wa}/messages/${encodeURIComponent(messageId)}/media`, { responseType: "blob", timeout: 120_000 }).then((r) => r.data as Blob);

export interface TemplateInfo {
  name: string;
  language: string;
  category: string;
  status: string;
  body: string;
  header: string | null;
  footer: string | null;
  variableCount: number;
  sendable: boolean;
  unsupportedReason: string | null;
  /** Already returned by GET /templates; optional so older responses still type-check. */
  variables?: string[];
  parameterFormat?: "POSITIONAL" | "NAMED";
  rejectedReason?: string | null;
}

export const fetchTemplates = (refresh = false): Promise<{ items: TemplateInfo[]; source: string }> =>
  apiClient.get(`${wa}/templates`, { params: refresh ? { refresh: 1 } : {} }).then((r) => r.data.data);

export const sendTemplate = (waId: string, input: { name: string; language: string; params: string[]; clientRequestId: string }): Promise<SendResult> =>
  apiClient.post(`${wa}/conversations/${encodeURIComponent(waId)}/templates`, input).then((r) => r.data.data);

export interface SearchHit {
  id: string;
  contactWaId: string;
  contactName: string | null;
  direction: "INBOUND" | "OUTBOUND";
  snippet: string;
  at: string;
}

export const searchMessages = (q: string, waId?: string): Promise<{ items: SearchHit[]; q: string }> =>
  apiClient.get(`${wa}/search`, { params: { q, ...(waId && { waId }) } }).then((r) => r.data.data);

// ─── Contacts ────────────────────────────────────────────────────────────────
export type OptInStatus = "UNKNOWN" | "GRANTED" | "WITHDRAWN";

export interface ContactRecord {
  id: string;
  waId: string;
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
  source: string;
  optIn: { status: OptInStatus; evidence: string | null; at: string | null; outAt: string | null; bySomeoneElse: boolean };
  createdAt: string;
}

export interface ContactInput {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
  tags?: string[];
}

export const fetchContacts = (p: { q?: string; tag?: string; optIn?: OptInStatus | ""; page?: number; pageSize?: number }): Promise<{ items: ContactRecord[]; total: number; page: number; pageSize: number }> =>
  apiClient.get(`${wa}/contacts`, { params: { page: p.page ?? 1, pageSize: p.pageSize ?? 25, ...(p.q && { q: p.q }), ...(p.tag && { tag: p.tag }), ...(p.optIn && { optIn: p.optIn }) } }).then((r) => r.data.data);
export const createContact = (input: ContactInput): Promise<ContactRecord> => apiClient.post(`${wa}/contacts`, input).then((r) => r.data.data);
export const updateContact = (id: string, input: ContactInput): Promise<ContactRecord> => apiClient.patch(`${wa}/contacts/${encodeURIComponent(id)}`, input).then((r) => r.data.data);
export const deleteContact = (id: string): Promise<{ deleted: boolean }> => apiClient.delete(`${wa}/contacts/${encodeURIComponent(id)}`).then((r) => r.data.data);
export const importContacts = (rows: ContactInput[]): Promise<{ created: number; updated: number; skipped: number; errors: Array<{ row: number; reason: string }> }> =>
  apiClient.post(`${wa}/contacts/import`, { rows }).then((r) => r.data.data);
export const setContactOptIn = (id: string, input: { status: OptInStatus; evidence?: string; note?: string }): Promise<ContactRecord> =>
  apiClient.put(`${wa}/contacts/${encodeURIComponent(id)}/opt-in`, input).then((r) => r.data.data);
export const fetchContactTags = (): Promise<{ items: string[] }> => apiClient.get(`${wa}/tags`).then((r) => r.data.data);
export const fetchConversationProfile = (waId: string): Promise<{ contact: ContactRecord | null; evidenceTypes: string[] }> =>
  apiClient.get(`${wa}/conversations/${encodeURIComponent(waId)}/profile`).then((r) => r.data.data);

export interface GroupsStatus {
  supported: boolean;
  reason: string;
  nextSteps: string[];
}
export const fetchGroupsStatus = (): Promise<GroupsStatus> => apiClient.get(`${wa}/groups/status`).then((r) => r.data.data);

export const retryMessage = (messageId: string): Promise<SendResult> =>
  apiClient.post(`${wa}/messages/${encodeURIComponent(messageId)}/retry`, {}).then((r) => r.data.data);

export const markConversationRead = (waId: string, upTo?: string): Promise<{ lastReadAt: string }> =>
  apiClient.post(`${wa}/conversations/${encodeURIComponent(waId)}/read`, upTo ? { upTo } : {}).then((r) => r.data.data);

export const assignConversation = (waId: string, assigneeId: string | null): Promise<{ changed: boolean; contact: ContactDetail }> =>
  apiClient.put(`${wa}/conversations/${encodeURIComponent(waId)}/assignment`, { assigneeId }).then((r) => r.data.data);

export const fetchEvents = (waId: string): Promise<{ items: ConversationEvent[] }> =>
  apiClient.get(`${wa}/conversations/${encodeURIComponent(waId)}/events`).then((r) => r.data.data);

export const addNote = (waId: string, body: string): Promise<ConversationEvent> =>
  apiClient.post(`${wa}/conversations/${encodeURIComponent(waId)}/notes`, { body }).then((r) => r.data.data);

export const fetchTeam = (): Promise<{ items: PersonRef[] }> => apiClient.get(`${wa}/team`).then((r) => r.data.data);

// ─── Admin Management (Super Admin only) ────────────────────────────────────
export type RoleKey = "MANAGER" | "SUPPORT_AGENT" | "ANALYST" | "CUSTOM";

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: "ADMIN" | "SUPERADMIN" | "BUSINESS_ADMIN";
  roleKey: RoleKey | null;
  modules: string[];
  permissions: Record<string, string[]>;
  source: "superadmin" | "permissions" | "allowlist" | "none";
  createdAt: string;
}

export type Permissions = Record<string, string[]>;

export interface AdminMeta {
  actions: { key: string; label: string }[];
  modules: { key: string; label: string }[];
  roles: { key: RoleKey; label: string; description: string; modules: string[]; permissions: Permissions }[];
}

export interface AuditEntry {
  id: string;
  at: string;
  actorEmail: string | null;
  action: string;
  targetEmail: string | null;
  targetUserId: string | null;
  details: Record<string, unknown> | null;
}

export interface AdminList {
  items: AdminAccount[];
  total: number;
  page: number;
  pageSize: number;
}

export const fetchAdminMeta = (): Promise<AdminMeta> => apiClient.get("/business-admin/admins/meta").then((r) => r.data.data);

export const fetchAdmins = (q: string, page = 1, pageSize = 25, filters: { status?: string; module?: string } = {}): Promise<AdminList> =>
  apiClient.get("/business-admin/admins", { params: { page, pageSize, ...(q && { q }), ...(filters.status && { status: filters.status }), ...(filters.module && { module: filters.module }) } }).then((r) => r.data.data);

export const fetchAdminAudit = (page = 1, pageSize = 25): Promise<{ items: AuditEntry[]; total: number; page: number; pageSize: number }> =>
  apiClient.get("/business-admin/admins/audit-log", { params: { page, pageSize } }).then((r) => r.data.data);

export const createAdmin = (input: { name: string; email: string; password: string; roleKey: RoleKey; permissions?: Permissions }): Promise<AdminAccount> =>
  apiClient.post("/business-admin/admins", input).then((r) => r.data.data);

export const updateAdmin = (id: string, patch: { name?: string; roleKey?: RoleKey; permissions?: Permissions; isActive?: boolean }): Promise<AdminAccount> =>
  apiClient.patch(`/business-admin/admins/${encodeURIComponent(id)}`, patch).then((r) => r.data.data);

export const resetAdminPassword = (id: string, password: string): Promise<{ reset: boolean }> =>
  apiClient.post(`/business-admin/admins/${encodeURIComponent(id)}/reset-password`, { password }).then((r) => r.data.data);

/** The field a 400 from the server is about (e.g. "email"), if any. */
export const apiErrorField = (err: unknown): string | undefined => (err as { response?: { data?: { data?: { field?: string } } } })?.response?.data?.data?.field;

/** The stable machine code of an expected API failure (e.g. WINDOW_CLOSED), if any. */
export const apiErrorCode = (err: unknown): string | undefined => (err as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data?.code;

/** The server's own user-facing message for 4xx errors it wrote itself. */
export const apiErrorMessage = (err: unknown): string | undefined => {
  const e = err as { response?: { status?: number; data?: { message?: string } } };
  return e?.response?.status && e.response.status < 500 ? e.response.data?.message : undefined;
};

/** Maps an axios error to a short, user-facing reason without exposing server details. */
export function describeApiError(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have Business Admin access.";
  if (status === 400 || status === 409 || status === 422) return apiErrorMessage(err) ?? "The request was not valid.";
  if (status === 503) return apiErrorMessage(err) ?? "This feature is not available right now.";
  if (status === 429) return "You are doing that too fast. Wait a moment and try again.";
  if (status && status >= 500) return "The server could not complete the request. Please try again.";
  return "Could not reach the server. Check your connection and try again.";
}

/** Clarity errors carry their own explanation (daily limit, bad token, unreachable). Prefer it over the generic wording. */
export function describeClarityError(err: unknown): string {
  const body = (err as { response?: { data?: { message?: string; data?: { code?: string } } } })?.response?.data;
  const code = body?.data?.code;
  // These messages are written by the server for admins (no secrets or internals), so they are safe to show even on a 5xx.
  if ((code === "DAILY_LIMIT" || code === "UPSTREAM" || code === "INVALID_TOKEN" || code === "NOT_CONFIGURED") && typeof body?.message === "string" && body.message) return body.message;
  return describeApiError(err);
}

// ─── Website analytics (Microsoft Clarity Data Export API) ───────────────────
export interface ClarityTotals {
  sessions: number | null;
  botSessions: number | null;
  distinctUsers: number | null;
  pagesPerSession: number | null;
  scrollDepthPercent: number | null;
  totalTimeSeconds: number | null;
  activeTimeSeconds: number | null;
  rageClickSessions: number | null;
  deadClickSessions: number | null;
  quickbackSessions: number | null;
  excessiveScrollSessions: number | null;
  scriptErrorSessions: number | null;
}
export interface ClarityMeta {
  numOfDays: number;
  dimension: string;
  fetchedAt: string;
  source: "cache" | "clarity";
  stale: boolean;
}
export interface ClarityStatus {
  tokenConfigured: boolean;
  projectIdConfigured: boolean;
  requestsUsedToday: number;
  requestsAllowedPerDay: number;
  cacheMinutes: number;
  dashboardLinks: { dashboard: string; recordings: string; heatmaps: string; settings: string } | null;
  dimensions: string[];
  unavailable: Array<{ key: string; label: string; reason: string }>;
}
export interface ClarityRow {
  label: string;
  sessions: number | null;
  users: number | null;
  dims: Record<string, string>;
}
export interface ClarityBreakdown {
  dimension: string;
  rows: ClarityRow[];
  pages: Array<{ url: string; visits: number | null }>;
  total: number;
  meta: ClarityMeta;
}
export interface ClarityHistoryItem {
  fetchedAt: string;
  numOfDays: number;
  totals: ClarityTotals;
}
export type ClarityDays = 1 | 2 | 3;

const an = "/business-admin/analytics";
export const fetchClarityStatus = (): Promise<ClarityStatus> => apiClient.get(`${an}/status`).then((r) => r.data.data);
export const fetchClarityOverview = (days: ClarityDays, refresh = false): Promise<{ totals: ClarityTotals; meta: ClarityMeta }> =>
  apiClient.get(`${an}/overview`, { params: { days, ...(refresh && { refresh: 1 }) } }).then((r) => r.data.data);
export const fetchClarityBreakdown = (dimension: string, days: ClarityDays, refresh = false): Promise<ClarityBreakdown> =>
  apiClient.get(`${an}/breakdown`, { params: { dimension, days, ...(refresh && { refresh: 1 }) } }).then((r) => r.data.data);
export const fetchClarityHistory = (): Promise<{ items: ClarityHistoryItem[] }> => apiClient.get(`${an}/history`).then((r) => r.data.data);

// ─── Template Manager + Automations ──────────────────────────────────────────
const tm = "/business-admin/template-manager";
const au = "/business-admin/automations";

export type TemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";
export type HeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
export type TemplateButton =
  | { type: "QUICK_REPLY"; text: string }
  | { type: "URL"; text: string; url: string; example?: string }
  | { type: "PHONE_NUMBER"; text: string; phoneNumber: string }
  | { type: "COPY_CODE"; example: string };

export interface TemplateDraft {
  header: { format: HeaderFormat; text?: string; exampleHandle?: string } | null;
  body: { text: string };
  footer: string | null;
  buttons: TemplateButton[];
  examples: Record<string, string>;
  headerExample?: string;
  authentication?: { securityRecommendation: boolean; expiryMinutes: number | null; buttonText: string };
}

export interface ManagedTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  parameterFormat: "POSITIONAL" | "NAMED";
  status: string;
  statusSource: "local" | "meta";
  metaTemplateId: string | null;
  draft: TemplateDraft;
  rejectedReason: string | null;
  lastError: string | null;
  submittedAt: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  approved: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canDelete: boolean;
}

export interface TemplateInput {
  name: string;
  language: string;
  category: TemplateCategory;
  parameterFormat: "POSITIONAL" | "NAMED";
  draft: TemplateDraft;
}

export interface FieldError {
  field: string;
  message: string;
}
/** Per-field problems from a rejected template save (so the form can mark each one). */
export const apiFieldErrors = (err: unknown): FieldError[] => (err as { response?: { data?: { data?: { errors?: FieldError[] } } } })?.response?.data?.data?.errors ?? [];

export const fetchManagedTemplates = (): Promise<{ items: ManagedTemplate[] }> => apiClient.get(`${tm}/templates`).then((r) => r.data.data);
export const createManagedTemplate = (input: TemplateInput): Promise<ManagedTemplate> => apiClient.post(`${tm}/templates`, input).then((r) => r.data.data);
export const updateManagedTemplate = (id: string, input: TemplateInput): Promise<ManagedTemplate> => apiClient.put(`${tm}/templates/${encodeURIComponent(id)}`, input).then((r) => r.data.data);
export const submitManagedTemplate = (id: string): Promise<ManagedTemplate> => apiClient.post(`${tm}/templates/${encodeURIComponent(id)}/submit`, {}).then((r) => r.data.data);
export const deleteManagedTemplate = (id: string): Promise<{ deleted: boolean }> => apiClient.delete(`${tm}/templates/${encodeURIComponent(id)}`).then((r) => r.data.data);
export const syncManagedTemplates = (): Promise<{ total: number; created: number; updated: number; byStatus: Record<string, number> }> => apiClient.post(`${tm}/sync`, {}).then((r) => r.data.data);
export const uploadTemplateExample = (format: HeaderFormat, file: File): Promise<{ handle: string }> => {
  const form = new FormData();
  form.append("format", format);
  form.append("file", file);
  return apiClient.post(`${tm}/example`, form, { timeout: 120_000 }).then((r) => r.data.data);
};

export interface EventField {
  key: string;
  label: string;
}
export interface EndpointInfo {
  event: string;
  status: "connected" | "no_phone" | "missing";
  method: string | null;
  route: string | null;
  firesWhen: string;
  source: string | null;
  alsoVia: string[];
  needs: string | null;
}
export interface SuggestedTemplate {
  name: string;
  category: string;
  body: string;
  mapping: string[];
  examples: string[];
}
export interface AutomationEvent {
  key: string;
  activity: string;
  label: string;
  description: string;
  fields: EventField[];
  suggested: SuggestedTemplate;
  endpoint: EndpointInfo | null;
}
export type VariableSource = { source: "field"; key: string; fallback?: string } | { source: "static"; value: string };
export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: string;
  templateName: string;
  templateLanguage: string;
  variableMapping: Record<string, VariableSource>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}
export interface RuleInput {
  name: string;
  triggerEvent: string;
  templateName: string;
  templateLanguage: string;
  variableMapping: Record<string, VariableSource>;
}
export interface ApprovedTemplate {
  name: string;
  language: string;
  category: string;
  body: string;
  variables: string[];
  parameterFormat: "POSITIONAL" | "NAMED";
}
export type ExecutionStatus = "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "SKIPPED";
export interface AutomationExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  triggerEvent: string;
  eventId: string;
  contactWaId: string;
  templateName: string;
  status: ExecutionStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  skipReason: string | null;
  lastError: string | null;
  history: Array<{ at: string; event: string; detail?: string }>;
  sentAt: string | null;
  createdAt: string;
}

export const fetchAutomationMeta = (): Promise<{ events: AutomationEvent[]; enabled: boolean; sandbox?: boolean; counts: Record<string, number> }> => apiClient.get(`${au}/meta`).then((r) => r.data.data);
export const seedSuggestedTemplates = (events?: string[]): Promise<{ created: string[]; skipped: string[] }> => apiClient.post(`${au}/suggested-templates`, events ? { events } : {}).then((r) => r.data.data);
export const fetchApprovedTemplates = (): Promise<{ items: ApprovedTemplate[] }> => apiClient.get(`${au}/templates`).then((r) => r.data.data);
export const fetchRules = (): Promise<{ items: AutomationRule[] }> => apiClient.get(`${au}/rules`).then((r) => r.data.data);
export const createRule = (input: RuleInput): Promise<AutomationRule> => apiClient.post(`${au}/rules`, input).then((r) => r.data.data);
export const updateRule = (id: string, input: RuleInput): Promise<AutomationRule> => apiClient.put(`${au}/rules/${encodeURIComponent(id)}`, input).then((r) => r.data.data);
export const setRuleActive = (id: string, active: boolean): Promise<AutomationRule> => apiClient.put(`${au}/rules/${encodeURIComponent(id)}/active`, { active }).then((r) => r.data.data);
export const deleteRule = (id: string): Promise<{ deleted: boolean }> => apiClient.delete(`${au}/rules/${encodeURIComponent(id)}`).then((r) => r.data.data);
export const fetchExecutions = (p: { status?: string; ruleId?: string; page?: number }): Promise<{ items: AutomationExecution[]; total: number }> => apiClient.get(`${au}/executions`, { params: { ...p, pageSize: 25 } }).then((r) => r.data.data);
export const retryExecution = (id: string): Promise<AutomationExecution> => apiClient.post(`${au}/executions/${encodeURIComponent(id)}/retry`, {}).then((r) => r.data.data);

/** DEV SANDBOX ONLY (the route does not exist in production). Stands in for a customer action; sends only to the mock sender. */
export const simulateActivity = (input: { event: string; phone: string; eventId?: string }): Promise<{ matched: number; queued: number; skipped: number; duplicates: number }> =>
  apiClient.post(`${au}/simulate`, input).then((r) => r.data.data);

// ─── Email Automation (Resend) ───────────────────────────────────────────────
export type EmailTemplateType = "TRANSACTIONAL" | "PROMOTIONAL";
export type EmailTrigger = "USER_REGISTERED" | "FOLLOW_UP" | "SCHEDULED_EMAIL" | "MANUAL_SEND";
export type EmailMessageStatus = "QUEUED" | "SENDING" | "SENT" | "DELIVERED" | "BOUNCED" | "COMPLAINED" | "FAILED" | "CANCELLED" | "SKIPPED" | "UNCONFIRMED";

export interface EmailStatus {
  provider: string;
  configured: boolean;
  engineEnabled: boolean;
  webhookConfigured: boolean;
}
export interface EmailStats {
  totalSent: number;
  delivered: number;
  failed: number;
  pendingScheduled: number;
  skipped: number;
  /** Emails whose outcome is unknown. Never retried automatically; an admin reconciles each one. */
  needsReview: number;
  activeAutomations: number;
  templates: number;
}
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  type: EmailTemplateType;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}
export interface EmailTemplateInput {
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  type: EmailTemplateType;
  status: "ACTIVE" | "INACTIVE";
}
export interface EmailAutomation {
  id: string;
  name: string;
  trigger: EmailTrigger;
  templateId: string;
  template: { id: string; name: string; type: EmailTemplateType; status: string };
  anchorEvent: string | null;
  delayMinutes: number;
  scheduledAt: string | null;
  firedAt: string | null;
  expiredAt: string | null;
  isActive: boolean;
  runs: { queued: number; sent: number; failed: number; skipped: number; needsReview: number };
}
export interface EmailAutomationInput {
  name: string;
  trigger: Exclude<EmailTrigger, "MANUAL_SEND">;
  templateId: string;
  anchorEvent?: string;
  delayMinutes?: number;
  scheduledAt?: string;
}
export interface EmailMessage {
  id: string;
  toEmail: string;
  subject: string;
  status: EmailMessageStatus;
  trigger: EmailTrigger;
  scheduledFor: string;
  attempts: number;
  sentAt: string | null;
  deliveredAt: string | null;
  failureReason: string | null;
  resendId: string | null;
  isTest: boolean;
  maybeAccepted?: boolean;
  createdAt: string;
  template: { name: string } | null;
  automation: { name: string } | null;
}
export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  marketingOptIn: boolean;
  unsubscribed: boolean;
}
export interface EmailSendResult {
  results: { userId: string; email?: string; outcome: "queued" | "sent" | "skipped" | "duplicate" | "failed" | "needs_review"; reason?: string }[];
}

const E = "/business-admin/email";
export const fetchEmailStatus = (): Promise<EmailStatus> => apiClient.get(`${E}/status`).then((r) => r.data.data);
export const checkEmailConnection = (): Promise<{ ok: boolean; message: string }> => apiClient.post(`${E}/check`).then((r) => r.data.data);
export const fetchEmailStats = (): Promise<EmailStats> => apiClient.get(`${E}/stats`).then((r) => r.data.data);
export const fetchEmailTemplates = (): Promise<EmailTemplate[]> => apiClient.get(`${E}/templates`).then((r) => r.data.data);
export const createEmailTemplate = (b: EmailTemplateInput): Promise<EmailTemplate> => apiClient.post(`${E}/templates`, b).then((r) => r.data.data);
export const updateEmailTemplate = (id: string, b: EmailTemplateInput): Promise<EmailTemplate> => apiClient.put(`${E}/templates/${id}`, b).then((r) => r.data.data);
export const archiveEmailTemplate = (id: string): Promise<void> => apiClient.delete(`${E}/templates/${id}`).then(() => undefined);
export const previewEmail = (b: { templateId?: string; draft?: EmailTemplateInput }): Promise<{ subject: string; html: string; text: string; type: EmailTemplateType }> => apiClient.post(`${E}/preview`, b).then((r) => r.data.data);
export const sendTestEmail = (id: string): Promise<{ status: string; reason?: string }> => apiClient.post(`${E}/templates/${id}/test`).then((r) => r.data.data);
export const fetchEmailAutomations = (): Promise<EmailAutomation[]> => apiClient.get(`${E}/automations`).then((r) => r.data.data);
export const createEmailAutomation = (b: EmailAutomationInput): Promise<EmailAutomation> => apiClient.post(`${E}/automations`, b).then((r) => r.data.data);
export const updateEmailAutomation = (id: string, b: EmailAutomationInput): Promise<EmailAutomation> => apiClient.put(`${E}/automations/${id}`, b).then((r) => r.data.data);
export const setEmailAutomationActive = (id: string, active: boolean): Promise<EmailAutomation> => apiClient.put(`${E}/automations/${id}/active`, { active }).then((r) => r.data.data);
export const deleteEmailAutomation = (id: string): Promise<void> => apiClient.delete(`${E}/automations/${id}`).then(() => undefined);
export const searchEmailRecipients = (q: string): Promise<EmailRecipient[]> => apiClient.get(`${E}/recipients`, { params: { q } }).then((r) => r.data.data);
export const sendEmailManually = (b: { templateId: string; userIds: string[]; scheduledFor?: string }): Promise<EmailSendResult> => apiClient.post(`${E}/send`, b).then((r) => r.data.data);
export const fetchScheduledEmails = (): Promise<EmailMessage[]> => apiClient.get(`${E}/scheduled`).then((r) => r.data.data);
export const cancelScheduledEmail = (id: string): Promise<void> => apiClient.post(`${E}/messages/${id}/cancel`).then(() => undefined);
export const retryEmail = (id: string): Promise<void> => apiClient.post(`${E}/messages/${id}/retry`).then(() => undefined);
/** Records what an admin found in Resend for an email that needs review. Sends nothing. */
export const resolveEmail = (id: string, outcome: "SENT" | "NOT_SENT"): Promise<void> => apiClient.post(`${E}/messages/${id}/resolve`, { outcome }).then(() => undefined);
export const fetchEmailActivity = (p: { search?: string; status?: string; page?: number; automationId?: string }): Promise<{ total: number; page: number; limit: number; items: EmailMessage[] }> =>
  apiClient.get(`${E}/activity`, { params: p }).then((r) => r.data.data);

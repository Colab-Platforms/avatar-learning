// Pure helpers for the Template Manager UI: variable detection and the live WhatsApp-style preview.
// The server re-validates everything; these only give instant feedback while typing.

export type ParameterFormat = "POSITIONAL" | "NAMED";

const VAR_RE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const NUMBERED = /^[1-9][0-9]*$/;
const NAMED = /^[a-z][a-z0-9_]*$/;

/** Distinct valid variables in order of first appearance. */
export function variablesIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(VAR_RE)) if ((NUMBERED.test(m[1]) || NAMED.test(m[1])) && !out.includes(m[1])) out.push(m[1]);
  return out;
}

/** Problems the author can fix right now. Empty = looks fine (Meta still has the final say). */
export function variableProblems(text: string, format: ParameterFormat): string[] {
  const problems: string[] = [];
  const all = [...text.matchAll(VAR_RE)].map((m) => m[1]);
  for (const v of all) if (!NUMBERED.test(v) && !NAMED.test(v)) problems.push(`{{${v}}} is not a valid variable.`);
  const vars = variablesIn(text);
  if (format === "POSITIONAL") {
    if (vars.some((v) => !NUMBERED.test(v))) problems.push("Numbered templates can only use {{1}}, {{2}}…");
    const nums = vars.filter((v) => NUMBERED.test(v)).map(Number).sort((a, b) => a - b);
    if (nums.some((n, i) => n !== i + 1)) problems.push("Numbers must run {{1}}, {{2}}, {{3}} without gaps.");
  } else if (vars.some((v) => NUMBERED.test(v))) problems.push("Named templates use names like {{first_name}}, not numbers.");
  if (vars.length && (/^\s*\{\{[^}]*\}\}/.test(text) || /\{\{[^}]*\}\}\s*$/.test(text))) problems.push("A variable cannot be the first or last thing in the body.");
  return problems;
}

/** Replaces each {{variable}} with its sample value (or leaves the placeholder visible when no sample yet). */
export function renderPreview(text: string, examples: Record<string, string>): string {
  return text.replace(VAR_RE, (whole, v: string) => (examples[v] ? examples[v] : whole));
}

/** Template names Meta accepts: lowercase letters, digits, underscores. Offers a corrected suggestion. */
export function suggestName(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 512);
}
export const isValidName = (n: string): boolean => /^[a-z0-9_]+$/.test(n);

/** Keeps `examples` aligned with the variables currently in the text (keeps typed samples, drops stale ones). */
export function syncExamples(vars: string[], previous: Record<string, string>): Record<string, string> {
  return Object.fromEntries(vars.map((v) => [v, previous[v] ?? ""]));
}

export type StatusTone = "ok" | "warn" | "off" | "info";
/** How a Meta status is shown. Unknown statuses are shown verbatim, never guessed. */
export function statusTone(status: string): StatusTone {
  switch (status) {
    case "APPROVED":
      return "ok";
    case "PENDING":
    case "IN_APPEAL":
      return "info";
    case "REJECTED":
    case "PAUSED":
    case "DISABLED":
    case "FLAGGED":
      return "warn";
    default:
      return "off";
  }
}
export const statusLabel = (status: string, source: "local" | "meta"): string => (source === "local" ? "Draft (not sent to Meta)" : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " "));

// ─── Inbox redesign helpers: status kinds, search/filter, exact-name matching, preview segments ────────────

/** The five groups the UI filters and colours by. PAUSED/DISABLED/FLAGGED are "other": shown verbatim, never relabelled. */
export type StatusKind = "approved" | "pending" | "rejected" | "draft" | "other";
export function statusKind(status: string, source: "local" | "meta" = "meta"): StatusKind {
  if (source === "local") return "draft";
  switch (status) {
    case "APPROVED":
      return "approved";
    case "PENDING":
    case "IN_APPEAL":
      return "pending";
    case "REJECTED":
      return "rejected";
    default:
      return "other";
  }
}

export const STATUS_FILTERS = ["all", "approved", "pending", "rejected", "draft"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

/** Identity of a template everywhere (manager, Meta sync, picker): the exact name plus language. Never fuzzy. */
export const templateKey = (name: string, language: string): string => `${name}::${language}`;

/** Case-insensitive name search; spaces count as underscores ("order up" finds order_update). Empty query matches all. */
export function matchesName(name: string, query: string): boolean {
  const q = query.trim().toLowerCase().replace(/\s+/g, "_");
  return q === "" || name.toLowerCase().includes(q);
}

export interface Filterable {
  name: string;
  status: string;
  statusSource?: "local" | "meta";
}
export function filterTemplates<T extends Filterable>(items: T[], opts: { q?: string; status?: StatusFilter }): T[] {
  const want = opts.status ?? "all";
  return items.filter((t) => matchesName(t.name, opts.q ?? "") && (want === "all" || statusKind(t.status, t.statusSource ?? "meta") === want));
}

export function statusCounts<T extends Filterable>(items: T[]): Record<StatusFilter, number> {
  const out: Record<StatusFilter, number> = { all: items.length, approved: 0, pending: 0, rejected: 0, draft: 0 };
  for (const t of items) {
    const k = statusKind(t.status, t.statusSource ?? "meta");
    if (k !== "other") out[k] += 1;
  }
  return out;
}

export interface TemplateSegment {
  kind: "text" | "var";
  text: string;
  /** Variable name ("1", "first_name") for kind "var". */
  name?: string;
  /** True when a real, non-blank value was supplied (so the UI can mark it as actual content, not a placeholder). */
  filled?: boolean;
}

/** Splits text into plain and variable parts. A variable with no value stays as its {{placeholder}}; nothing is invented. */
export function segmentTemplate(text: string, values: Record<string, string>): TemplateSegment[] {
  const out: TemplateSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(VAR_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: "text", text: text.slice(last, idx) });
    const name = m[1];
    const v = values[name];
    const filled = typeof v === "string" && v.trim() !== "";
    out.push({ kind: "var", name, filled, text: filled ? v : `{{${name}}}` });
    last = idx + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", text: text.slice(last) });
  return out;
}

/** Maps positional input values onto the template's variable names, in fill order. */
export const valuesByName = (variables: string[], params: string[]): Record<string, string> => Object.fromEntries(variables.map((n, i) => [n, params[i] ?? ""]));

/** A template may be sent only when Meta says APPROVED and the server says it is sendable. Both must hold. */
export const canSendTemplate = (t: { status: string; sendable: boolean }): boolean => t.status === "APPROVED" && t.sendable;

/** Why a template cannot be picked, in plain words (null when it can). Never hides the real reason. */
export function blockedReason(t: { status: string; sendable: boolean; unsupportedReason: string | null; rejectedReason?: string | null }): string | null {
  if (canSendTemplate(t)) return null;
  if (t.status === "PENDING" || t.status === "IN_APPEAL") return "Waiting for Meta approval. Only approved templates can be sent.";
  if (t.status === "REJECTED") return `Rejected by Meta${t.rejectedReason ? `: ${t.rejectedReason.replace(/_/g, " ").toLowerCase()}` : ""}. Only approved templates can be sent.`;
  if (t.status !== "APPROVED") return `Status is ${t.status || "unknown"}. Only approved templates can be sent.`;
  return t.unsupportedReason ?? "This template cannot be sent from here.";
}

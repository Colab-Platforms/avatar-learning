import type { TemplateDefinition } from "@/modules/whatsapp/whatsapp.client.js";

export interface TemplateDto {
  name: string;
  language: string;
  category: string;
  status: string;
  /** Body text with {{1}}, {{2}} placeholders. */
  body: string;
  header: string | null;
  footer: string | null;
  /** Number of body variables ({{1}}..{{n}}, or how many distinct {{names}}). */
  variableCount: number;
  /** Body variables in fill order: "1","2".. for numbered templates, or the names for named ones. */
  variables: string[];
  parameterFormat: "POSITIONAL" | "NAMED";
  /** Meta's template id, and why Meta rejected it (REJECTED only). */
  metaId: string | null;
  rejectedReason: string | null;
  /** True when this inbox can fill and send the template (approved, body variables only). */
  sendable: boolean;
  /** Why it cannot be sent from here, when sendable is false. */
  unsupportedReason: string | null;
}

const MAX_PARAM_LENGTH = 1024;

const bodyOf = (t: TemplateDefinition): string => String((t.components.find((c) => c.type === "BODY") ?? {}).text ?? "");
export const countVariables = (text: string): number => {
  const nums = [...text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : 0;
};
/** Distinct {{name}} placeholders in order of first appearance (named-parameter templates). */
export const namedVariables = (text: string): string[] => [...new Set([...text.matchAll(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g)].map((m) => m[1]))];

/** Pure: turns Meta's definition into what the UI needs and decides if we can send it. */
export function toTemplateDto(t: TemplateDefinition): TemplateDto {
  const header = t.components.find((c) => c.type === "HEADER");
  const footer = t.components.find((c) => c.type === "FOOTER");
  const buttons = t.components.find((c) => c.type === "BUTTONS");
  const body = bodyOf(t);
  const named = t.parameterFormat === "NAMED";
  const variables = named ? namedVariables(body) : Array.from({ length: countVariables(body) }, (_v, i) => String(i + 1));
  const headerFormat = header ? String(header.format ?? "TEXT") : null;
  let unsupportedReason: string | null = null;
  if (t.status !== "APPROVED") unsupportedReason = `Status is ${t.status || "unknown"}: only approved templates can be sent.`;
  else if (t.category === "AUTHENTICATION") unsupportedReason = "Authentication (one-time code) templates need a code button and are not supported here.";
  else if (headerFormat && headerFormat !== "TEXT") unsupportedReason = `This template has a ${headerFormat.toLowerCase()} header, which needs a media file. Media headers are not supported here yet.`;
  else if (header && countVariables(String(header.text ?? "")) > 0) unsupportedReason = "This template has a variable in its header, which is not supported here yet.";
  else if (buttons && JSON.stringify(buttons.buttons ?? []).includes("{{")) unsupportedReason = "This template has a button with a variable, which is not supported here yet.";
  else if (!body) unsupportedReason = "This template has no body text.";
  return {
    name: t.name,
    language: t.language,
    category: t.category,
    status: t.status,
    body,
    header: header && headerFormat === "TEXT" ? String(header.text ?? "") : header ? `[${headerFormat?.toLowerCase()} header]` : null,
    footer: footer ? String(footer.text ?? "") : null,
    variableCount: variables.length,
    variables,
    parameterFormat: named ? "NAMED" : "POSITIONAL",
    metaId: t.id ?? null,
    rejectedReason: t.rejectedReason ?? null,
    sendable: unsupportedReason === null,
    unsupportedReason,
  };
}

/** Fills {{n}} placeholders for the in-app preview and the stored message text. */
export const renderTemplate = (body: string, params: string[], names?: string[]): string =>
  names && names.length > 0
    ? body.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g, (_m, n: string) => params[names.indexOf(n)] ?? "")
    : body.replace(/\{\{\s*(\d+)\s*\}\}/g, (_m, n: string) => params[Number(n) - 1] ?? "");

/**
 * WhatsApp rejects template parameters with newlines, tabs or 4+ consecutive spaces, and limits length.
 * Returns the cleaned value, or null when it is empty after cleaning.
 */
export function cleanParam(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const c = v.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, MAX_PARAM_LENGTH);
  return c.length > 0 ? c : null;
}

export type TemplateProblem = "not_found" | "not_sendable" | "wrong_param_count" | "bad_param";

export interface TemplatesDeps {
  fetchTemplates: () => Promise<TemplateDefinition[]>;
  now?: () => Date;
  /** How long a fetched list is reused (default 5 minutes). */
  ttlMs?: number;
}

export class TemplatesService {
  private cache: { at: number; items: TemplateDto[] } | null = null;
  private readonly now: () => Date;
  private readonly ttl: number;
  constructor(private readonly deps: TemplatesDeps) {
    this.now = deps.now ?? (() => new Date());
    this.ttl = deps.ttlMs ?? 5 * 60_000;
  }

  /** Live from Meta (cached briefly). Throws when Meta cannot be reached or is not configured: nothing is invented. */
  async list(force = false): Promise<TemplateDto[]> {
    const t = this.now().getTime();
    if (!force && this.cache && t - this.cache.at < this.ttl) return this.cache.items;
    const items = (await this.deps.fetchTemplates()).map(toTemplateDto).sort((a, b) => a.name.localeCompare(b.name) || a.language.localeCompare(b.language));
    this.cache = { at: t, items };
    return items;
  }

  /** Validates a send request against the real, approved template list. */
  async resolve(
    name: string,
    language: string,
    params: unknown,
  ): Promise<{ ok: true; template: TemplateDto; params: string[]; paramNames?: string[]; rendered: string } | { ok: false; problem: TemplateProblem; message: string }> {
    let template = (await this.list()).find((x) => x.name === name && x.language === language);
    // A template approved a minute ago may not be in the cached list yet.
    if (!template) template = (await this.list(true)).find((x) => x.name === name && x.language === language);
    if (!template) return { ok: false, problem: "not_found", message: "That template does not exist (or is not approved) in your WhatsApp Business account." };
    if (!template.sendable) return { ok: false, problem: "not_sendable", message: template.unsupportedReason ?? "This template cannot be sent from here." };
    const raw = Array.isArray(params) ? params : [];
    if (raw.length !== template.variableCount) {
      return { ok: false, problem: "wrong_param_count", message: `This template needs ${template.variableCount} value${template.variableCount === 1 ? "" : "s"}; ${raw.length} given.` };
    }
    const cleaned = raw.map(cleanParam);
    if (cleaned.some((c) => c === null)) return { ok: false, problem: "bad_param", message: "Fill in every template value (they cannot be empty)." };
    const values = cleaned as string[];
    const paramNames = template.parameterFormat === "NAMED" ? template.variables : undefined;
    return { ok: true, template, params: values, ...(paramNames ? { paramNames } : {}), rendered: renderTemplate(template.body, values, paramNames) };
  }
}

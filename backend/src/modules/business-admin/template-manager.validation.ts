// Pure rules for WhatsApp message templates: what Meta accepts, and how a draft becomes Meta's `components`.
// No I/O here. Meta stays the final judge: these checks only catch what can be caught before a (slow, hard to undo) submission.

export const CATEGORIES = ["UTILITY", "MARKETING", "AUTHENTICATION"] as const;
export type TemplateCategory = (typeof CATEGORIES)[number];
export const HEADER_FORMATS = ["TEXT", "IMAGE", "VIDEO", "DOCUMENT"] as const;
export type HeaderFormat = (typeof HEADER_FORMATS)[number];
export type ParameterFormat = "POSITIONAL" | "NAMED";

export type TemplateButton =
  | { type: "QUICK_REPLY"; text: string }
  | { type: "URL"; text: string; url: string; example?: string }
  | { type: "PHONE_NUMBER"; text: string; phoneNumber: string }
  | { type: "COPY_CODE"; example: string };

export interface TemplateDraft {
  header: { format: HeaderFormat; text?: string; /** Meta media handle from the sample upload (image/video/document headers). */ exampleHandle?: string } | null;
  body: { text: string };
  footer: string | null;
  buttons: TemplateButton[];
  /** Sample value for every body variable (key = "1", "2".. or the variable name). Meta requires them. */
  examples: Record<string, string>;
  /** Sample value for the single header variable, if the text header has one. */
  headerExample?: string;
  /** AUTHENTICATION templates only: Meta supplies the fixed body wording. */
  authentication?: { securityRecommendation: boolean; expiryMinutes: number | null; buttonText: string };
}

export interface TemplateInput {
  name: string;
  language: string;
  category: TemplateCategory;
  parameterFormat: ParameterFormat;
  draft: TemplateDraft;
}

export interface FieldError {
  field: string;
  message: string;
}

export const LIMITS = { body: 1024, header: 60, footer: 60, buttonText: 25, url: 2000, example: 1024, buttons: 10, name: 512 } as const;
export const MEDIA_EXAMPLE_LIMITS: Record<Exclude<HeaderFormat, "TEXT">, { mimes: string[]; maxBytes: number; label: string }> = {
  IMAGE: { mimes: ["image/jpeg", "image/png"], maxBytes: 5 * 1024 * 1024, label: "JPEG or PNG up to 5 MB" },
  VIDEO: { mimes: ["video/mp4"], maxBytes: 16 * 1024 * 1024, label: "MP4 up to 16 MB" },
  DOCUMENT: { mimes: ["application/pdf"], maxBytes: 100 * 1024 * 1024, label: "PDF up to 100 MB" },
};

const NAME_RE = /^[a-z0-9_]+$/;
const LANG_RE = /^[a-z]{2,3}(_[A-Z]{2})?$/;
const VAR_RE = /\{\{\s*([^{}]*?)\s*\}\}/g;
const NUMBERED_RE = /^[1-9][0-9]*$/;
const NAMED_RE = /^[a-z][a-z0-9_]*$/;

export interface VariableScan {
  /** Distinct variables in order of first appearance. */
  tokens: string[];
  /** Placeholders that are neither a valid number nor a valid name (e.g. "{{First Name}}"). */
  invalid: string[];
}

/** Finds {{...}} placeholders. */
export function scanVariables(text: string): VariableScan {
  const tokens: string[] = [];
  const invalid: string[] = [];
  for (const m of text.matchAll(VAR_RE)) {
    const t = m[1];
    if (NUMBERED_RE.test(t) || NAMED_RE.test(t)) {
      if (!tokens.includes(t)) tokens.push(t);
    } else invalid.push(m[0]);
  }
  return { tokens, invalid };
}

/** Variables of the body for a given format; used by the UI preview and by validation. */
export const bodyVariables = (text: string): string[] => scanVariables(text).tokens;

/** Parameter values may not contain newlines/tabs (Meta rejects them) and are trimmed. */
export const cleanExample = (v: unknown): string =>
  typeof v === "string" ? v.replace(/[\r\n\t\u0000-\u001f\u007f]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, LIMITS.example) : "";

const MAX_NEWLINE_RUN = /\n{3,}/;

function checkVariables(field: string, text: string, format: ParameterFormat, errors: FieldError[]): string[] {
  const { tokens, invalid } = scanVariables(text);
  for (const bad of invalid) errors.push({ field, message: `${bad} is not a valid variable. Use {{1}} style numbers or {{lowercase_names}}.` });
  if (format === "POSITIONAL") {
    const named = tokens.filter((t) => !NUMBERED_RE.test(t));
    if (named.length) errors.push({ field, message: `This template uses numbered variables ({{1}}). Remove {{${named[0]}}} or switch to named variables.` });
    const nums = tokens.filter((t) => NUMBERED_RE.test(t)).map(Number).sort((a, b) => a - b);
    nums.forEach((n, i) => {
      if (n !== i + 1 && !errors.some((e) => e.field === field && e.message.startsWith("Numbered"))) errors.push({ field, message: `Numbered variables must run {{1}}, {{2}}, {{3}} without gaps (found {{${n}}} where {{${i + 1}}} was expected).` });
    });
  } else {
    const numbered = tokens.filter((t) => NUMBERED_RE.test(t));
    if (numbered.length) errors.push({ field, message: `This template uses named variables. Replace {{${numbered[0]}}} with a name such as {{first_name}}.` });
  }
  return tokens;
}

const isHttpUrl = (u: string): boolean => /^https?:\/\/[^\s{}]+/i.test(u);

/**
 * Validates a template exactly as far as Meta's documented rules allow us to know in advance.
 * Returns the cleaned value (trimmed, examples sanitised) or every problem found, so the UI can show them all at once.
 */
export function validateTemplate(raw: unknown): { ok: true; value: TemplateInput } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const d = (r.draft && typeof r.draft === "object" ? r.draft : {}) as Record<string, any>;
  const str = (v: unknown): string => (typeof v === "string" ? v : "");

  const name = str(r.name).trim();
  if (!name) errors.push({ field: "name", message: "Enter a template name." });
  else if (name.length > LIMITS.name || !NAME_RE.test(name)) errors.push({ field: "name", message: "Use only lowercase letters, numbers and underscores (for example order_confirmation)." });

  const language = str(r.language).trim();
  if (!LANG_RE.test(language)) errors.push({ field: "language", message: "Choose a language (for example en, en_US or hi)." });

  const category = str(r.category).toUpperCase() as TemplateCategory;
  if (!(CATEGORIES as readonly string[]).includes(category)) errors.push({ field: "category", message: "Choose UTILITY, MARKETING or AUTHENTICATION." });

  const parameterFormat: ParameterFormat = r.parameterFormat === "NAMED" ? "NAMED" : "POSITIONAL";
  const draft: TemplateDraft = { header: null, body: { text: "" }, footer: null, buttons: [], examples: {} };

  if (category === "AUTHENTICATION") {
    // Meta writes the body of one-time-code templates itself; we only choose the options.
    const a = (d.authentication && typeof d.authentication === "object" ? d.authentication : {}) as Record<string, any>;
    const exp = a.expiryMinutes === null || a.expiryMinutes === undefined || a.expiryMinutes === "" ? null : Number(a.expiryMinutes);
    if (exp !== null && (!Number.isInteger(exp) || exp < 1 || exp > 90)) errors.push({ field: "draft.authentication.expiryMinutes", message: "Code expiry must be a whole number of minutes from 1 to 90." });
    const buttonText = cleanExample(a.buttonText) || "Copy code";
    if (buttonText.length > LIMITS.buttonText) errors.push({ field: "draft.authentication.buttonText", message: `Button text can be at most ${LIMITS.buttonText} characters.` });
    draft.authentication = { securityRecommendation: a.securityRecommendation !== false, expiryMinutes: exp, buttonText };
    draft.body = { text: "{{1}} is your verification code." };
    if (d.header) errors.push({ field: "draft.header", message: "Authentication templates cannot have a header." });
    if (Array.isArray(d.buttons) && d.buttons.length) errors.push({ field: "draft.buttons", message: "Authentication templates use only the built-in copy-code button." });
    if (errors.length) return { ok: false, errors };
    return { ok: true, value: { name, language, category, parameterFormat: "POSITIONAL", draft } };
  }

  // ── body ──
  const bodyText = str(d.body?.text).replace(/\r\n/g, "\n").trim();
  if (!bodyText) errors.push({ field: "draft.body", message: "Write the message body." });
  else {
    if (bodyText.length > LIMITS.body) errors.push({ field: "draft.body", message: `The body can be at most ${LIMITS.body} characters (it is ${bodyText.length}).` });
    if (MAX_NEWLINE_RUN.test(bodyText)) errors.push({ field: "draft.body", message: "Remove blank lines: Meta does not allow more than one empty line in a row." });
  }
  draft.body = { text: bodyText };
  const bodyTokens = checkVariables("draft.body", bodyText, parameterFormat, errors);
  if (bodyTokens.length && (/^\s*\{\{[^}]*\}\}/.test(bodyText) || /\{\{[^}]*\}\}\s*$/.test(bodyText))) {
    errors.push({ field: "draft.body", message: "A variable cannot be the very first or very last thing in the body. Add some text before and after it." });
  }
  const exSrc = (d.examples && typeof d.examples === "object" ? d.examples : {}) as Record<string, unknown>;
  for (const t of bodyTokens) {
    const v = cleanExample(exSrc[t]);
    if (!v) errors.push({ field: `draft.examples.${t}`, message: `Add a sample value for {{${t}}}. Meta needs one to review the template.` });
    else draft.examples[t] = v;
  }

  // ── header ──
  const h = d.header && typeof d.header === "object" ? (d.header as Record<string, any>) : null;
  if (h) {
    const format = str(h.format).toUpperCase() as HeaderFormat;
    if (!(HEADER_FORMATS as readonly string[]).includes(format)) errors.push({ field: "draft.header", message: "Choose a header type: text, image, video or document." });
    else if (format === "TEXT") {
      const text = str(h.text).trim();
      if (!text) errors.push({ field: "draft.header", message: "Enter the header text, or remove the header." });
      else {
        if (text.length > LIMITS.header) errors.push({ field: "draft.header", message: `The header can be at most ${LIMITS.header} characters.` });
        const tokens = checkVariables("draft.header", text, parameterFormat, errors);
        if (tokens.length > 1) errors.push({ field: "draft.header", message: "A header can contain at most one variable." });
        if (tokens.length === 1) {
          const v = cleanExample(d.headerExample);
          if (!v) errors.push({ field: "draft.headerExample", message: `Add a sample value for {{${tokens[0]}}} in the header.` });
          else draft.headerExample = v;
        }
      }
      draft.header = { format, text };
    } else {
      const handle = str(h.exampleHandle).trim();
      if (!handle) errors.push({ field: "draft.header", message: `Upload a sample ${format.toLowerCase()} (${MEDIA_EXAMPLE_LIMITS[format].label}). Meta needs one to review the template.` });
      else if (handle.length > 2000) errors.push({ field: "draft.header", message: "The sample media reference is invalid. Upload it again." });
      draft.header = { format, exampleHandle: handle };
    }
  }

  // ── footer ──
  const footer = d.footer === null || d.footer === undefined ? "" : str(d.footer).trim();
  if (footer) {
    if (footer.length > LIMITS.footer) errors.push({ field: "draft.footer", message: `The footer can be at most ${LIMITS.footer} characters.` });
    if (scanVariables(footer).tokens.length || /\{\{/.test(footer)) errors.push({ field: "draft.footer", message: "A footer cannot contain variables." });
    draft.footer = footer;
  }

  // ── buttons ──
  const buttons: TemplateButton[] = [];
  const list: any[] = Array.isArray(d.buttons) ? d.buttons : [];
  if (list.length > LIMITS.buttons) errors.push({ field: "draft.buttons", message: `A template can have at most ${LIMITS.buttons} buttons.` });
  list.slice(0, LIMITS.buttons).forEach((b, i) => {
    const f = `draft.buttons.${i}`;
    const type = str(b?.type).toUpperCase();
    const text = str(b?.text).trim();
    const needsText = type !== "COPY_CODE";
    if (needsText && !text) errors.push({ field: f, message: `Button ${i + 1} needs text.` });
    if (text.length > LIMITS.buttonText) errors.push({ field: f, message: `Button ${i + 1} text can be at most ${LIMITS.buttonText} characters.` });
    if (type === "QUICK_REPLY") buttons.push({ type, text });
    else if (type === "URL") {
      const url = str(b?.url).trim();
      const vars = scanVariables(url);
      if (!isHttpUrl(url)) errors.push({ field: f, message: `Button ${i + 1}: enter a full web address starting with https://.` });
      else if (url.length > LIMITS.url) errors.push({ field: f, message: `Button ${i + 1}: the web address is too long.` });
      const hasVar = /\{\{/.test(url);
      let example: string | undefined;
      if (hasVar) {
        if (parameterFormat === "NAMED") errors.push({ field: f, message: `Button ${i + 1}: web address variables are only supported as {{1}}.` });
        if (!/\{\{1\}\}$/.test(url) || vars.tokens.length !== 1 || vars.tokens[0] !== "1") errors.push({ field: f, message: `Button ${i + 1}: a web address can only have one variable, {{1}}, at the very end.` });
        example = cleanExample(b?.example);
        if (!example || !isHttpUrl(example)) errors.push({ field: f, message: `Button ${i + 1}: add a sample full web address (for example https://example.com/orders/123).` });
      }
      buttons.push({ type, text, url, ...(example ? { example } : {}) });
    } else if (type === "PHONE_NUMBER") {
      const phoneNumber = str(b?.phoneNumber).trim();
      if (!/^\+[0-9]{7,18}$/.test(phoneNumber)) errors.push({ field: f, message: `Button ${i + 1}: enter the phone number with country code, like +919876543210.` });
      buttons.push({ type, text, phoneNumber });
    } else if (type === "COPY_CODE") {
      const example = cleanExample(b?.example);
      if (!example || example.length > 15) errors.push({ field: f, message: `Button ${i + 1}: add a sample code of up to 15 characters.` });
      buttons.push({ type, example });
    } else errors.push({ field: f, message: `Button ${i + 1}: unsupported button type.` });
  });
  const count = (t: string) => buttons.filter((b) => b.type === t).length;
  if (count("URL") > 2) errors.push({ field: "draft.buttons", message: "A template can have at most 2 web address buttons." });
  if (count("PHONE_NUMBER") > 1) errors.push({ field: "draft.buttons", message: "A template can have at most 1 phone number button." });
  if (count("COPY_CODE") > 1) errors.push({ field: "draft.buttons", message: "A template can have at most 1 copy-code button." });
  // Quick replies must be grouped together (Meta rejects them mixed in between other buttons).
  const kinds = buttons.map((b) => (b.type === "QUICK_REPLY" ? "Q" : "O")).join("");
  if (/Q.*O.*Q/.test(kinds)) errors.push({ field: "draft.buttons", message: "Put all quick-reply buttons together, before or after the other buttons." });
  draft.buttons = buttons;

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { name, language, category, parameterFormat, draft } };
}

/** Turns a validated draft into the `components` array Meta's template API expects. */
export function buildComponents(input: TemplateInput): Array<Record<string, unknown>> {
  const { draft, parameterFormat } = input;
  const named = parameterFormat === "NAMED";
  const out: Array<Record<string, unknown>> = [];

  if (input.category === "AUTHENTICATION") {
    const a = draft.authentication ?? { securityRecommendation: true, expiryMinutes: null, buttonText: "Copy code" };
    out.push({ type: "BODY", add_security_recommendation: a.securityRecommendation });
    if (a.expiryMinutes) out.push({ type: "FOOTER", code_expiration_minutes: a.expiryMinutes });
    out.push({ type: "BUTTONS", buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: a.buttonText }] });
    return out;
  }

  const h = draft.header;
  if (h) {
    if (h.format === "TEXT") {
      const tokens = scanVariables(h.text ?? "").tokens;
      out.push({
        type: "HEADER",
        format: "TEXT",
        text: h.text,
        ...(tokens.length ? { example: named ? { header_text_named_params: [{ param_name: tokens[0], example: draft.headerExample ?? "" }] } : { header_text: [draft.headerExample ?? ""] } } : {}),
      });
    } else out.push({ type: "HEADER", format: h.format, example: { header_handle: [h.exampleHandle] } });
  }

  const tokens = scanVariables(draft.body.text).tokens;
  out.push({
    type: "BODY",
    text: draft.body.text,
    ...(tokens.length
      ? { example: named ? { body_text_named_params: tokens.map((t) => ({ param_name: t, example: draft.examples[t] ?? "" })) } : { body_text: [tokens.map((t) => draft.examples[t] ?? "")] } }
      : {}),
  });
  if (draft.footer) out.push({ type: "FOOTER", text: draft.footer });
  if (draft.buttons.length) {
    out.push({
      type: "BUTTONS",
      buttons: draft.buttons.map((b) => {
        if (b.type === "QUICK_REPLY") return { type: "QUICK_REPLY", text: b.text };
        if (b.type === "PHONE_NUMBER") return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phoneNumber };
        if (b.type === "COPY_CODE") return { type: "COPY_CODE", example: b.example };
        return { type: "URL", text: b.text, url: b.url, ...(b.example ? { example: [b.example] } : {}) };
      }),
    });
  }
  return out;
}

/** Rebuilds an editable draft from the components Meta returned (for templates created outside this tool, or after a sync). */
export function draftFromComponents(components: Array<Record<string, unknown>>, category: string, parameterFormat: ParameterFormat): TemplateDraft {
  const draft: TemplateDraft = { header: null, body: { text: "" }, footer: null, buttons: [], examples: {} };
  const named = parameterFormat === "NAMED";
  for (const c of components) {
    const type = String(c.type ?? "").toUpperCase();
    const ex = (c.example ?? {}) as Record<string, any>;
    if (type === "HEADER") {
      const format = String(c.format ?? "TEXT").toUpperCase() as HeaderFormat;
      if (!(HEADER_FORMATS as readonly string[]).includes(format)) continue;
      draft.header = format === "TEXT" ? { format, text: String(c.text ?? "") } : { format, exampleHandle: String(ex.header_handle?.[0] ?? "") || undefined };
      if (format === "TEXT") draft.headerExample = named ? String(ex.header_text_named_params?.[0]?.example ?? "") : String(ex.header_text?.[0] ?? "");
    } else if (type === "BODY") {
      if (category === "AUTHENTICATION") {
        draft.authentication = { securityRecommendation: c.add_security_recommendation !== false, expiryMinutes: null, buttonText: "Copy code" };
        draft.body = { text: "{{1}} is your verification code." };
        continue;
      }
      draft.body = { text: String(c.text ?? "") };
      const tokens = scanVariables(draft.body.text).tokens;
      if (named) for (const p of (ex.body_text_named_params ?? []) as Array<{ param_name: string; example: string }>) draft.examples[p.param_name] = String(p.example ?? "");
      else tokens.forEach((t, i) => (draft.examples[t] = String(ex.body_text?.[0]?.[i] ?? "")));
    } else if (type === "FOOTER") {
      if (draft.authentication) draft.authentication.expiryMinutes = Number(c.code_expiration_minutes) || null;
      else draft.footer = String(c.text ?? "") || null;
    } else if (type === "BUTTONS") {
      for (const b of (c.buttons ?? []) as Array<Record<string, any>>) {
        const bt = String(b.type ?? "").toUpperCase();
        if (bt === "QUICK_REPLY") draft.buttons.push({ type: "QUICK_REPLY", text: String(b.text ?? "") });
        else if (bt === "URL") draft.buttons.push({ type: "URL", text: String(b.text ?? ""), url: String(b.url ?? ""), ...(b.example?.[0] ? { example: String(b.example[0]) } : {}) });
        else if (bt === "PHONE_NUMBER") draft.buttons.push({ type: "PHONE_NUMBER", text: String(b.text ?? ""), phoneNumber: String(b.phone_number ?? "") });
        else if (bt === "COPY_CODE") draft.buttons.push({ type: "COPY_CODE", example: String(b.example ?? "") });
        else if (bt === "OTP" && draft.authentication) draft.authentication.buttonText = String(b.text ?? "Copy code");
      }
    }
  }
  return draft;
}

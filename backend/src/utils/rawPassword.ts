import type { Request } from "express";

/**
 * The password exactly as typed. The global sanitizer HTML-escapes `<` and `>` in req.body, but the raw JSON text
 * (kept by express.json as req.rawBody) is untouched. Login tries the typed form first, then the sanitized one, because
 * accounts created through different flows stored one or the other.
 */
export const rawPasswordOf = (req: Request): string | undefined => {
  const raw = (req as Request & { rawBody?: string }).rawBody;
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  try {
    const v = (JSON.parse(raw) as { password?: unknown })?.password;
    return typeof v === "string" && v.length > 0 ? v : undefined;
  } catch {
    return undefined;
  }
};

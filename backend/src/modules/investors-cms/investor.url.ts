import { INVESTOR_DOCS_FOLDER } from "@/utils/cloudinary.js";

/** Largest investor PDF accepted, enforced server-side on files uploaded to our Cloudinary account. */
export const INVESTOR_DOC_MAX_BYTES = 20 * 1024 * 1024;

export type InvestorUrlCheck =
  | { ok: true; cloudinaryPublicId: string | null }
  | { ok: false; reason: string };

/**
 * Pure URL policy for investor documents (no network):
 *  - absolute https only, no embedded credentials, no whitespace/control chars, sane length;
 *  - a file on our own Cloudinary account must be a PDF inside the investor-documents folder
 *    (Cloudinary `raw` uploads keep the extension in the public id).
 * Pasted external https links stay allowed because existing records use them.
 */
export function checkInvestorDocUrl(raw: string, cloudName: string | undefined): InvestorUrlCheck {
  if (typeof raw !== "string" || raw.length > 2048 || /[\s\u0000-\u001f]/.test(raw))
    return { ok: false, reason: "Document URL is invalid" };
  let u: URL;
  try { u = new URL(raw); } catch { return { ok: false, reason: "Document URL is invalid" }; }
  if (u.protocol !== "https:") return { ok: false, reason: "Document URL must use https" };
  if (u.username || u.password) return { ok: false, reason: "Document URL must not contain credentials" };
  if (!u.hostname.includes(".")) return { ok: false, reason: "Document URL host is invalid" };

  if (u.hostname === "res.cloudinary.com") {
    const m = u.pathname.match(/^\/([^/]+)\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    if (!m) return { ok: false, reason: "Unsupported Cloudinary file URL" };
    if (cloudName && m[1] !== cloudName) return { ok: false, reason: "File is not from this account's storage" };
    let publicId: string;
    try { publicId = decodeURIComponent(m[2]); } catch { return { ok: false, reason: "Document URL is invalid" }; }
    if (!publicId.startsWith(`${INVESTOR_DOCS_FOLDER}/`) || publicId.includes(".."))
      return { ok: false, reason: "File is not in the investor documents folder" };
    if (!/\.pdf$/i.test(publicId)) return { ok: false, reason: "Only PDF files can be uploaded" };
    return { ok: true, cloudinaryPublicId: publicId };
  }
  return { ok: true, cloudinaryPublicId: null };
}

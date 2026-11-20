import crypto from "node:crypto";

const PREFIX = "sha256=";

/**
 * Verifies Meta's `X-Hub-Signature-256` header: `sha256=` + hex HMAC-SHA256 of the
 * exact raw request body, keyed with the App Secret. Constant-time comparison.
 */
export function verifyWhatsappSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(PREFIX)) return false;
  const received = signatureHeader.slice(PREFIX.length).trim();
  if (!/^[0-9a-fA-F]{64}$/.test(received)) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(received, "hex"));
}

/** Compares two secrets without leaking length/prefix timing (hashes first). */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

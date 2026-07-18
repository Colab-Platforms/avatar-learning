import crypto from "crypto";

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex"),
  );
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(signature, "hex"),
  );
}

export function verifyCashfreeWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");
  return expected === signature;
}

import { Router, type Request, type Response } from "express";
import express from "express";
import { logger } from "@/utils/logger.js";
import { emailAutomation, emailUnsubscribeSecret } from "./email-automation.runtime.js";
import { escapeHtml, verifyResendSignature, verifyUnsubscribeToken } from "./email.lib.js";

/**
 * Public (unauthenticated) endpoints, mounted at /api/email-automation:
 *  - POST /webhook: Resend delivery events. Rejected unless the Svix signature verifies.
 *  - GET/POST /unsubscribe: signed link from promotional emails. GET only shows a confirm page (mail scanners prefetch
 *    links, so a GET must never unsubscribe); POST (button or one-click header) does it.
 */
const router = Router();

router.post("/webhook", async (req: Request, res: Response) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return void res.status(503).json({ status: false, message: "Webhook not configured." });
  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? "";
  const ok = verifyResendSignature({
    secret,
    id: req.get("svix-id") ?? undefined,
    timestamp: req.get("svix-timestamp") ?? undefined,
    signature: req.get("svix-signature") ?? undefined,
    rawBody,
  });
  if (!ok) return void res.status(401).json({ status: false, message: "Invalid signature." });
  try {
    const evt = JSON.parse(rawBody) as { type?: string; created_at?: string; data?: Record<string, unknown> };
    const at = evt.created_at ? new Date(evt.created_at) : undefined;
    // svix-id is the provider's event id: the same event delivered again (a retry) is recognised and harmless.
    if (evt.type && evt.data) await emailAutomation.handleWebhookEvent(evt.type, evt.data, { eventId: req.get("svix-id") ?? undefined, occurredAt: at && !Number.isNaN(at.getTime()) ? at : undefined });
    res.json({ status: true });
  } catch (e) {
    logger.error(`[EmailAutomation] webhook failed: ${e instanceof Error ? e.name : "unknown error"}`);
    res.status(500).json({ status: false, message: "Failed." });
  }
});

const page = (title: string, body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>` +
  `<body style="margin:0;background:#07080b;color:#f4f6f8;font-family:Segoe UI,Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px">` +
  `<main style="max-width:420px;text-align:center"><h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1>${body}</main></body></html>`;

const valid = (u: unknown, t: unknown) => {
  const secret = emailUnsubscribeSecret();
  return typeof u === "string" && typeof t === "string" && u.length < 64 && secret !== "" && verifyUnsubscribeToken(u, t, secret);
};

router.get("/unsubscribe", (req: Request, res: Response) => {
  const { u, t } = req.query;
  if (!valid(u, t)) return void res.status(400).type("html").send(page("This link is not valid", `<p style="color:#a3abb5">The unsubscribe link is invalid or incomplete.</p>`));
  res
    .type("html")
    .send(
      page(
        "Unsubscribe from updates?",
        `<p style="color:#a3abb5;line-height:1.6">You will stop receiving promotional emails from Avatar AI Adoption. Account emails such as sign-in codes are not affected.</p>` +
          `<form method="post" action="/api/email-automation/unsubscribe?u=${encodeURIComponent(String(u))}&t=${encodeURIComponent(String(t))}"><button style="margin-top:16px;padding:12px 24px;border-radius:999px;border:0;background:#f4f6f8;color:#07080b;font-size:15px;font-weight:500;cursor:pointer">Unsubscribe</button></form>`,
      ),
    );
});

router.post("/unsubscribe", express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
  const { u, t } = req.query;
  if (!valid(u, t)) return void res.status(400).type("html").send(page("This link is not valid", `<p style="color:#a3abb5">The unsubscribe link is invalid or incomplete.</p>`));
  try {
    await emailAutomation.unsubscribe(String(u));
    res.type("html").send(page("You are unsubscribed", `<p style="color:#a3abb5">You will no longer receive promotional emails from us.</p>`));
  } catch (e) {
    logger.error(`[EmailAutomation] unsubscribe failed: ${e instanceof Error ? e.name : "unknown error"}`);
    res.status(500).type("html").send(page("Something went wrong", `<p style="color:#a3abb5">Please try the link again in a moment.</p>`));
  }
});

export default router;

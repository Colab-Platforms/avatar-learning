import crypto from "node:crypto";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import express from "express";
import sanitizeMiddleware from "../../src/middlewares/sanitize.js";
import { errorHandler } from "../../src/middlewares/errorHandler.js";
import { createWhatsappRouter } from "../../src/modules/whatsapp/whatsapp.router.js";
import { nextMessageState } from "../../src/modules/whatsapp/whatsapp.status.js";
import type {
  InboundMessageEvent,
  InboundSaveResult,
  MessageState,
  StatusApplyResult,
  StatusEvent,
  WhatsappConfig,
  WhatsappStore,
} from "../../src/modules/whatsapp/whatsapp.types.js";

// Fake credentials: obviously not real, and unique so leak checks can search for them.
export const SECRETS = {
  appSecret: "test_app_secret_value_9f3a",
  verifyToken: "test_verify_token_value_7c1b",
  accessToken: "test_access_token_value_2d8e",
};
export const PHONE_NUMBER_ID = "100200300400500";

export const baseConfig = (over: Partial<WhatsappConfig> = {}): WhatsappConfig => ({
  enabled: true,
  appSecret: SECRETS.appSecret,
  verifyToken: SECRETS.verifyToken,
  accessToken: SECRETS.accessToken,
  phoneNumberId: PHONE_NUMBER_ID,
  businessAccountId: "999888777",
  graphApiVersion: "v23.0",
  ...over,
});

export type StoredMessage = MessageState & {
  waMessageId: string;
  direction: "INBOUND" | "OUTBOUND";
  contactWaId: string;
  contactName?: string;
  textBody?: string;
  messageType?: string;
};

/** In-memory store with the same semantics as PrismaWhatsappStore (no database involved). */
export class MemoryWhatsappStore implements WhatsappStore {
  readonly messages = new Map<string, StoredMessage>();
  failNext = false;

  async saveInboundMessage(e: InboundMessageEvent): Promise<InboundSaveResult> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("simulated database outage");
    }
    if (this.messages.has(e.waMessageId)) return "duplicate";
    this.messages.set(e.waMessageId, {
      waMessageId: e.waMessageId,
      direction: "INBOUND",
      contactWaId: e.from,
      contactName: e.contactName,
      textBody: e.textBody,
      messageType: e.type,
      status: "RECEIVED",
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      errorCode: null,
      errorTitle: null,
      errorDetails: null,
    });
    return "created";
  }

  async applyStatusEvent(e: StatusEvent): Promise<StatusApplyResult> {
    const existing = this.messages.get(e.waMessageId) ?? null;
    const next = nextMessageState(existing, e);
    if (!next) return existing ? "duplicate" : "ignored";
    this.messages.set(e.waMessageId, {
      ...(existing ?? { waMessageId: e.waMessageId, direction: "OUTBOUND" as const, contactWaId: e.recipientId }),
      ...next,
    });
    return "applied";
  }
}

export interface TestApp {
  url: string;
  store: MemoryWhatsappStore;
  close(): Promise<void>;
}

/** Real Express app mirroring index.ts body parsing/sanitizing, with the webhook mounted at /api/whatsapp. */
export async function startApp(config: WhatsappConfig = baseConfig(), store = new MemoryWhatsappStore()): Promise<TestApp> {
  const app = express();
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString("utf8");
      },
    }),
  );
  app.use(sanitizeMiddleware);
  app.use("/api/whatsapp", createWhatsappRouter({ store, getConfig: () => config }));
  app.use(errorHandler);

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/api/whatsapp/webhook`,
    store,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}

export const sign = (body: string, secret = SECRETS.appSecret) =>
  "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

/** POST a payload the way Meta does: JSON body + X-Hub-Signature-256. */
export async function postWebhook(
  app: TestApp,
  payload: unknown,
  opts: { signature?: string | null; rawBody?: string } = {},
) {
  const body = opts.rawBody ?? JSON.stringify(payload);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const signature = opts.signature === undefined ? sign(body) : opts.signature;
  if (signature !== null) headers["X-Hub-Signature-256"] = signature;
  const res = await fetch(app.url, { method: "POST", headers, body });
  return { status: res.status, json: (await res.json().catch(() => null)) as any };
}

// ─── Meta payload builders ────────────────────────────────────────────────────
const envelope = (value: Record<string, unknown>, phoneNumberId = PHONE_NUMBER_ID) => ({
  object: "whatsapp_business_account",
  entry: [
    {
      id: "999888777",
      changes: [
        {
          field: "messages",
          value: { messaging_product: "whatsapp", metadata: { display_phone_number: "15550001111", phone_number_id: phoneNumberId }, ...value },
        },
      ],
    },
  ],
});

export const textMessagePayload = (id = "wamid.INBOUND1", text = "Hello from a customer", from = "919876543210", phoneNumberId?: string) =>
  envelope(
    {
      contacts: [{ profile: { name: "Asha Verma" }, wa_id: from }],
      messages: [{ from, id, timestamp: "1763460000", type: "text", text: { body: text } }],
    },
    phoneNumberId,
  );

export const statusPayload = (
  id: string,
  status: "sent" | "delivered" | "read" | "failed",
  timestamp = "1763460100",
  extra: Record<string, unknown> = {},
) => envelope({ statuses: [{ id, status, timestamp, recipient_id: "919876543210", ...extra }] });

export const failedStatusPayload = (id: string) =>
  statusPayload(id, "failed", "1763460200", {
    errors: [{ code: 131047, title: "Re-engagement message", message: "Re-engagement message", error_data: { details: "More than 24 hours have passed since the customer last replied." } }],
  });

/** Captures console output so tests can assert nothing sensitive is logged. */
export function captureConsole() {
  const lines: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const grab = (...a: unknown[]) => lines.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "));
  console.log = grab;
  console.warn = grab;
  console.error = grab;
  return {
    lines,
    restore() {
      Object.assign(console, orig);
    },
  };
}

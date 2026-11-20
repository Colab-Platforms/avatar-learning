import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mapMetaStatus, nextMessageState } from "../../src/modules/whatsapp/whatsapp.status.js";
import { parseWhatsappWebhook } from "../../src/modules/whatsapp/whatsapp.parser.js";
import { verifyWhatsappSignature, safeEqual } from "../../src/modules/whatsapp/whatsapp.signature.js";
import { getWhatsappConfig, missingWebhookConfig } from "../../src/modules/whatsapp/whatsapp.config.js";
import { sign, SECRETS, textMessagePayload, statusPayload } from "./helpers.js";
import type { StatusEvent } from "../../src/modules/whatsapp/whatsapp.types.js";

const ev = (status: string, ts = 1000, extra: Partial<StatusEvent> = {}): StatusEvent => ({
  waMessageId: "wamid.X",
  status,
  recipientId: "919876543210",
  timestamp: new Date(ts * 1000),
  ...extra,
});

describe("status state machine", () => {
  it("maps Meta statuses and rejects unknown ones", () => {
    assert.equal(mapMetaStatus("sent"), "SENT");
    assert.equal(mapMetaStatus("DELIVERED"), "DELIVERED");
    assert.equal(mapMetaStatus("read"), "READ");
    assert.equal(mapMetaStatus("failed"), "FAILED");
    assert.equal(mapMetaStatus("deleted"), null);
    assert.equal(nextMessageState(null, ev("deleted")), null);
  });

  it("creates state from the first event and progresses monotonically", () => {
    const sent = nextMessageState(null, ev("sent", 1))!;
    assert.equal(sent.status, "SENT");
    const delivered = nextMessageState(sent, ev("delivered", 2))!;
    assert.equal(delivered.status, "DELIVERED");
    const read = nextMessageState(delivered, ev("read", 3))!;
    assert.equal(read.status, "READ");
    assert.equal(nextMessageState(read, ev("delivered", 2)), null);
    assert.equal(nextMessageState(read, ev("read", 9)), null);
  });

  it("keeps the first timestamp for a repeated status (replays change nothing)", () => {
    const first = nextMessageState(null, ev("delivered", 100))!;
    assert.equal(nextMessageState(first, ev("delivered", 500)), null);
  });

  it("falls back to 'now' when Meta omits the timestamp", () => {
    const now = new Date("2026-11-18T10:00:00Z");
    const s = nextMessageState(null, { waMessageId: "w", status: "sent", recipientId: "1" }, now)!;
    assert.equal(s.sentAt?.toISOString(), now.toISOString());
  });
});

describe("payload parser", () => {
  it("never throws on junk and reports skipped changes", () => {
    for (const junk of [null, undefined, 5, "x", [], {}, { entry: "nope" }, { entry: [null, 1, { changes: "x" }] }]) {
      assert.doesNotThrow(() => parseWhatsappWebhook(junk));
    }
    const r = parseWhatsappWebhook({ entry: [null, { changes: "x" }, { changes: [{ field: "other", value: {} }] }] });
    assert.equal(r.skipped, 3);
    assert.deepEqual([r.inbound.length, r.statuses.length], [0, 0]);
  });

  it("skips messages/statuses without an id and parses valid ones", () => {
    const p: any = textMessagePayload("wamid.OK");
    p.entry[0].changes[0].value.messages.push({ from: "1", type: "text" }, "garbage");
    const r = parseWhatsappWebhook(p);
    assert.equal(r.inbound.length, 1);
    assert.equal(r.skipped, 2);
    assert.equal(r.inbound[0].contactName, "Asha Verma");
    assert.equal(r.inbound[0].timestamp?.getTime(), 1763460000 * 1000);
  });

  it("reads the first error of a failed status", () => {
    const p = statusPayload("wamid.E", "failed", "1763460200", { errors: [{ code: 131026, title: "Message undeliverable" }] });
    const [s] = parseWhatsappWebhook(p).statuses;
    assert.equal(s.error?.code, 131026);
    assert.equal(s.error?.title, "Message undeliverable");
  });
});

describe("signature and config helpers", () => {
  it("verifies only the exact body/secret pair", () => {
    const body = '{"a":1}';
    assert.equal(verifyWhatsappSignature(body, sign(body), SECRETS.appSecret), true);
    assert.equal(verifyWhatsappSignature(body + " ", sign(body), SECRETS.appSecret), false);
    assert.equal(verifyWhatsappSignature(body, sign(body, "other"), SECRETS.appSecret), false);
    assert.equal(verifyWhatsappSignature(body, undefined, SECRETS.appSecret), false);
    assert.equal(safeEqual("abc", "abc"), true);
    assert.equal(safeEqual("abc", "abd"), false);
    assert.equal(safeEqual("abc", "abcd"), false);
  });

  it("reads the documented environment variables, trimming blanks", () => {
    const cfg = getWhatsappConfig({
      WHATSAPP_ENABLED: " TRUE ",
      WHATSAPP_APP_SECRET: "s",
      WHATSAPP_WEBHOOK_VERIFY_TOKEN: "t",
      WHATSAPP_ACCESS_TOKEN: "a",
      WHATSAPP_PHONE_NUMBER_ID: "p",
      WHATSAPP_BUSINESS_ACCOUNT_ID: "b",
      WHATSAPP_GRAPH_API_VERSION: "v99.0",
    } as NodeJS.ProcessEnv);
    assert.deepEqual(cfg, { enabled: true, appSecret: "s", verifyToken: "t", accessToken: "a", phoneNumberId: "p", businessAccountId: "b", appId: undefined, graphApiVersion: "v99.0", outboundEnabled: false });
  });

  it("outbound sending is OFF unless WHATSAPP_OUTBOUND_ENABLED is exactly true", () => {
    assert.equal(getWhatsappConfig({} as NodeJS.ProcessEnv).outboundEnabled, false);
    assert.equal(getWhatsappConfig({ WHATSAPP_OUTBOUND_ENABLED: "yes" } as NodeJS.ProcessEnv).outboundEnabled, false);
    assert.equal(getWhatsappConfig({ WHATSAPP_OUTBOUND_ENABLED: " True " } as NodeJS.ProcessEnv).outboundEnabled, true);
  });

  it("is disabled by default and reports only variable NAMES when config is missing", () => {
    const cfg = getWhatsappConfig({} as NodeJS.ProcessEnv);
    assert.equal(cfg.enabled, false);
    assert.equal(cfg.graphApiVersion, "v23.0");
    assert.deepEqual(missingWebhookConfig(cfg), ["WHATSAPP_APP_SECRET", "WHATSAPP_WEBHOOK_VERIFY_TOKEN"]);
    assert.equal(getWhatsappConfig({ WHATSAPP_ENABLED: "yes" } as NodeJS.ProcessEnv).enabled, false);
  });
});

describe("payload parser — characters Postgres cannot store", () => {
  it("strips NUL characters from text, names, error details and the stored raw message", () => {
    const nul = String.fromCharCode(0);
    const p: any = textMessagePayload("wamid.NUL", `bad${nul}char`);
    p.entry[0].changes[0].value.contacts[0].profile.name = `As${nul}ha`;
    p.entry[0].changes[0].value.messages[0].text.extra = { deep: [`x${nul}y`] };
    const [m] = parseWhatsappWebhook(p).inbound;
    assert.equal(m.textBody, "badchar");
    assert.equal(m.contactName, "Asha");
    assert.ok(!JSON.stringify(m.raw).includes("\u0000"));
    assert.deepEqual((m.raw as any).text.extra, { deep: ["xy"] });

    const s = parseWhatsappWebhook(statusPayload("wamid.E", "failed", "1763460200", { errors: [{ code: 1, title: `t${nul}t`, error_data: { details: `d${nul}d` } }] })).statuses[0];
    assert.equal(s.error?.title, "tt");
    assert.equal(s.error?.details, "dd");
  });

  it("drops a text that is only NULs instead of storing an empty string", () => {
    const nul = String.fromCharCode(0);
    const [m] = parseWhatsappWebhook(textMessagePayload("wamid.ONLYNUL", nul + nul)).inbound;
    assert.equal(m.textBody, undefined);
  });
});

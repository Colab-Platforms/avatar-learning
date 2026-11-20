import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseWhatsappWebhook } from "../../src/modules/whatsapp/whatsapp.parser.js";
import { countSkipReasons, describeSkips } from "../../src/modules/whatsapp/whatsapp.skips.js";
import {
  baseConfig,
  captureConsole,
  PHONE_NUMBER_ID,
  postWebhook,
  SECRETS,
  startApp,
  statusPayload,
  textMessagePayload,
  type TestApp,
} from "./helpers.js";

const REAL_FROM = "919876543210";
const REAL_TEXT = "Private customer message 8841";
const OTHER_ID = "555666777888999";

const apps: TestApp[] = [];
after(async () => {
  await Promise.all(apps.map((a) => a.close()));
});

describe("parser skip reasons (five conditions)", () => {
  it("1. entry_malformed: entry is not an object or has no changes array", () => {
    const r = parseWhatsappWebhook({ entry: [null, { id: "x" }, { changes: "nope" }] });
    assert.equal(r.skipped, 3);
    assert.deepEqual(r.skips, [{ reason: "entry_malformed" }, { reason: "entry_malformed" }, { reason: "entry_malformed" }]);
  });

  it("2. change_field_unsupported: records the Meta field name when it is a plain identifier", () => {
    const r = parseWhatsappWebhook({ entry: [{ changes: [{ field: "message_template_status_update", value: {} }] }] });
    assert.deepEqual(r.skips, [{ reason: "change_field_unsupported", field: "message_template_status_update" }]);
  });

  it("2b. change_field_unsupported: value missing, junk change, or a field name that is not a safe identifier", () => {
    const r = parseWhatsappWebhook({ entry: [{ changes: [{ field: "messages" }, 7, { field: "Bad Field+" + REAL_FROM, value: {} }] }] });
    assert.equal(r.skipped, 3);
    for (const s of r.skips) assert.equal(s.reason, "change_field_unsupported");
    // "messages" with no value is a safe identifier and is kept; the junk and unsafe names are not echoed.
    assert.deepEqual(r.skips.map((s) => s.field), ["messages", undefined, undefined]);
    assert.ok(!JSON.stringify(r.skips).includes(REAL_FROM));
  });

  it("3. phone_number_id_mismatch: records only that an ID was present, never the ID", () => {
    const r = parseWhatsappWebhook(textMessagePayload("wamid.X", REAL_TEXT, REAL_FROM, OTHER_ID), PHONE_NUMBER_ID);
    assert.deepEqual(r.skips, [{ reason: "phone_number_id_mismatch", incomingPhoneNumberIdPresent: true }]);
    assert.equal(r.inbound.length, 0);
    assert.ok(!JSON.stringify(r.skips).includes(OTHER_ID));
    assert.ok(!JSON.stringify(r.skips).includes(PHONE_NUMBER_ID));
  });

  it("3b. phone_number_id_mismatch: payload with no phone_number_id at all", () => {
    const p: any = textMessagePayload("wamid.X");
    delete p.entry[0].changes[0].value.metadata;
    const r = parseWhatsappWebhook(p, PHONE_NUMBER_ID);
    assert.deepEqual(r.skips, [{ reason: "phone_number_id_mismatch", incomingPhoneNumberIdPresent: false }]);
  });

  it("3c. no phone-number-ID filtering when none is configured", () => {
    const r = parseWhatsappWebhook(textMessagePayload("wamid.X", "hi", REAL_FROM, OTHER_ID));
    assert.equal(r.skipped, 0);
    assert.equal(r.inbound.length, 1);
  });

  it("4. message_missing_keys: names the absent keys only (id, from, both, or not an object)", () => {
    const p: any = textMessagePayload("wamid.OK");
    p.entry[0].changes[0].value.messages.push(
      { from: REAL_FROM, type: "text", text: { body: REAL_TEXT } },
      { id: "wamid.NOFROM", type: "text" },
      { type: "text" },
      "garbage",
    );
    const r = parseWhatsappWebhook(p, PHONE_NUMBER_ID);
    assert.equal(r.inbound.length, 1);
    assert.deepEqual(r.skips, [
      { reason: "message_missing_keys", missingKeys: ["id"] },
      { reason: "message_missing_keys", missingKeys: ["from"] },
      { reason: "message_missing_keys", missingKeys: ["id", "from"] },
      { reason: "message_missing_keys", missingKeys: ["(not an object)"] },
    ]);
    assert.ok(!JSON.stringify(r.skips).includes(REAL_FROM) && !JSON.stringify(r.skips).includes(REAL_TEXT));
  });

  it("5. status_missing_keys: names the absent keys only", () => {
    const p: any = statusPayload("wamid.S1", "sent");
    p.entry[0].changes[0].value.statuses.push({ status: "sent", recipient_id: REAL_FROM }, { id: "wamid.S2" }, null);
    const r = parseWhatsappWebhook(p, PHONE_NUMBER_ID);
    assert.equal(r.statuses.length, 1);
    assert.deepEqual(r.skips, [
      { reason: "status_missing_keys", missingKeys: ["id"] },
      { reason: "status_missing_keys", missingKeys: ["status"] },
      { reason: "status_missing_keys", missingKeys: ["(not an object)"] },
    ]);
    assert.ok(!JSON.stringify(r.skips).includes(REAL_FROM));
  });

  it("skipped always equals skips.length, and junk never throws", () => {
    for (const junk of [null, undefined, 5, "x", [], {}, { entry: "nope" }, { entry: [null, 1, { changes: "x" }] }]) {
      const r = parseWhatsappWebhook(junk);
      assert.equal(r.skipped, r.skips.length);
    }
  });

  it("a valid inbound message still parses exactly as before (no skips)", () => {
    const r = parseWhatsappWebhook(textMessagePayload("wamid.GOOD", REAL_TEXT, REAL_FROM), PHONE_NUMBER_ID);
    assert.equal(r.skipped, 0);
    assert.deepEqual(r.skips, []);
    assert.equal(r.inbound.length, 1);
    const m = r.inbound[0];
    assert.equal(m.waMessageId, "wamid.GOOD");
    assert.equal(m.from, REAL_FROM);
    assert.equal(m.type, "text");
    assert.equal(m.textBody, REAL_TEXT);
    assert.equal(m.contactName, "Asha Verma");
    assert.equal(m.phoneNumberId, PHONE_NUMBER_ID);
    assert.equal(m.timestamp?.getTime(), 1763460000 * 1000);
  });
});

describe("describeSkips / countSkipReasons", () => {
  it("is empty when nothing was skipped", () => assert.equal(describeSkips([]), ""));

  it("summarises counts, match boolean, field names and missing key names", () => {
    const text = describeSkips([
      { reason: "phone_number_id_mismatch", incomingPhoneNumberIdPresent: true },
      { reason: "phone_number_id_mismatch", incomingPhoneNumberIdPresent: false },
      { reason: "change_field_unsupported", field: "account_update" },
      { reason: "message_missing_keys", missingKeys: ["id", "from"] },
      { reason: "status_missing_keys", missingKeys: ["status"] },
    ]);
    assert.match(text, /reasons=phone_number_id_mismatch=2,change_field_unsupported=1,message_missing_keys=1,status_missing_keys=1/);
    assert.match(text, /phone_number_id_match=false/);
    assert.match(text, /incoming_phone_number_id_present=1\/2/);
    assert.match(text, /unsupported_fields=account_update:1/);
    assert.match(text, /message_missing=id:1,from:1/);
    assert.match(text, /status_missing=status:1/);
    assert.deepEqual(countSkipReasons([{ reason: "entry_malformed" }, { reason: "entry_malformed" }]), { entry_malformed: 2 });
  });
});

describe("webhook summary log (end to end)", () => {
  it("adds skip reasons for a phone_number_id mismatch and leaks no IDs, numbers, secrets or text", async () => {
    const app = await startApp(baseConfig());
    apps.push(app);
    const cap = captureConsole();
    let res;
    try {
      res = await postWebhook(app, textMessagePayload("wamid.LEAK1", REAL_TEXT, REAL_FROM, OTHER_ID));
    } finally {
      cap.restore();
    }
    assert.equal(res.status, 200);
    assert.equal(res.json.data.skipped, 1);
    assert.deepEqual(res.json.data.skipReasons, { phone_number_id_mismatch: 1 });
    assert.equal(app.store.messages.size, 0);

    const log = cap.lines.find((l) => l.includes("Webhook processed"));
    assert.ok(log, cap.lines.join("\n"));
    assert.match(log, /skipped=1 \(reasons=phone_number_id_mismatch=1; phone_number_id_match=false; incoming_phone_number_id_present=1\/1\)/);
    const all = cap.lines.join("\n") + JSON.stringify(res.json);
    for (const secret of [OTHER_ID, PHONE_NUMBER_ID, REAL_FROM, REAL_TEXT, "Asha Verma", "wamid.LEAK1", SECRETS.accessToken, SECRETS.appSecret, SECRETS.verifyToken]) {
      assert.ok(!all.includes(secret), `leaked: ${secret.slice(0, 6)}...`);
    }
  });

  it("keeps the original summary format when nothing is skipped, and still stores a valid message", async () => {
    const app = await startApp(baseConfig());
    apps.push(app);
    const cap = captureConsole();
    let res;
    try {
      res = await postWebhook(app, textMessagePayload("wamid.OK9", REAL_TEXT, REAL_FROM));
    } finally {
      cap.restore();
    }
    assert.equal(res.json.data.inbound.created, 1);
    assert.deepEqual(res.json.data.skipReasons, {});
    const log = cap.lines.find((l) => l.includes("Webhook processed"))!;
    assert.match(log, /inbound created=1 duplicate=0; status applied=0 duplicate=0 ignored=0; skipped=0$/);
    assert.ok(app.store.messages.has("wamid.OK9"));
  });
});

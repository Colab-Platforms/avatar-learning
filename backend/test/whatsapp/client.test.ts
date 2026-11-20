import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WhatsappApiError, WhatsappClient } from "../../src/modules/whatsapp/whatsapp.client.js";
import { baseConfig, SECRETS } from "./helpers.js";

type Call = { url: string; init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal } };

/** Mock of Meta's Graph API. No real network request can happen in these tests. */
function mockFetch(response: { ok: boolean; status: number; body: unknown }) {
  const calls: Call[] = [];
  const fetchImpl = async (url: string, init: { method: string; headers: Record<string, string>; body?: string | FormData; signal?: AbortSignal }) => {
    calls.push({ url, init: init as Call["init"] });
    return { ok: response.ok, status: response.status, json: async () => response.body };
  };
  return { calls, fetchImpl };
}

describe("WhatsappClient (Graph API mocked)", () => {
  it("sends a text message to the right Graph URL with the token only in the Authorization header", async () => {
    const m = mockFetch({ ok: true, status: 200, body: { messages: [{ id: "wamid.SENT1" }] } });
    const client = new WhatsappClient({ config: baseConfig({ graphApiVersion: "v23.0" }), fetchImpl: m.fetchImpl });
    const out = await client.sendTextMessage("919876543210", "Hello!");

    assert.deepEqual(out, { waMessageId: "wamid.SENT1" });
    assert.equal(m.calls.length, 1);
    const [{ url, init }] = m.calls;
    assert.equal(url, "https://graph.facebook.com/v23.0/100200300400500/messages");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, `Bearer ${SECRETS.accessToken}`);
    assert.ok(!url.includes(SECRETS.accessToken), "token must never be in the URL");
    assert.ok(!init.body.includes(SECRETS.accessToken), "token must never be in the body");
    assert.deepEqual(JSON.parse(init.body), {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: "919876543210",
      type: "text",
      text: { body: "Hello!", preview_url: false },
    });
  });

  it("honours WHATSAPP_GRAPH_API_VERSION", async () => {
    const m = mockFetch({ ok: true, status: 200, body: { messages: [{ id: "w" }] } });
    await new WhatsappClient({ config: baseConfig({ graphApiVersion: "v77.0" }), fetchImpl: m.fetchImpl }).sendTextMessage("1", "x");
    assert.match(m.calls[0].url, /\/v77\.0\//);
  });

  it("marks a message as read", async () => {
    const m = mockFetch({ ok: true, status: 200, body: { success: true } });
    await new WhatsappClient({ config: baseConfig(), fetchImpl: m.fetchImpl }).markMessageAsRead("wamid.IN1");
    assert.deepEqual(JSON.parse(m.calls[0].init.body), { messaging_product: "whatsapp", status: "read", message_id: "wamid.IN1" });
  });

  it("turns Meta errors into WhatsappApiError without leaking the token", async () => {
    const m = mockFetch({ ok: false, status: 401, body: { error: { message: "Invalid OAuth access token.", code: 190 } } });
    const client = new WhatsappClient({ config: baseConfig(), fetchImpl: m.fetchImpl });
    await assert.rejects(
      () => client.sendTextMessage("1", "x"),
      (err: unknown) => {
        assert.ok(err instanceof WhatsappApiError);
        assert.equal(err.httpStatus, 401);
        assert.equal(err.metaCode, 190);
        assert.ok(!err.message.includes(SECRETS.accessToken));
        return true;
      },
    );
  });

  it("fails when Meta returns no message id", async () => {
    const m = mockFetch({ ok: true, status: 200, body: {} });
    await assert.rejects(() => new WhatsappClient({ config: baseConfig(), fetchImpl: m.fetchImpl }).sendTextMessage("1", "x"), WhatsappApiError);
  });

  it("refuses to call Meta when disabled or not configured (no request is made)", async () => {
    for (const cfg of [baseConfig({ enabled: false }), baseConfig({ accessToken: undefined }), baseConfig({ phoneNumberId: undefined })]) {
      const m = mockFetch({ ok: true, status: 200, body: {} });
      await assert.rejects(() => new WhatsappClient({ config: cfg, fetchImpl: m.fetchImpl }).sendTextMessage("1", "x"), WhatsappApiError);
      assert.equal(m.calls.length, 0);
    }
  });
});

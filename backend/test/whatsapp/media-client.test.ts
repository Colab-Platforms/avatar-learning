import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WhatsappApiError, WhatsappClient, isMetaMediaUrl } from "../../src/modules/whatsapp/whatsapp.client.js";
import { MAX_UPLOAD_BYTES, MEDIA_RULES, contentMatchesMime, kindForMime, mediaOf, replyTargetOf, safeFilename, validateUpload } from "../../src/modules/whatsapp/whatsapp.media.js";
import { parseWhatsappWebhook } from "../../src/modules/whatsapp/whatsapp.parser.js";
import { baseConfig, SECRETS } from "./helpers.js";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const PDF = new TextEncoder().encode("%PDF-1.7\n...");
const MP4 = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);
const OGG = new TextEncoder().encode("OggS\u0000\u0002");
const EXE = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);

describe("media rules", () => {
  it("maps WhatsApp-supported MIME types to a kind and refuses everything else", () => {
    assert.equal(kindForMime("image/jpeg"), "image");
    assert.equal(kindForMime("IMAGE/PNG; charset=x"), "image");
    assert.equal(kindForMime("video/mp4"), "video");
    assert.equal(kindForMime("audio/ogg"), "audio");
    assert.equal(kindForMime("application/pdf"), "document");
    for (const bad of ["image/gif", "image/webp", "image/svg+xml", "text/html", "application/x-msdownload", "application/javascript", "video/webm", ""]) assert.equal(kindForMime(bad), null, bad);
  });

  it("accepts correct files and enforces the per-kind size caps", () => {
    assert.deepEqual(validateUpload({ mimeType: "image/jpeg", data: JPEG }), { ok: true, kind: "image", mimeType: "image/jpeg" });
    assert.equal(validateUpload({ mimeType: "application/pdf", data: PDF }).ok, true);
    const big = (n: number, head: Uint8Array) => {
      const b = new Uint8Array(n);
      b.set(head);
      return b;
    };
    const tooBigImage = validateUpload({ mimeType: "image/jpeg", data: big(MEDIA_RULES.image.maxBytes + 1, JPEG) });
    assert.equal(tooBigImage.ok, false);
    assert.equal(tooBigImage.ok === false && tooBigImage.problem, "too_large");
    assert.equal(validateUpload({ mimeType: "image/jpeg", data: big(MEDIA_RULES.image.maxBytes, JPEG) }).ok, true, "exactly at the cap is allowed");
    assert.equal(validateUpload({ mimeType: "video/mp4", data: big(MEDIA_RULES.image.maxBytes + 1, MP4) }).ok, true, "video has a larger cap than image");
    assert.ok(MAX_UPLOAD_BYTES >= MEDIA_RULES.document.maxBytes);
  });

  it("refuses empty files, unsupported types and files whose bytes do not match their declared type", () => {
    assert.equal((validateUpload({ mimeType: "image/png", data: new Uint8Array(0) }) as any).problem, "empty");
    assert.equal((validateUpload({ mimeType: "application/x-msdownload", data: EXE }) as any).problem, "unsupported_type");
    assert.equal((validateUpload({ mimeType: "image/jpeg", data: EXE }) as any).problem, "content_mismatch", "an .exe renamed to .jpg");
    assert.equal((validateUpload({ mimeType: "application/pdf", data: JPEG }) as any).problem, "content_mismatch");
    assert.equal((validateUpload({ mimeType: "image/png", data: JPEG }) as any).problem, "content_mismatch");
  });

  it("recognises the file signatures of every accepted format", () => {
    assert.ok(contentMatchesMime("image/png", PNG) && contentMatchesMime("video/mp4", MP4) && contentMatchesMime("audio/ogg", OGG));
    assert.ok(contentMatchesMime("audio/mpeg", new TextEncoder().encode("ID3\u0003")));
    assert.ok(contentMatchesMime("audio/amr", new TextEncoder().encode("#!AMR\n")));
    assert.ok(contentMatchesMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document", new Uint8Array([0x50, 0x4b, 0x03, 0x04])));
    assert.ok(contentMatchesMime("application/msword", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0])));
    assert.ok(contentMatchesMime("text/plain", new TextEncoder().encode("hello")));
    assert.ok(!contentMatchesMime("text/plain", new Uint8Array([104, 0, 105])), "binary data is not text");
  });

  it("makes filenames safe to store and put in a header", () => {
    assert.equal(safeFilename("../../etc/passwd"), "passwd");
    assert.equal(safeFilename("C:\\temp\\report.pdf"), "report.pdf");
    assert.equal(safeFilename('a"b<c>:d|e?.pdf'), "abcde.pdf");
    assert.equal(safeFilename("line\nbreak\u0000.pdf"), "linebreak.pdf");
    assert.equal(safeFilename(".."), "file");
    assert.equal(safeFilename("   "), "file");
    assert.equal(safeFilename("x".repeat(300)).length, 120);
  });

  it("reads stored media for inbound (Meta shape) and outbound (our shape), and the reply target of either", () => {
    const inbound = { id: "wamid.X", image: { id: "555001", mime_type: "image/jpeg", caption: "see this" }, context: { id: "wamid.QUOTED" } };
    assert.deepEqual(mediaOf("image", inbound), { kind: "image", id: "555001", mimeType: "image/jpeg", filename: null, sizeBytes: null, caption: "see this", voice: false });
    assert.equal(replyTargetOf(inbound), "wamid.QUOTED");
    const voice = { audio: { id: "555002", mime_type: "audio/ogg; codecs=opus", voice: true } };
    assert.equal(mediaOf("audio", voice)?.voice, true);
    const outbound = { media: { kind: "document", id: null, mimeType: "application/pdf", filename: "a.pdf", sizeBytes: 12, caption: null }, replyTo: "wamid.Y" };
    assert.equal(mediaOf("document", outbound)?.id, null);
    assert.equal(mediaOf("document", outbound)?.filename, "a.pdf");
    assert.equal(replyTargetOf(outbound), "wamid.Y");
    assert.equal(mediaOf("text", { text: { body: "x" } }), null);
    assert.equal(mediaOf("image", null), null);
    assert.equal(replyTargetOf({}), null);
  });

  it("the webhook parser keeps media captions as the message text and the raw payload for download", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "1" }, contacts: [{ wa_id: "919800000001", profile: { name: "Asha" } }], messages: [
        { from: "919800000001", id: "wamid.IMG", timestamp: "1763553600", type: "image", image: { id: "555001", mime_type: "image/jpeg", caption: "the invoice" } },
        { from: "919800000001", id: "wamid.DOC", timestamp: "1763553601", type: "document", document: { id: "555002", mime_type: "application/pdf", filename: "bill.pdf" } },
        { from: "919800000001", id: "wamid.AUD", timestamp: "1763553602", type: "audio", audio: { id: "555003", mime_type: "audio/ogg", voice: true } },
      ] } }] }],
    };
    const r = parseWhatsappWebhook(payload);
    assert.equal(r.inbound.length, 3);
    assert.equal(r.inbound[0].textBody, "the invoice");
    assert.equal(r.inbound[1].textBody, undefined, "no caption, no text");
    assert.equal((r.inbound[1].raw as any).document.id, "555002");
    assert.equal(mediaOf("audio", r.inbound[2].raw)?.voice, true);
  });
});

type Call = { url: string; method: string; headers: Record<string, string>; body: any };
function fakeNetwork(responses: Array<{ ok?: boolean; status?: number; json?: unknown; body?: ReadableStream<Uint8Array>; headers?: Record<string, string> }>) {
  const calls: Call[] = [];
  let i = 0;
  const fetchImpl = async (url: string, init: any) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body });
    const r = responses[Math.min(i++, responses.length - 1)];
    return { ok: r.ok ?? true, status: r.status ?? 200, json: async () => r.json ?? {}, body: r.body ?? null, headers: { get: (n: string) => r.headers?.[n.toLowerCase()] ?? null } };
  };
  return { calls, client: new WhatsappClient({ config: baseConfig(), fetchImpl: fetchImpl as never }) };
}

describe("WhatsappClient: media, templates and replies (mocked network)", () => {
  it("uploads media as multipart with the token only in the Authorization header", async () => {
    const { calls, client } = fakeNetwork([{ json: { id: "999111" } }]);
    const out = await client.uploadMedia({ data: JPEG, mimeType: "image/jpeg", filename: "pic.jpg" });
    assert.equal(out.mediaId, "999111");
    assert.match(calls[0].url, /^https:\/\/graph\.facebook\.com\/v23\.0\/100200300400500\/media$/);
    assert.equal(calls[0].headers.Authorization, `Bearer ${SECRETS.accessToken}`);
    assert.equal(calls[0].headers["Content-Type"], undefined, "fetch must set the multipart boundary itself");
    const form = calls[0].body as FormData;
    assert.equal(form.get("messaging_product"), "whatsapp");
    assert.equal(form.get("type"), "image/jpeg");
    assert.equal((form.get("file") as File).name, "pic.jpg");
    assert.ok(!calls[0].url.includes(SECRETS.accessToken));
  });

  it("sends media messages: caption for image/video/document only, filename for documents only", async () => {
    const sentBody = async (kind: any, extra: any) => {
      const { calls, client } = fakeNetwork([{ json: { messages: [{ id: "wamid.M1" }] } }]);
      await client.sendMediaMessage("919800000001", { kind, mediaId: "555", ...extra });
      return JSON.parse(calls[0].body);
    };
    const doc = await sentBody("document", { caption: "invoice", filename: "inv.pdf" });
    assert.deepEqual(doc.document, { id: "555", caption: "invoice", filename: "inv.pdf" });
    assert.equal(doc.type, "document");
    const img = await sentBody("image", { caption: "hi", filename: "ignored.jpg" });
    assert.deepEqual(img.image, { id: "555", caption: "hi" });
    const aud = await sentBody("audio", { caption: "should be dropped", filename: "x.ogg" });
    assert.deepEqual(aud.audio, { id: "555" });
  });

  it("adds the reply context only when replying", async () => {
    const run = async (opts?: any) => {
      const { calls, client } = fakeNetwork([{ json: { messages: [{ id: "wamid.T" }] } }]);
      await client.sendTextMessage("919800000001", "hello", opts);
      return JSON.parse(calls[0].body);
    };
    assert.equal((await run()).context, undefined);
    assert.deepEqual((await run({ replyTo: "wamid.QUOTED" })).context, { message_id: "wamid.QUOTED" });
  });

  it("sends templates with body parameters (and omits components when there are none)", async () => {
    const run = async (params: string[]) => {
      const { calls, client } = fakeNetwork([{ json: { messages: [{ id: "wamid.TPL" }] } }]);
      await client.sendTemplateMessage("919800000001", { name: "order_update", language: "en", bodyParams: params });
      return JSON.parse(calls[0].body);
    };
    const withParams = await run(["Asha", "ORD-1"]);
    assert.equal(withParams.type, "template");
    assert.deepEqual(withParams.template.language, { code: "en" });
    assert.deepEqual(withParams.template.components, [{ type: "body", parameters: [{ type: "text", text: "Asha" }, { type: "text", text: "ORD-1" }] }]);
    assert.equal((await run([])).template.components, undefined);
  });

  it("lists templates from the WABA (live) and needs WHATSAPP_BUSINESS_ACCOUNT_ID", async () => {
    const { calls, client } = fakeNetwork([{ json: { data: [{ name: "hello", language: "en", status: "APPROVED", category: "UTILITY", components: [{ type: "BODY", text: "Hi {{1}}" }] }] } }]);
    const list = await client.listTemplates();
    assert.equal(list[0].name, "hello");
    assert.match(calls[0].url, /\/999888777\/message_templates\?fields=name,language,status,category,components,rejected_reason,parameter_format&limit=100$/);
    const noWaba = new WhatsappClient({ config: baseConfig({ businessAccountId: undefined }), fetchImpl: (async () => ({ ok: true, status: 200, json: async () => ({}) })) as never });
    await assert.rejects(() => noWaba.listTemplates(), /WHATSAPP_BUSINESS_ACCOUNT_ID/);
  });

  it("looks up media and only ever downloads from Meta's own hosts (SSRF protection)", async () => {
    const { client } = fakeNetwork([{ json: { url: "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1", mime_type: "image/jpeg", file_size: 1234 } }]);
    const info = await client.getMediaInfo("555001");
    assert.equal(info.mimeType, "image/jpeg");
    assert.equal(info.fileSize, 1234);
    // A response pointing anywhere else is refused.
    const evil = fakeNetwork([{ json: { url: "https://evil.example.com/x", mime_type: "image/jpeg" } }]);
    await assert.rejects(() => evil.client.getMediaInfo("555001"), /unexpected media location/);
    const internal = fakeNetwork([{ json: { url: "http://169.254.169.254/latest/meta-data", mime_type: "image/jpeg" } }]);
    await assert.rejects(() => internal.client.getMediaInfo("555001"), /unexpected media location/);
    await assert.rejects(() => client.openMedia("https://evil.example.com/x"), /unexpected host/);
    await assert.rejects(() => client.getMediaInfo("../../etc"), /Invalid media id/);
    for (const [url, ok] of [["https://lookaside.fbsbx.com/a", true], ["https://scontent.xx.fbcdn.net/a", true], ["http://lookaside.fbsbx.com/a", false], ["https://fbsbx.com.evil.com/a", false], ["https://evilfbsbx.com/a", false], ["not a url", false]] as const) {
      assert.equal(isMetaMediaUrl(url), ok, url);
    }
  });

  it("downloads media with the token in the header and reports type and length", async () => {
    const stream = new ReadableStream<Uint8Array>({ start: (c) => (c.enqueue(JPEG), c.close()) });
    const { calls, client } = fakeNetwork([{ body: stream, headers: { "content-type": "image/jpeg", "content-length": "8" } }]);
    const file = await client.openMedia("https://lookaside.fbsbx.com/a");
    assert.equal(file.contentType, "image/jpeg");
    assert.equal(file.contentLength, 8);
    assert.equal(calls[0].headers.Authorization, `Bearer ${SECRETS.accessToken}`);
  });

  it("errors never include the token; no-response failures (upload timeout) are flagged ambiguous, 4xx are not", async () => {
    const down = new WhatsappClient({ config: baseConfig(), fetchImpl: (async () => { throw Object.assign(new Error(`connect failed to https://graph.facebook.com Bearer ${SECRETS.accessToken}`), { name: "TimeoutError" }); }) as never });
    await assert.rejects(() => down.uploadMedia({ data: JPEG, mimeType: "image/jpeg", filename: "a.jpg" }), (e: any) => e instanceof WhatsappApiError && e.ambiguous === true && !e.message.includes(SECRETS.accessToken));
    const rejected = fakeNetwork([{ ok: false, status: 400, json: { error: { message: "Media upload error", code: 131053 } } }]);
    await assert.rejects(() => rejected.client.uploadMedia({ data: JPEG, mimeType: "image/jpeg", filename: "a.jpg" }), (e: any) => e.ambiguous === false && e.metaCode === 131053);
  });

  it("refuses to call Meta when disabled or unconfigured, for every new operation", async () => {
    const off = fakeNetwork([{}]);
    const client = new WhatsappClient({ config: baseConfig({ enabled: false }), fetchImpl: (async () => { throw new Error("must not be called"); }) as never });
    for (const op of [
      () => client.uploadMedia({ data: JPEG, mimeType: "image/jpeg", filename: "a.jpg" }),
      () => client.sendMediaMessage("1", { kind: "image", mediaId: "1" }),
      () => client.sendTemplateMessage("1", { name: "n", language: "en", bodyParams: [] }),
      () => client.getMediaInfo("55555"),
      () => client.listTemplates(),
    ]) await assert.rejects(op, /disabled/);
    assert.equal(off.calls.length, 0);
  });
});

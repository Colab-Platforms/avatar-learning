import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { baseConfig, SECRETS, startApp, type TestApp } from "./helpers.js";

const apps: TestApp[] = [];
const start = async (cfg = baseConfig()) => {
  const a = await startApp(cfg);
  apps.push(a);
  return a;
};
after(async () => {
  await Promise.all(apps.map((a) => a.close()));
});

const get = (app: TestApp, query: string) => fetch(`${app.url}?${query}`);
const q = (mode: string | null, token: string | null, challenge: string | null) => {
  const p = new URLSearchParams();
  if (mode !== null) p.set("hub.mode", mode);
  if (token !== null) p.set("hub.verify_token", token);
  if (challenge !== null) p.set("hub.challenge", challenge);
  return p.toString();
};

describe("GET /api/whatsapp/webhook — Meta verification", () => {
  it("echoes hub.challenge as plain text when mode and token are correct", async () => {
    const app = await start();
    const res = await get(app, q("subscribe", SECRETS.verifyToken, "1158201444"));
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /text\/plain/);
    assert.equal(await res.text(), "1158201444");
  });

  it("rejects a wrong verify token with 403 and does not reveal the challenge", async () => {
    const app = await start();
    const res = await get(app, q("subscribe", "wrong-token", "55555"));
    assert.equal(res.status, 403);
    assert.ok(!(await res.text()).includes("55555"));
  });

  it("rejects a wrong hub.mode with 400", async () => {
    const app = await start();
    assert.equal((await get(app, q("unsubscribe", SECRETS.verifyToken, "1"))).status, 400);
  });

  it("rejects missing parameters with 400", async () => {
    const app = await start();
    assert.equal((await get(app, "")).status, 400);
    assert.equal((await get(app, q("subscribe", null, "1"))).status, 400);
    assert.equal((await get(app, q("subscribe", SECRETS.verifyToken, null))).status, 400);
  });

  it("accepts a token containing characters the sanitize middleware would rewrite", async () => {
    const odd = "tok<en>&\"quoted\"";
    const app = await start(baseConfig({ verifyToken: odd }));
    const res = await get(app, q("subscribe", odd, "42"));
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "42");
  });

  it("answers 503 when WHATSAPP_ENABLED is not true", async () => {
    const app = await start(baseConfig({ enabled: false }));
    assert.equal((await get(app, q("subscribe", SECRETS.verifyToken, "1"))).status, 503);
  });

  it("answers 503 when no verify token is configured (never matches an empty token)", async () => {
    const app = await start(baseConfig({ verifyToken: undefined }));
    assert.equal((await get(app, q("subscribe", "", "1"))).status, 503);
  });
});

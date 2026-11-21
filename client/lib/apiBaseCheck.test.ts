// Run with: npm run test:logic
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkApiBase, PRODUCTION_API_HOSTS } from "./apiBaseCheck.js";

const PROD = "https://avatar-learning.onrender.com/api";
const DEV = "https://avatar-learning-dev.onrender.com/api";

describe("checkApiBase: Preview must have its own development API", () => {
  it("Preview + the development API -> allowed, value unchanged", () => {
    assert.deepEqual(checkApiBase("preview", DEV), { ok: true, base: DEV });
    assert.deepEqual(checkApiBase("preview", `  ${DEV}  `), { ok: true, base: DEV });
  });

  it("Preview + the PRODUCTION API (any casing, with/without /api, trailing slash, subdomain) -> blocked", () => {
    for (const v of [PROD, "https://avatar-learning.onrender.com", "https://AVATAR-LEARNING.onrender.com/api/", "https://x.avatar-learning.onrender.com/api"]) {
      const r = checkApiBase("preview", v);
      assert.equal(r.ok, false, v);
      assert.match((r as any).reason, /PRODUCTION API/);
    }
    assert.ok(PRODUCTION_API_HOSTS.includes("avatar-learning.onrender.com"));
  });

  it("Preview + missing / blank / invalid / non-https / relative -> blocked with a message that says what to set", () => {
    for (const v of [undefined, "", "   ", "not a url", "/api", "http://dev.example.com/api", "ftp://dev.example.com"]) {
      const r = checkApiBase("preview", v);
      assert.equal(r.ok, false, String(v));
      assert.match((r as any).reason, /NEXT_PUBLIC_API_BASE_URL/);
      assert.match((r as any).reason, /Preview/);
      assert.equal((r as any).base, "", "a blocked check never yields a usable base");
    }
  });

  it("Preview + http://localhost is allowed (a developer tunnel), nothing else over http", () => {
    assert.equal(checkApiBase("preview", "http://localhost:5000/api").ok, true);
    assert.equal(checkApiBase("preview", "http://127.0.0.1:5000/api").ok, true);
  });

  it("production, development, local and unknown environments behave EXACTLY as before (value used as given, even empty or the production URL)", () => {
    for (const env of ["production", "development", "", undefined, "something-else"]) {
      assert.deepEqual(checkApiBase(env, PROD), { ok: true, base: PROD }, String(env));
      assert.deepEqual(checkApiBase(env, undefined), { ok: true, base: "" }, String(env));
      assert.deepEqual(checkApiBase(env, ""), { ok: true, base: "" }, String(env));
    }
  });
});

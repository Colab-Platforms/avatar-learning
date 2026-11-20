import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CLARITY_CONSENT_V2_GRANTED, CONSENT_KEY, GTM_ID, META_PIXEL_ID, clarityProjectId, shouldLoadTrackers, isPrivatePath, readConsent, shouldLoadClarity, shouldShowBanner, writeConsent } from "./clarityConsent.js";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe("isPrivatePath", () => {
  it("treats public marketing pages as public", () => {
    for (const p of ["/", "/direct2hire", "/courses", "/privacy-policy", "/webinars/abc"]) assert.equal(isPrivatePath(p), false, p);
  });
  it("blocks admin, auth, payment and account areas (and their children)", () => {
    for (const p of ["/admin", "/admin/users", "/admin-adaption", "/admin-adaption/inbox", "/dev-adaption-login", "/login", "/register", "/reset-password/tok", "/dashboard/c1/counselling", "/profile", "/partner-dashboard", "/checkout/x", "/payment", "/enroll/1", "/onboarded", "/complete-profile"]) {
      assert.equal(isPrivatePath(p), true, p);
    }
  });
  it("matches on a segment boundary and ignores case", () => {
    assert.equal(isPrivatePath("/administer"), false);
    assert.equal(isPrivatePath("/ADMIN-ADAPTION/inbox"), true);
  });
  it("fails closed when the path is unknown", () => {
    assert.equal(isPrivatePath(null), true);
    assert.equal(isPrivatePath(undefined), true);
  });
});

describe("shouldLoadClarity / shouldShowBanner", () => {
  const id = "abcdef1234";
  it("loads only with consent on a public page with a project id", () => {
    assert.equal(shouldLoadClarity({ pathname: "/", consent: "granted", projectId: id }), true);
    assert.equal(shouldLoadClarity({ pathname: "/", consent: null, projectId: id }), false);
    assert.equal(shouldLoadClarity({ pathname: "/", consent: "denied", projectId: id }), false);
    assert.equal(shouldLoadClarity({ pathname: "/", consent: "granted", projectId: null }), false);
    assert.equal(shouldLoadClarity({ pathname: "/admin-adaption", consent: "granted", projectId: id }), false);
    assert.equal(shouldLoadClarity({ pathname: "/checkout", consent: "granted", projectId: id }), false);
  });
  it("asks only while undecided, on public pages, when configured", () => {
    assert.equal(shouldShowBanner({ pathname: "/", consent: null }), true);
    assert.equal(shouldShowBanner({ pathname: "/", consent: "denied" }), false);
    assert.equal(shouldShowBanner({ pathname: "/", consent: "granted" }), false);
    assert.equal(shouldShowBanner({ pathname: "/login", consent: null }), false);
    assert.equal(shouldShowBanner({ pathname: "/admin-adaption", consent: null }), false);
  });
  it("Tag Manager and the Pixel follow the same rule: only after acceptance, never on private paths, no Clarity project id needed", () => {
    assert.equal(shouldLoadTrackers({ pathname: "/", consent: "granted" }), true);
    assert.equal(shouldLoadTrackers({ pathname: "/partners", consent: "granted" }), true);
    assert.equal(shouldLoadTrackers({ pathname: "/", consent: null }), false);
    assert.equal(shouldLoadTrackers({ pathname: "/", consent: "denied" }), false);
    for (const p of ["/admin", "/admin-adaption/inbox", "/login", "/checkout", "/dashboard/x", "/profile"]) assert.equal(shouldLoadTrackers({ pathname: p, consent: "granted" }), false, p);
    assert.equal(shouldLoadTrackers({ pathname: null, consent: "granted" }), false);
  });
  it("sends Clarity's documented consentv2 call with both storages granted", () => {
    assert.deepEqual(CLARITY_CONSENT_V2_GRANTED, ["consentv2", { ad_Storage: "granted", analytics_Storage: "granted" }]);
    assert.match(GTM_ID, /^GTM-[A-Z0-9]+$/);
    assert.match(META_PIXEL_ID, /^[0-9]{10,20}$/);
  });
});

describe("consent storage", () => {
  it("round-trips and ignores junk values", () => {
    const s = mem();
    assert.equal(readConsent(s), null);
    writeConsent(s, "granted");
    assert.equal(readConsent(s), "granted");
    s.setItem(CONSENT_KEY, "yes please");
    assert.equal(readConsent(s), null);
  });
  it("survives blocked storage", () => {
    const blocked = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
    assert.equal(readConsent(blocked), null);
    assert.doesNotThrow(() => writeConsent(blocked, "granted"));
    assert.equal(readConsent(null), null);
  });
});

describe("clarityProjectId", () => {
  it("defaults to the existing project and rejects values that are unsafe in a script URL", () => {
    assert.equal(clarityProjectId(undefined), "xsy8mmymts");
    assert.equal(clarityProjectId("  abc123def4 "), "abc123def4");
    assert.equal(clarityProjectId("x/../evil"), null);
    assert.equal(clarityProjectId("a b"), null);
    assert.equal(clarityProjectId(""), null);
  });
});

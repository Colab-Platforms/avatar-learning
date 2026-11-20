import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { blockedReason, canSendTemplate, filterTemplates, matchesName, renderPreview, segmentTemplate, statusCounts, statusKind, statusLabel, statusTone, suggestName, syncExamples, templateKey, valuesByName, variableProblems, variablesIn } from "./templateLogic";

describe("templateLogic", () => {
  it("finds numbered and named variables once, in order", () => {
    assert.deepEqual(variablesIn("Hi {{1}}, {{2}} and {{1}}"), ["1", "2"]);
    assert.deepEqual(variablesIn("Hi {{ first_name }} from {{city}}"), ["first_name", "city"]);
    assert.deepEqual(variablesIn("{{Bad Name}} {{ok}}"), ["ok"]);
  });
  it("reports gaps, mixed styles, invalid names and edge variables", () => {
    assert.ok(variableProblems("a {{1}} b {{3}} c", "POSITIONAL").some((p) => /gaps/.test(p)));
    assert.ok(variableProblems("a {{name}} b", "POSITIONAL").some((p) => /Numbered/.test(p)));
    assert.ok(variableProblems("a {{1}} b", "NAMED").some((p) => /Named/.test(p)));
    assert.ok(variableProblems("a {{Bad Name}} b", "NAMED").some((p) => /not a valid/.test(p)));
    assert.ok(variableProblems("{{1}} hello", "POSITIONAL").some((p) => /first or last/.test(p)));
    assert.deepEqual(variableProblems("Hi {{1}}, welcome.", "POSITIONAL"), []);
  });
  it("renders samples and leaves missing ones visible", () => {
    assert.equal(renderPreview("Hi {{1}}, order {{2}}", { "1": "Asha", "2": "" }), "Hi Asha, order {{2}}");
  });
  it("suggests a valid Meta name", () => {
    assert.equal(suggestName("  Order Update!! v2 "), "order_update_v2");
  });
  it("keeps typed samples when variables change", () => {
    assert.deepEqual(syncExamples(["1", "3"], { "1": "A", "2": "B" }), { "1": "A", "3": "" });
  });
  it("shows Meta statuses honestly", () => {
    assert.equal(statusTone("APPROVED"), "ok");
    assert.equal(statusTone("REJECTED"), "warn");
    assert.equal(statusTone("SOMETHING_NEW"), "off");
    assert.equal(statusLabel("DRAFT", "local"), "Draft (not sent to Meta)");
    assert.equal(statusLabel("IN_APPEAL", "meta"), "In appeal");
  });
});

describe("templateLogic: inbox redesign helpers", () => {
  const items = [
    { name: "welcome_sandbox", language: "en", status: "APPROVED", statusSource: "meta" as const },
    { name: "pending_sandbox", language: "en", status: "PENDING", statusSource: "meta" as const },
    { name: "old_promo", language: "en", status: "REJECTED", statusSource: "meta" as const },
    { name: "my_draft", language: "en", status: "DRAFT", statusSource: "local" as const },
    { name: "paused_one", language: "en", status: "PAUSED", statusSource: "meta" as const },
  ];
  it("classifies statuses; local rows are always drafts; unknown ones are 'other'", () => {
    assert.equal(statusKind("APPROVED"), "approved");
    assert.equal(statusKind("IN_APPEAL"), "pending");
    assert.equal(statusKind("REJECTED"), "rejected");
    assert.equal(statusKind("APPROVED", "local"), "draft");
    assert.equal(statusKind("PAUSED"), "other");
  });
  it("searches by name (case-insensitive, spaces = underscores) and filters by status", () => {
    assert.equal(matchesName("order_update", "ORDER up"), true);
    assert.equal(matchesName("order_update", "refund"), false);
    assert.deepEqual(filterTemplates(items, { q: "sandbox" }).map((t) => t.name), ["welcome_sandbox", "pending_sandbox"]);
    assert.deepEqual(filterTemplates(items, { status: "rejected" }).map((t) => t.name), ["old_promo"]);
    assert.deepEqual(filterTemplates(items, { status: "draft" }).map((t) => t.name), ["my_draft"]);
    assert.deepEqual(filterTemplates(items, { q: "sandbox", status: "approved" }).map((t) => t.name), ["welcome_sandbox"]);
    assert.equal(filterTemplates(items, { status: "all" }).length, 5, "paused is only visible under All");
  });
  it("counts per filter without inventing a bucket for 'other'", () => {
    assert.deepEqual(statusCounts(items), { all: 5, approved: 1, pending: 1, rejected: 1, draft: 1 });
  });
  it("identifies a template by its exact name and language only", () => {
    assert.equal(templateKey("welcome_sandbox", "en"), "welcome_sandbox::en");
    assert.notEqual(templateKey("welcome_sandbox", "en"), templateKey("welcome_sandbox", "hi"));
    assert.notEqual(templateKey("welcome_sandbox", "en"), templateKey("welcome_sandbox2", "en"));
  });
  it("segments a body: filled values are marked as real, unfilled ones stay as placeholders", () => {
    const s = segmentTemplate("Hi {{1}}, order {{ 2 }} for {{1}}", { "1": "Asha", "2": "  " });
    assert.deepEqual(
      s.map((x) => [x.kind, x.text, x.filled ?? null]),
      [["text", "Hi ", null], ["var", "Asha", true], ["text", ", order ", null], ["var", "{{2}}", false], ["text", " for ", null], ["var", "Asha", true]],
    );
  });
  it("substitutes named variables by name and keeps text without variables intact", () => {
    const v = valuesByName(["first_name", "city"], ["Ravi", "Pune"]);
    assert.equal(segmentTemplate("Hello {{first_name}} from {{city}}!", v).map((x) => x.text).join(""), "Hello Ravi from Pune!");
    assert.deepEqual(segmentTemplate("No variables", {}), [{ kind: "text", text: "No variables" }]);
    assert.deepEqual(segmentTemplate("", {}), []);
  });
  it("only an APPROVED + sendable template can be sent, and the reason is given otherwise", () => {
    assert.equal(canSendTemplate({ status: "APPROVED", sendable: true }), true);
    assert.equal(canSendTemplate({ status: "APPROVED", sendable: false }), false);
    assert.equal(canSendTemplate({ status: "PENDING", sendable: true }), false, "a pending template is never sendable even if flagged so");
    assert.equal(canSendTemplate({ status: "REJECTED", sendable: true }), false);
    assert.match(blockedReason({ status: "PENDING", sendable: false, unsupportedReason: null }) ?? "", /Waiting for Meta/);
    assert.match(blockedReason({ status: "REJECTED", sendable: false, unsupportedReason: null, rejectedReason: "INVALID_FORMAT" }) ?? "", /invalid format/);
    assert.equal(blockedReason({ status: "APPROVED", sendable: false, unsupportedReason: "Needs a media file." }), "Needs a media file.");
    assert.equal(blockedReason({ status: "APPROVED", sendable: true, unsupportedReason: null }), null);
  });
});

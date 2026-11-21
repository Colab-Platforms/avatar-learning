import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcrypt";
import { planReconcile, render, type AUser, type LUser } from "../../scripts/reconcile-accounts.js";

const h = (p: string) => bcrypt.hashSync(p, 4);
const A = h("one-Pass#1234"), B = h("two-Pass#5678");
const lu = (o: Partial<LUser> & { email: string }): LUser => ({ id: `u-${o.email}`, password: A, isEmailVerified: true, isActive: true, isDeleted: false, ...o });
const au = (o: Partial<AUser> & { email: string }): AUser => ({ id: `a-${o.email}`, passwordHash: A, emailVerified: true, isActive: true, ...o });

describe("planReconcile (pure)", () => {
  it("classifies linked, learning-only and adoption-only accounts and never double-counts", () => {
    const p = planReconcile(
      [lu({ email: "both@x.com" }), lu({ email: "learn@x.com" })],
      [au({ email: "both@x.com" }), au({ email: "adopt@x.com" })],
    );
    assert.deepEqual([p.linked, p.learningOnly, p.provisionLearning.map((a) => a.email)], [1, 1, ["adopt@x.com"]]);
  });

  it("only VERIFIED + ACTIVE + valid-password Adoption accounts are provisioned; the rest are reported, never touched", () => {
    const p = planReconcile([], [
      au({ email: "ok@x.com" }),
      au({ email: "unverified@x.com", emailVerified: false }),
      au({ email: "inactive@x.com", isActive: false }),
      au({ email: "nopw@x.com", passwordHash: null }),
      au({ email: "bad@x.com", passwordHash: "plain" }),
    ]);
    assert.deepEqual(p.provisionLearning.map((a) => a.email), ["ok@x.com"]);
    assert.equal(p.conflicts.adoptionUnqualified, 4);
    assert.equal(p.conflicts.invalidHashes.adoption, 1);
  });

  it("different valid passwords are only REPORTED (both stay), and an existing hash is never planned for overwrite", () => {
    const p = planReconcile([lu({ email: "c@x.com", password: A })], [au({ email: "c@x.com", passwordHash: B })]);
    assert.equal(p.conflicts.differentValidPasswords, 1);
    assert.deepEqual([p.fillLearningHash.length, p.fillAdoptionHash.length], [0, 0]);
  });

  it("an empty hash is filled from a valid one, an invalid one is never copied", () => {
    const p = planReconcile(
      [lu({ email: "e1@x.com", password: null }), lu({ email: "e2@x.com", password: A }), lu({ email: "e3@x.com", password: null })],
      [au({ email: "e1@x.com", passwordHash: B }), au({ email: "e2@x.com", passwordHash: null }), au({ email: "e3@x.com", passwordHash: "garbage" })],
    );
    assert.deepEqual(p.fillLearningHash, [{ learningId: "u-e1@x.com", hash: B }]);
    assert.deepEqual(p.fillAdoptionHash, [{ adoptionId: "a-e2@x.com", hash: A }]);
  });

  it("matching ignores email case, soft-deleted identities do not count as linked, case-duplicates are reported masked", () => {
    const p = planReconcile([lu({ email: "Mixed@X.com" }), lu({ email: "mixed@x.com", id: "dup" }), lu({ email: "gone@x.com", isDeleted: true })], [au({ email: "mixed@x.com" }), au({ email: "gone@x.com" })]);
    assert.equal(p.linked, 1, "mixed-case email links to its Adoption account; the deleted identity does not");
    assert.equal(p.provisionLearning.map((a) => a.email).includes("gone@x.com"), true, "a soft-deleted identity does not block provisioning from the verified Adoption account");
    assert.deepEqual(p.conflicts.caseDuplicateEmails, ["m***@x.com"]);
    assert.ok(!render(p).join("\n").includes("mixed@x.com"), "the report never prints emails");
  });

  it("the CLI is dry-run by default, needs the typed database name, never loads .env and never deletes or overwrites", () => {
    const code = fs.readFileSync(path.resolve(import.meta.dirname, "../../scripts/reconcile-accounts.ts"), "utf8").replace(/^\s*\/\/.*$/gm, "");
    assert.match(code, /const doApply = process\.argv\.includes\("--apply"\)/);
    assert.match(code, /if \(!doApply\)/);
    assert.match(code, /Type the database name/);
    assert.ok(!/dotenv/.test(code));
    assert.ok(!/\.delete\(|deleteMany|\.create\(\{[^}]*password/.test(code), "no deletes");
    assert.match(code, /password: null \}/, "fills only where the hash is still empty");
    assert.match(code, /passwordHash: null \}/);
  });
});

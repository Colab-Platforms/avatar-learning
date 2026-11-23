import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const NAME = "20261125100000_seed_investor_categories";
const dir = path.join(path.resolve(import.meta.dirname, "../.."), "prisma/migrations", NAME);
const sql = fs.readFileSync(path.join(dir, "migration.sql"), "utf8").replace(/^\s*--.*$/gm, "");

test("is a single data-only file: no DDL, no DELETE/TRUNCATE, only investor_categories", () => {
  assert.deepEqual(fs.readdirSync(dir), ["migration.sql"]);
  assert.ok(!/\b(CREATE|ALTER|DROP|TRUNCATE|DELETE|RENAME)\b/i.test(sql));
  const tables = new Set([...sql.matchAll(/(?:INSERT INTO|UPDATE|FROM|JOIN)\s+"([a-z_]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...tables], ["investor_categories"]);
});

test("insert is guarded (slug or name) so existing/manual categories are reused, never duplicated", () => {
  assert.match(sql, /WHERE NOT EXISTS[\s\S]*c\."slug" = v\.slug OR lower\(c\."name"\) = lower\(v\.name\)/);
});

test("update only changes sort_order and only when it differs (re-run is a no-op)", () => {
  const set = sql.match(/UPDATE "investor_categories" c\s+SET ([^\n]+)/)![1];
  assert.equal(set.trim(), '"sort_order" = o.rn');
  assert.match(sql, /"sort_order" IS DISTINCT FROM o\.rn/);
});

test("new categories are ranked Subsidiary Financial, MOA & AOA, Annual Return and anchored on Press Releases", () => {
  const i1 = sql.indexOf("'subsidiary-financial' OR"), i2 = sql.indexOf("'moa-aoa'              OR"), i3 = sql.indexOf("'annual-return'        OR");
  assert.ok(i1 > 0 && i1 < i2 && i2 < i3);
  assert.match(sql, /'press-releases'/);
});

test("is the newest migration (applies after the monitoring release)", () => {
  const names = fs.readdirSync(path.dirname(dir)).filter((n) => /^\d{14}_/.test(n)).sort();
  assert.equal(names.at(-1), NAME);
});

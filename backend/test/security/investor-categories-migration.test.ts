import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const NAME = "20261125100000_seed_investor_categories";
const dir = path.join(path.resolve(import.meta.dirname, "../.."), "prisma/migrations", NAME);
const sql = fs.readFileSync(path.join(dir, "migration.sql"), "utf8").replace(/^\s*--.*$/gm, "");

test("is a single data-only file: INSERT into investor_categories only (no DDL, UPDATE, DELETE, TRUNCATE)", () => {
  assert.deepEqual(fs.readdirSync(dir), ["migration.sql"]);
  assert.ok(!/\b(CREATE|ALTER|DROP|TRUNCATE|DELETE|UPDATE|RENAME)\b/i.test(sql));
  assert.equal((sql.match(/\bINSERT INTO\b/gi) ?? []).length, 1);
  const tables = new Set([...sql.matchAll(/(?:INSERT INTO|FROM|JOIN)\s+"([a-z_]+)"/g)].map((m) => m[1]));
  assert.deepEqual([...tables], ["investor_categories"]);
});

test("insert is guarded (slug or name, case-insensitive) so existing categories are left as-is and re-runs insert nothing", () => {
  assert.match(sql, /WHERE NOT EXISTS[\s\S]*c\."slug" = m\.slug OR lower\(c\."name"\) = lower\(m\.name\)/);
});

test("positions continue after Press Releases (135) as 136/137/138 in the required order", () => {
  assert.match(sql, /GREATEST\(135,/);
  const i1 = sql.indexOf("'Subsidiary Financial'"), i2 = sql.indexOf("'MOA & AOA'"), i3 = sql.indexOf("'Annual Return'");
  assert.ok(i1 > 0 && i1 < i2 && i2 < i3);
  assert.match(sql, /\(1, 'Subsidiary Financial'/);
  assert.match(sql, /\(2, 'MOA & AOA'/);
  assert.match(sql, /\(3, 'Annual Return'/);
});

test("is the newest migration (applies after the monitoring release)", () => {
  const names = fs.readdirSync(path.dirname(dir)).filter((n) => /^\d{14}_/.test(n)).sort();
  assert.equal(names.at(-1), NAME);
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const MIGRATIONS = path.join(ROOT, "prisma/migrations");
const NAME = "20261124100000_add_live_monitoring";
const NEW_TABLES = ["monitoring_visitors", "monitoring_sessions", "monitoring_events"];
const sql = fs.readFileSync(path.join(MIGRATIONS, NAME, "migration.sql"), "utf8");
const statements = sql.replace(/^\s*--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);

describe("migration ordering", () => {
  const names = fs.readdirSync(MIGRATIONS).filter((n) => /^\d{14}_/.test(n)).sort();
  it("is a well-formed timestamp, unique, and the LAST migration (it applies after everything else)", () => {
    assert.match(NAME, /^\d{14}_[a-z0-9_]+$/);
    assert.equal(names.at(-1), NAME);
    assert.equal(new Set(names.map((n) => n.slice(0, 14))).size, names.length, "no two migrations share a timestamp");
    assert.ok(NAME.slice(0, 14) > "20261123100000", "later than the previous release (admin permissions + audit log)");
    assert.ok(fs.existsSync(path.join(MIGRATIONS, "migration_lock.toml")));
  });
  it("the migration folder holds exactly one SQL file and nothing executable besides it", () => {
    assert.deepEqual(fs.readdirSync(path.join(MIGRATIONS, NAME)), ["migration.sql"]);
  });
});

describe("migration safety (additive only)", () => {
  it("only creates the three new tables and their indexes: no ALTER/DROP/DELETE/UPDATE/INSERT/TRUNCATE of anything", () => {
    for (const s of statements) {
      assert.match(s, /^(CREATE TABLE|CREATE UNIQUE INDEX|CREATE INDEX|ALTER TABLE "monitoring_sessions" ADD CONSTRAINT)/, s.slice(0, 60));
    }
    // Referential actions inside the new table's own foreign key ("ON DELETE CASCADE ON UPDATE CASCADE") are not statements.
    const withoutFkActions = statements.join(";").replace(/ON (DELETE|UPDATE) (CASCADE|RESTRICT|SET NULL|NO ACTION)/gi, "");
    assert.ok(!/\b(DROP|TRUNCATE|DELETE|UPDATE|INSERT|RENAME)\b/i.test(withoutFkActions), "no destructive or data-changing statement");
  });
  it("touches no existing table: every table it names is one of the three new ones", () => {
    const named = [...sql.matchAll(/(?:TABLE|ON|REFERENCES)\s+"([a-z_]+)"/g)].map((m) => m[1]);
    assert.ok(named.length > 0);
    for (const t of named) assert.ok(NEW_TABLES.includes(t), `unexpected table ${t}`);
    assert.ok(!/"users"|"sessions"|"roles"|"adoption_/.test(sql), "no reference to existing tables (no foreign keys into them)");
  });
  it("matches the Prisma schema (same three tables, nothing else mapped to monitoring_*)", () => {
    const schema = fs.readFileSync(path.join(ROOT, "prisma/schema.prisma"), "utf8");
    const mapped = [...schema.matchAll(/@@map\("(monitoring_[a-z_]+)"\)/g)].map((m) => m[1]).sort();
    assert.deepEqual(mapped, [...NEW_TABLES].sort());
    const created = [...sql.matchAll(/CREATE TABLE "([a-z_]+)"/g)].map((m) => m[1]).sort();
    assert.deepEqual(created, [...NEW_TABLES].sort());
  });
  it("creates the indexes the dashboard queries rely on", () => {
    for (const idx of ["monitoring_sessions_ended_at_last_activity_at_idx", "monitoring_sessions_auth_session_id_idx", "monitoring_events_user_id_created_at_idx", "monitoring_events_category_type_created_at_idx", "monitoring_visitors_visitor_key_key"]) {
      assert.ok(sql.includes(`"${idx}"`), idx);
    }
  });
});

describe("rollback procedure (documented, and valid for this schema)", () => {
  const doc = fs.readFileSync(path.resolve(ROOT, "../DATABASE.md"), "utf8");
  it("DATABASE.md documents dropping exactly these tables", () => {
    const m = doc.match(/DROP TABLE ([a-z_, ]+);/g)?.find((x) => x.includes("monitoring_"));
    assert.ok(m, "rollback statement present");
    const dropped = m!.replace(/DROP TABLE |;/g, "").split(",").map((s) => s.trim()).sort();
    assert.deepEqual(dropped, [...NEW_TABLES].sort());
  });
  it("the documented drop order respects the one foreign key (sessions before visitors)", () => {
    assert.ok(/ALTER TABLE "monitoring_sessions" ADD CONSTRAINT[^;]*REFERENCES "monitoring_visitors"/.test(sql));
    const m = doc.match(/DROP TABLE (monitoring_[a-z_, ]+);/)![1].split(",").map((s) => s.trim());
    assert.ok(m.indexOf("monitoring_sessions") < m.indexOf("monitoring_visitors"));
  });
});

describe("isolation from unrelated work", () => {
  const files = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  it("no monitoring file (source or tests) imports or mentions the WhatsApp checker or the Super Admin repair/diagnostic scripts", () => {
    const own = [...files(path.join(ROOT, "src/modules/monitoring")), ...files(path.join(ROOT, "test/monitoring")).filter((f) => !f.endsWith("migration.test.ts"))];
    assert.ok(own.length >= 8);
    for (const f of own) {
      assert.ok(!/check-whatsapp|diagnose-login|repair-existing-superadmin|reset-superadmin-password/.test(fs.readFileSync(f, "utf8")), path.relative(ROOT, f));
    }
  });
});

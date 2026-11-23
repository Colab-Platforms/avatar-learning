-- Data-only, additive and idempotent. No schema change. INSERT only: no existing row is updated, renamed, re-slugged,
-- re-ordered or deleted, and no document is touched (existing sort_order values are preserved exactly).
--
-- Adds the three new investor categories after "Press Releases", in this order, at the next free positions:
--   Subsidiary Financial -> 136, MOA & AOA -> 137, Annual Return -> 138
-- (position = the larger of 135 and the current highest sort_order, plus 1, 2, 3 for the categories that are missing).
-- Production's current highest is Press Releases = 135, so the result there is exactly 136 / 137 / 138.
-- A category is considered present if one with the same slug OR the same name (case-insensitive) already exists; it is then
-- left exactly as it is. Re-running therefore inserts nothing.

INSERT INTO "investor_categories" ("id", "name", "slug", "sort_order", "is_active", "created_at")
SELECT 'seed_inv_' || m.slug, m.name, m.slug,
       GREATEST(135, COALESCE((SELECT MAX("sort_order") FROM "investor_categories"), 0)) + row_number() OVER (ORDER BY m.pos),
       true, CURRENT_TIMESTAMP
FROM (VALUES
  (1, 'Subsidiary Financial', 'subsidiary-financial'),
  (2, 'MOA & AOA',            'moa-aoa'),
  (3, 'Annual Return',        'annual-return')
) AS m(pos, name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM "investor_categories" c
  WHERE c."slug" = m.slug OR lower(c."name") = lower(m.name)
);

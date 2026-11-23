-- Data-only, additive and idempotent. No schema change; no category or document is ever deleted, renamed or re-slugged.
--
-- Goal: the public Investors page lists categories by sort_order, and the three new ones must sit immediately after
-- "Press Releases", in this order: Subsidiary Financial, MOA & AOA, Annual Return.
--
-- Step 1: add whichever of the three is missing (matched by slug OR case-insensitive name, so a category an admin
--         already created by hand is reused, never duplicated).
-- Step 2: renumber sort_order (1..n) so the order is: everything up to and including Press Releases, then the three
--         new categories, then every category that used to come after Press Releases (their relative order is kept).
--         Only sort_order changes. Re-running produces the identical result and updates nothing.
--         If there is no "Press Releases" category, the three are placed after all existing categories.

INSERT INTO "investor_categories" ("id", "name", "slug", "sort_order", "is_active", "created_at")
SELECT 'seed_inv_' || v.slug, v.name, v.slug, 0, true, CURRENT_TIMESTAMP
FROM (VALUES
  ('Subsidiary Financial', 'subsidiary-financial'),
  ('MOA & AOA',            'moa-aoa'),
  ('Annual Return',        'annual-return')
) AS v(name, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM "investor_categories" c
  WHERE c."slug" = v.slug OR lower(c."name") = lower(v.name)
);

WITH base AS (
  SELECT c."id", c."sort_order", c."created_at",
         CASE
           WHEN c."slug" = 'subsidiary-financial' OR lower(c."name") = 'subsidiary financial' THEN 1
           WHEN c."slug" = 'moa-aoa'              OR lower(c."name") = 'moa & aoa'            THEN 2
           WHEN c."slug" = 'annual-return'        OR lower(c."name") = 'annual return'        THEN 3
         END AS new_rank,
         (c."slug" = 'press-releases' OR lower(c."name") = 'press releases') AS is_pr
  FROM "investor_categories" c
),
anchor AS (
  SELECT b."id", b."sort_order", b."created_at"
  FROM base b
  WHERE b.is_pr AND b.new_rank IS NULL
  ORDER BY b."sort_order", b."created_at", b."id"
  LIMIT 1
),
ordered AS (
  SELECT b."id",
         row_number() OVER (
           ORDER BY
             CASE
               WHEN b.new_rank IS NOT NULL THEN CASE WHEN a."id" IS NOT NULL THEN 1 ELSE 3 END
               WHEN a."id" IS NULL THEN 0
               WHEN (b."sort_order", b."created_at", b."id") <= (a."sort_order", a."created_at", a."id") THEN 0
               ELSE 2
             END,
             b.new_rank,
             b."sort_order", b."created_at", b."id"
         ) AS rn
  FROM base b
  LEFT JOIN anchor a ON true
)
UPDATE "investor_categories" c
SET "sort_order" = o.rn
FROM ordered o
WHERE c."id" = o."id" AND c."sort_order" IS DISTINCT FROM o.rn;

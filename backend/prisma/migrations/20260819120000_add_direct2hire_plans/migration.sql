-- CreateEnum
CREATE TYPE "Direct2HirePlan" AS ENUM ('BASIC', 'STANDARD', 'PRO');

-- AlterTable
ALTER TABLE "direct2hire_enrollments" ADD COLUMN "plan" "Direct2HirePlan";

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "is_direct2hire_pro_only" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: every enrollment that was already fully paid under the old flat
-- ₹999 "courses + live counselling" plan is equivalent to the new Standard
-- tier, so it becomes Standard rather than being left unassigned.
UPDATE "direct2hire_enrollments" SET "plan" = 'STANDARD' WHERE "status" = 'PAID' AND "plan" IS NULL;

-- AlterTable
-- Adds a dedicated phone number column for VOICE counselling sessions.
-- Existing VIDEO bookings remain valid: phone_number is nullable and meeting_link is unchanged.
ALTER TABLE "counselling_bookings" ADD COLUMN IF NOT EXISTS "phone_number" TEXT;

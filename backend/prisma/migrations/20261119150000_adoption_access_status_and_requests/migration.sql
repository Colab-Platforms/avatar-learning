-- CreateEnum
CREATE TYPE "AdoptionAccessStatus" AS ENUM ('ACTIVE', 'PENDING_SETUP', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AdoptionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateEnum
CREATE TYPE "AdoptionDemoStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AdoptionCodePurpose" ADD VALUE 'CHANGE_EMAIL';

-- AlterTable
ALTER TABLE "adoption_users" ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "company_size" TEXT,
ADD COLUMN     "job_role" TEXT,
ADD COLUMN     "pending_email" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "adoption_entitlements" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" "AdoptionAccessStatus" NOT NULL DEFAULT 'PENDING_SETUP',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "adoption_entitlement_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product" "AdoptionProduct" NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" "AdoptionAccessStatus",
    "to_status" "AdoptionAccessStatus",
    "expires_at" TIMESTAMP(3),
    "note" TEXT,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoption_entitlement_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_access_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product" "AdoptionProduct" NOT NULL,
    "message" TEXT,
    "status" "AdoptionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "handled_at" TIMESTAMP(3),
    "handled_by" TEXT,

    CONSTRAINT "adoption_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_demo_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "company_size" TEXT NOT NULL,
    "tools" "AdoptionProduct"[],
    "custom_requirement" TEXT,
    "message" TEXT,
    "status" "AdoptionDemoStatus" NOT NULL DEFAULT 'SUBMITTED',
    "scheduled_at" TIMESTAMP(3),
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoption_demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adoption_entitlement_events_user_id_created_at_idx" ON "adoption_entitlement_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "adoption_access_requests_status_created_at_idx" ON "adoption_access_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "adoption_access_requests_user_id_idx" ON "adoption_access_requests"("user_id");

-- CreateIndex
CREATE INDEX "adoption_demo_requests_user_id_created_at_idx" ON "adoption_demo_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "adoption_demo_requests_status_created_at_idx" ON "adoption_demo_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "adoption_entitlement_events" ADD CONSTRAINT "adoption_entitlement_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "adoption_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_access_requests" ADD CONSTRAINT "adoption_access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "adoption_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_demo_requests" ADD CONSTRAINT "adoption_demo_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "adoption_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


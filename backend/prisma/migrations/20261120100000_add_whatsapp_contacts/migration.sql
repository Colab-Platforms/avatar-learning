-- CreateEnum
CREATE TYPE "WhatsappOptInStatus" AS ENUM ('UNKNOWN', 'GRANTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "wa_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'manual',
    "opt_in_status" "WhatsappOptInStatus" NOT NULL DEFAULT 'UNKNOWN',
    "opt_in_evidence" TEXT,
    "opt_in_at" TIMESTAMP(3),
    "opt_out_at" TIMESTAMP(3),
    "opt_status_by_user_id" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_wa_id_key" ON "whatsapp_contacts"("wa_id");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_name_idx" ON "whatsapp_contacts"("name");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_opt_in_status_idx" ON "whatsapp_contacts"("opt_in_status");


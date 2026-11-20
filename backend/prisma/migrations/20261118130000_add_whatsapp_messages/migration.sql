-- CreateEnum
CREATE TYPE "WhatsappMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('RECEIVED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "wa_message_id" TEXT NOT NULL,
    "direction" "WhatsappMessageDirection" NOT NULL,
    "status" "WhatsappMessageStatus" NOT NULL,
    "contact_wa_id" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone_number_id" TEXT,
    "message_type" TEXT,
    "text_body" TEXT,
    "message_timestamp" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "error_code" INTEGER,
    "error_title" TEXT,
    "error_details" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_wa_message_id_key" ON "whatsapp_messages"("wa_message_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_contact_wa_id_idx" ON "whatsapp_messages"("contact_wa_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_status_idx" ON "whatsapp_messages"("status");

-- CreateIndex
CREATE INDEX "whatsapp_messages_direction_created_at_idx" ON "whatsapp_messages"("direction", "created_at");


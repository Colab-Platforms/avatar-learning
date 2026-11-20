-- CreateEnum
CREATE TYPE "WhatsappConversationEventType" AS ENUM ('ASSIGNED', 'UNASSIGNED', 'NOTE');

-- AlterEnum
ALTER TYPE "WhatsappMessageStatus" ADD VALUE 'SENDING';

-- AlterTable
ALTER TABLE "whatsapp_messages" ADD COLUMN     "client_request_id" TEXT,
ADD COLUMN     "sent_by_user_id" TEXT;

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "contact_wa_id" TEXT NOT NULL,
    "assigned_to_user_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "last_read_at" TIMESTAMP(3),
    "last_read_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversation_events" (
    "id" TEXT NOT NULL,
    "contact_wa_id" TEXT NOT NULL,
    "type" "WhatsappConversationEventType" NOT NULL,
    "author_user_id" TEXT,
    "assignee_user_id" TEXT,
    "body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_conversation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversations_contact_wa_id_key" ON "whatsapp_conversations"("contact_wa_id");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_assigned_to_user_id_idx" ON "whatsapp_conversations"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "whatsapp_conversation_events_contact_wa_id_created_at_idx" ON "whatsapp_conversation_events"("contact_wa_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_client_request_id_key" ON "whatsapp_messages"("client_request_id");


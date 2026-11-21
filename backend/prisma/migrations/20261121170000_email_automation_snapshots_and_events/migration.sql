-- AlterEnum
ALTER TYPE "EmailMessageStatus" ADD VALUE 'UNCONFIRMED';

-- AlterTable
ALTER TABLE "email_messages" ADD COLUMN     "body_html" TEXT,
ADD COLUMN     "body_text" TEXT,
ADD COLUMN     "content_hash" TEXT,
ADD COLUMN     "first_attempt_at" TIMESTAMP(3),
ADD COLUMN     "list_unsubscribe" TEXT,
ADD COLUMN     "maybe_accepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "template_type" "EmailTemplateType" NOT NULL DEFAULT 'TRANSACTIONAL';

-- CreateTable
CREATE TABLE "email_webhook_events" (
    "id" TEXT NOT NULL,
    "svix_id" TEXT NOT NULL,
    "resend_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMP(3),

    CONSTRAINT "email_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_webhook_events_svix_id_key" ON "email_webhook_events"("svix_id");

-- CreateIndex
CREATE INDEX "email_webhook_events_resend_id_idx" ON "email_webhook_events"("resend_id");

-- CreateIndex
CREATE INDEX "email_webhook_events_received_at_idx" ON "email_webhook_events"("received_at");


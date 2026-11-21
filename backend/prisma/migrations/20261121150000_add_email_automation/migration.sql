-- CreateEnum
CREATE TYPE "EmailTemplateType" AS ENUM ('TRANSACTIONAL', 'PROMOTIONAL');
CREATE TYPE "EmailTemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "EmailTrigger" AS ENUM ('USER_REGISTERED', 'FOLLOW_UP', 'SCHEDULED_EMAIL', 'MANUAL_SEND');
CREATE TYPE "EmailMessageStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'COMPLAINED', 'FAILED', 'CANCELLED', 'SKIPPED');

-- AlterTable
ALTER TABLE "adoption_users" ADD COLUMN "marketing_email_opt_in" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_unsubscribed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "text_body" TEXT,
    "type" "EmailTemplateType" NOT NULL DEFAULT 'TRANSACTIONAL',
    "status" "EmailTemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_automations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "EmailTrigger" NOT NULL,
    "template_id" TEXT NOT NULL,
    "anchor_event" TEXT,
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "fired_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "to_email" TEXT NOT NULL,
    "user_id" TEXT,
    "template_id" TEXT,
    "automation_id" TEXT,
    "trigger" "EmailTrigger" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailMessageStatus" NOT NULL DEFAULT 'QUEUED',
    "scheduled_for" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "retry_epoch" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMP(3),
    "dedupe_key" TEXT NOT NULL,
    "resend_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "is_test" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_templates_status_idx" ON "email_templates"("status");
CREATE INDEX "email_automations_trigger_is_active_idx" ON "email_automations"("trigger", "is_active");
CREATE UNIQUE INDEX "email_messages_dedupe_key_key" ON "email_messages"("dedupe_key");
CREATE UNIQUE INDEX "email_messages_resend_id_key" ON "email_messages"("resend_id");
CREATE INDEX "email_messages_status_scheduled_for_idx" ON "email_messages"("status", "scheduled_for");
CREATE INDEX "email_messages_automation_id_created_at_idx" ON "email_messages"("automation_id", "created_at");
CREATE INDEX "email_messages_created_at_idx" ON "email_messages"("created_at");

-- AddForeignKey
ALTER TABLE "email_automations" ADD CONSTRAINT "email_automations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "email_automations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

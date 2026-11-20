-- CreateEnum
CREATE TYPE "AutomationExecutionStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "parameter_format" TEXT NOT NULL DEFAULT 'POSITIONAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "meta_template_id" TEXT,
    "draft" JSONB NOT NULL,
    "rejected_reason" TEXT,
    "last_error" TEXT,
    "submitted_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "template_language" TEXT NOT NULL,
    "variable_mapping" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT,
    "updated_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_executions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "contact_wa_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "template_language" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '[]',
    "status" "AutomationExecutionStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 4,
    "next_attempt_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "message_id" TEXT,
    "wa_message_id" TEXT,
    "skip_reason" TEXT,
    "last_error_code" INTEGER,
    "last_error" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "automation_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_templates_status_idx" ON "whatsapp_templates"("status");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_templates_name_language_key" ON "whatsapp_templates"("name", "language");

-- CreateIndex
CREATE INDEX "automation_rules_trigger_event_is_active_idx" ON "automation_rules"("trigger_event", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "automation_executions_idempotency_key_key" ON "automation_executions"("idempotency_key");

-- CreateIndex
CREATE INDEX "automation_executions_status_next_attempt_at_idx" ON "automation_executions"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "automation_executions_rule_id_created_at_idx" ON "automation_executions"("rule_id", "created_at");

-- CreateIndex
CREATE INDEX "automation_executions_created_at_idx" ON "automation_executions"("created_at");

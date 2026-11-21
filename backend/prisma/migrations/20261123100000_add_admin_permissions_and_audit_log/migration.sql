-- AlterTable: per-module actions (NULL = older rows keep every action on their listed modules)
ALTER TABLE "business_admin_access" ADD COLUMN "permissions" JSONB;

-- CreateTable
CREATE TABLE "business_admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "actor_email" TEXT,
    "action" TEXT NOT NULL,
    "target_user_id" TEXT,
    "target_email" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_admin_audit_logs_created_at_idx" ON "business_admin_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "business_admin_audit_logs_target_user_id_created_at_idx" ON "business_admin_audit_logs"("target_user_id", "created_at");

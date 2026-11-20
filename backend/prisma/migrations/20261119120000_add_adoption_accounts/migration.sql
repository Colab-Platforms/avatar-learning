-- CreateEnum
CREATE TYPE "AdoptionProduct" AS ENUM ('CRM', 'OMS', 'SCRIPT_AUTOMATION', 'LMS', 'RECRUITMENT_CRM', 'HRMS', 'IMS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AdoptionCodePurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- CreateTable
CREATE TABLE "adoption_users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "google_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adoption_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_sessions" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adoption_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_email_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" "AdoptionCodePurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoption_email_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_entitlements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product" "AdoptionProduct" NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" TEXT,

    CONSTRAINT "adoption_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adoption_users_email_key" ON "adoption_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "adoption_users_google_id_key" ON "adoption_users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "adoption_sessions_token_hash_key" ON "adoption_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "adoption_sessions_user_id_idx" ON "adoption_sessions"("user_id");

-- CreateIndex
CREATE INDEX "adoption_sessions_expires_at_idx" ON "adoption_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "adoption_email_codes_user_id_purpose_idx" ON "adoption_email_codes"("user_id", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "adoption_entitlements_user_id_product_key" ON "adoption_entitlements"("user_id", "product");

-- AddForeignKey
ALTER TABLE "adoption_sessions" ADD CONSTRAINT "adoption_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "adoption_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_email_codes" ADD CONSTRAINT "adoption_email_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "adoption_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_entitlements" ADD CONSTRAINT "adoption_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "adoption_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


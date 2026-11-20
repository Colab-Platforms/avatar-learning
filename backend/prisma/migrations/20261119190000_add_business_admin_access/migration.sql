-- CreateTable
CREATE TABLE "business_admin_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_key" TEXT NOT NULL,
    "modules" TEXT[],
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "business_admin_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_admin_access_user_id_key" ON "business_admin_access"("user_id");


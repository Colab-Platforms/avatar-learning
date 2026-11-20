-- CreateTable
CREATE TABLE "demo_bookings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "wa_phone" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "company_size" TEXT,
    "interested_tools" TEXT[],
    "custom_requirements" TEXT,
    "message" TEXT,
    "preferred_at" TIMESTAMP(3) NOT NULL,
    "whatsapp_consent" BOOLEAN NOT NULL DEFAULT false,
    "request_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demo_bookings_request_key_key" ON "demo_bookings"("request_key");

-- CreateIndex
CREATE INDEX "demo_bookings_created_at_idx" ON "demo_bookings"("created_at");

-- CreateIndex
CREATE INDEX "demo_bookings_preferred_at_idx" ON "demo_bookings"("preferred_at");

-- Live User Monitoring & Activity Tracking: three new tables (additive only; no existing table is altered).

-- CreateTable
CREATE TABLE "monitoring_visitors" (
    "id" TEXT NOT NULL,
    "visitor_key" TEXT NOT NULL,
    "user_id" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "first_path" TEXT,
    "first_referrer" TEXT,
    "country" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "page_views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "monitoring_visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_sessions" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "user_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "end_reason" TEXT,
    "current_path" TEXT,
    "referrer" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "auth_session_id" TEXT,

    CONSTRAINT "monitoring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_events" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "visitor_id" TEXT,
    "session_id" TEXT,
    "user_id" TEXT,
    "path" TEXT,
    "module" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "ip" TEXT,
    "outcome" TEXT,
    "reason" TEXT,
    "identifier" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_visitors_visitor_key_key" ON "monitoring_visitors"("visitor_key");

-- CreateIndex
CREATE INDEX "monitoring_visitors_user_id_idx" ON "monitoring_visitors"("user_id");

-- CreateIndex
CREATE INDEX "monitoring_visitors_last_seen_at_idx" ON "monitoring_visitors"("last_seen_at");

-- CreateIndex
CREATE INDEX "monitoring_sessions_ended_at_last_activity_at_idx" ON "monitoring_sessions"("ended_at", "last_activity_at");

-- CreateIndex
CREATE INDEX "monitoring_sessions_user_id_started_at_idx" ON "monitoring_sessions"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "monitoring_sessions_visitor_id_started_at_idx" ON "monitoring_sessions"("visitor_id", "started_at");

-- CreateIndex
CREATE INDEX "monitoring_sessions_auth_session_id_idx" ON "monitoring_sessions"("auth_session_id");

-- CreateIndex
CREATE INDEX "monitoring_sessions_started_at_idx" ON "monitoring_sessions"("started_at");

-- CreateIndex
CREATE INDEX "monitoring_events_user_id_created_at_idx" ON "monitoring_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "monitoring_events_visitor_id_created_at_idx" ON "monitoring_events"("visitor_id", "created_at");

-- CreateIndex
CREATE INDEX "monitoring_events_category_type_created_at_idx" ON "monitoring_events"("category", "type", "created_at");

-- CreateIndex
CREATE INDEX "monitoring_events_session_id_idx" ON "monitoring_events"("session_id");

-- CreateIndex
CREATE INDEX "monitoring_events_created_at_idx" ON "monitoring_events"("created_at");

-- AddForeignKey
ALTER TABLE "monitoring_sessions" ADD CONSTRAINT "monitoring_sessions_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "monitoring_visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

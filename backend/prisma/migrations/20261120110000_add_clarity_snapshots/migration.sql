-- CreateTable
CREATE TABLE "clarity_snapshots" (
    "id" TEXT NOT NULL,
    "num_of_days" INTEGER NOT NULL,
    "dimension" TEXT NOT NULL DEFAULT '',
    "payload" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clarity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clarity_snapshots_fetched_at_idx" ON "clarity_snapshots"("fetched_at");

-- CreateIndex
CREATE INDEX "clarity_snapshots_dimension_num_of_days_fetched_at_idx" ON "clarity_snapshots"("dimension", "num_of_days", "fetched_at");


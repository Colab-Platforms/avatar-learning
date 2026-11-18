-- CreateTable
CREATE TABLE "job_placement_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "location" TEXT,
    "ctc_lpa" DOUBLE PRECISION,
    "joined_at" TIMESTAMP(3) NOT NULL,
    "left_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "job_placement_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_placement_entries_user_id_idx" ON "job_placement_entries"("user_id");

-- CreateIndex
CREATE INDEX "job_placement_entries_user_id_left_at_idx" ON "job_placement_entries"("user_id", "left_at");

-- AddForeignKey
ALTER TABLE "job_placement_entries" ADD CONSTRAINT "job_placement_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

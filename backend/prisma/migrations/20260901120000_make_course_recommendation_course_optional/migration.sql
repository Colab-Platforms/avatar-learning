-- AlterTable
ALTER TABLE "course_recommendations" ALTER COLUMN "recommended_course_id" DROP NOT NULL;
ALTER TABLE "course_recommendations" ALTER COLUMN "recommended_course_slug" DROP NOT NULL;
ALTER TABLE "course_recommendations" ALTER COLUMN "recommended_course_title" DROP NOT NULL;

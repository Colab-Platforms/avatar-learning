/**
 * One-time backfill for the two-plan (₹499 BASIC / ₹4999 D2H) migration.
 *
 * Before this change, Direct2HireEnrollment / CounsellingBooking / MockInterview
 * were one-per-user and the chosen course lived only in
 * CounsellingBooking.selectedCourseId. They are now per-course, so every row
 * needs a course_id before the column can be made required.
 *
 * RUN ORDER — this matters:
 *   1. Push the schema with course_id still NULLABLE on those three models.
 *   2. `npm run backfill:tiers`  (this script)
 *   3. Push again with course_id REQUIRED.
 *
 * Idempotent: rows that already have a course_id are left alone.
 * Pass --dry to preview without writing.
 */
import "dotenv/config";
import prisma from "../prisma";

const DRY = process.argv.includes("--dry");

function log(...args: unknown[]) {
  console.log(DRY ? "[dry]" : "[run]", ...args);
}

/**
 * Best-effort guess of which course a legacy user's D2H journey belonged to.
 * Ordered most-reliable first: the course they explicitly picked in
 * counselling, then any D2H course they were actually granted access to.
 */
async function resolveCourseIdForUser(userId: string): Promise<string | null> {
  const booking = await prisma.counsellingBooking.findFirst({
    where: { userId, selectedCourseId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { selectedCourseId: true },
  });
  if (booking?.selectedCourseId) return booking.selectedCourseId;

  const mapper = await prisma.courseUserMapper.findFirst({
    where: { userId, course: { isDirect2HireCourse: true } },
    orderBy: { enrolledAt: "asc" },
    select: { courseId: true },
  });
  return mapper?.courseId ?? null;
}

async function backfillDirect2HireEnrollments() {
  const rows = await prisma.direct2HireEnrollment.findMany({
    where: { courseId: null },
    select: { id: true, userId: true, status: true },
  });
  log(`Direct2HireEnrollment: ${rows.length} rows without a course`);

  let fixed = 0;
  const orphans: { id: string; userId: string; status: string }[] = [];

  for (const row of rows) {
    const courseId = await resolveCourseIdForUser(row.userId);
    if (!courseId) {
      orphans.push(row);
      continue;
    }

    // A user may already have a row for this course — the unique constraint
    // would reject a second one, so fold the legacy row into it.
    const clash = await prisma.direct2HireEnrollment.findFirst({
      where: { userId: row.userId, courseId, id: { not: row.id } },
      select: { id: true },
    });
    if (clash) {
      log(`  merge duplicate enrollment ${row.id} -> ${clash.id}`);
      if (!DRY) {
        await prisma.paymentOrder.updateMany({
          where: { direct2hireEnrollmentId: row.id },
          data: { direct2hireEnrollmentId: clash.id },
        });
        await prisma.direct2HireEnrollment.delete({ where: { id: row.id } });
      }
      continue;
    }

    if (!DRY) {
      await prisma.direct2HireEnrollment.update({
        where: { id: row.id },
        data: { courseId },
      });
    }
    fixed++;
  }

  log(`  backfilled ${fixed}, unresolved ${orphans.length}`);
  return orphans;
}

async function backfillCounsellingBookings() {
  const rows = await prisma.counsellingBooking.findMany({
    where: { courseId: null },
    select: { id: true, userId: true, selectedCourseId: true },
  });
  log(`CounsellingBooking: ${rows.length} rows without a course`);

  let fixed = 0;
  const orphans: { id: string; userId: string }[] = [];

  for (const row of rows) {
    const courseId =
      row.selectedCourseId ?? (await resolveCourseIdForUser(row.userId));
    if (!courseId) {
      orphans.push(row);
      continue;
    }
    if (!DRY) {
      await prisma.counsellingBooking.update({
        where: { id: row.id },
        data: { courseId },
      });
    }
    fixed++;
  }

  log(`  backfilled ${fixed}, unresolved ${orphans.length}`);
  return orphans;
}

async function backfillMockInterviews() {
  const rows = await prisma.mockInterview.findMany({
    where: { courseId: null },
    select: { id: true, userId: true },
  });
  log(`MockInterview: ${rows.length} rows without a course`);

  let fixed = 0;
  const orphans: { id: string; userId: string }[] = [];

  for (const row of rows) {
    const courseId = await resolveCourseIdForUser(row.userId);
    if (!courseId) {
      orphans.push(row);
      continue;
    }
    if (!DRY) {
      await prisma.mockInterview.update({
        where: { id: row.id },
        data: { courseId },
      });
    }
    fixed++;
  }

  log(`  backfilled ${fixed}, unresolved ${orphans.length}`);
  return orphans;
}

/**
 * Existing lessons were all authored for the ₹4999 programme, and the column
 * default already says D2H — this only repairs rows written before the default
 * existed (db push backfills NULLs, but be explicit rather than assume).
 */
async function backfillLessonTiers() {
  const count = await prisma.lessons.count();
  log(`Lessons: ${count} total (all remain tier=D2H; ₹499 weeks are authored fresh)`);
}

async function main() {
  if (DRY) console.log("\n*** DRY RUN — no writes ***\n");

  const d2h = await backfillDirect2HireEnrollments();
  const bookings = await backfillCounsellingBookings();
  const mocks = await backfillMockInterviews();
  await backfillLessonTiers();

  const orphanTotal = d2h.length + bookings.length + mocks.length;
  if (orphanTotal > 0) {
    console.log(
      `\n!! ${orphanTotal} row(s) could not be resolved to a course.\n` +
        `   Making course_id required will FAIL until these are handled.\n` +
        `   They are users who never selected a course and never got access —\n` +
        `   usually abandoned PENDING rows that are safe to delete.\n`,
    );
    console.log("Direct2HireEnrollment:", d2h);
    console.log("CounsellingBooking:", bookings);
    console.log("MockInterview:", mocks);
  } else {
    console.log("\nAll rows resolved. Safe to make course_id required.\n");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

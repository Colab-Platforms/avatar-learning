/**
 * Legacy cleanup for the per-course D2H migration.
 *
 *   1. DELETE abandoned PENDING Direct2HireEnrollment rows with no course.
 *      (Never paid, never chose a course — pure funnel noise.)
 *   2. MAP the 2 REFUNDED D2H rows to the flagship course.
 *   3. MAP the 18 CounsellingBooking + 1 MockInterview NULL rows to the flagship.
 *
 * Real customer data is never touched — no User row is deleted, no PAID
 * enrollment is deleted, no PaymentOrder that ever succeeded is deleted.
 *
 * Pass --dry to preview without writing.
 */
import "dotenv/config";
import prisma from "../prisma";

const DRY = process.argv.includes("--dry");

/** ₹4999 "AI Fundamentals & ChatGPT Mastery" — the original D2H programme. */
const FLAGSHIP_COURSE_ID = "cmqtgomgu00081vbc7th2ga75";

function log(...args: unknown[]) {
  console.log(DRY ? "[dry]" : "[run]", ...args);
}

async function countNullRows() {
  const rows = await prisma.$queryRaw<{ table: string; count: bigint }[]>`
    SELECT 'direct2hire_enrollments' AS table, COUNT(*)::bigint AS count
      FROM direct2hire_enrollments WHERE course_id IS NULL
    UNION ALL
    SELECT 'counselling_bookings', COUNT(*)::bigint
      FROM counselling_bookings WHERE course_id IS NULL
    UNION ALL
    SELECT 'mock_interviews', COUNT(*)::bigint
      FROM mock_interviews WHERE course_id IS NULL
  `;
  return rows;
}

async function deletePendingD2H() {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id
      FROM direct2hire_enrollments
     WHERE course_id IS NULL
       AND status = 'PENDING'
  `;
  log(`PENDING D2H with NULL course_id: ${rows.length} row(s) to delete`);
  if (rows.length === 0 || DRY) return rows.length;

  // PartnerReferral.direct2hireEnrollmentId is nullable but has no cascade —
  // null it out first or the delete violates the FK.
  const nulled = await prisma.$executeRaw`
    UPDATE partner_referrals
       SET direct2hire_enrollment_id = NULL
     WHERE direct2hire_enrollment_id IN (
       SELECT id FROM direct2hire_enrollments
        WHERE course_id IS NULL AND status = 'PENDING'
     )
  `;
  log(`  nulled ${nulled} partner_referrals FK(s)`);

  // PaymentOrder.direct2hireEnrollmentId cascades — abandoned/PENDING payment
  // attempts pointing at these enrollments go with them, which is correct.
  const deleted = await prisma.$executeRaw`
    DELETE FROM direct2hire_enrollments
     WHERE course_id IS NULL AND status = 'PENDING'
  `;
  log(`  deleted ${deleted} enrollment(s)`);
  return deleted;
}

async function mapRefundedD2H() {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id
      FROM direct2hire_enrollments
     WHERE course_id IS NULL
       AND status = 'REFUNDED'
  `;
  log(`REFUNDED D2H with NULL course_id: ${rows.length} row(s) to map`);
  if (rows.length === 0 || DRY) return rows.length;

  // Skip any user who already has a flagship enrollment (would violate
  // @@unique([userId, courseId])). Volumes are tiny; clashes are unlikely.
  const updated = await prisma.$executeRaw`
    UPDATE direct2hire_enrollments
       SET course_id = ${FLAGSHIP_COURSE_ID}
     WHERE course_id IS NULL
       AND status = 'REFUNDED'
       AND user_id NOT IN (
         SELECT user_id FROM direct2hire_enrollments
          WHERE course_id = ${FLAGSHIP_COURSE_ID}
       )
  `;
  log(`  mapped ${updated} row(s)`);
  return updated;
}

async function mapCounsellingBookings() {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM counselling_bookings WHERE course_id IS NULL
  `;
  log(`CounsellingBooking with NULL course_id: ${rows.length} row(s) to map`);
  if (rows.length === 0 || DRY) return rows.length;

  const updated = await prisma.$executeRaw`
    UPDATE counselling_bookings
       SET course_id = ${FLAGSHIP_COURSE_ID}
     WHERE course_id IS NULL
       AND user_id NOT IN (
         SELECT user_id FROM counselling_bookings
          WHERE course_id = ${FLAGSHIP_COURSE_ID}
       )
  `;
  log(`  mapped ${updated} row(s)`);
  return updated;
}

async function mapMockInterviews() {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM mock_interviews WHERE course_id IS NULL
  `;
  log(`MockInterview with NULL course_id: ${rows.length} row(s) to map`);
  if (rows.length === 0 || DRY) return rows.length;

  const updated = await prisma.$executeRaw`
    UPDATE mock_interviews
       SET course_id = ${FLAGSHIP_COURSE_ID}
     WHERE course_id IS NULL
       AND user_id NOT IN (
         SELECT user_id FROM mock_interviews
          WHERE course_id = ${FLAGSHIP_COURSE_ID}
       )
  `;
  log(`  mapped ${updated} row(s)`);
  return updated;
}

async function main() {
  if (DRY) console.log("\n*** DRY RUN — no writes ***\n");

  const course = await prisma.courses.findUnique({
    where: { id: FLAGSHIP_COURSE_ID },
    select: { id: true, title: true, isDirect2HireCourse: true },
  });
  if (!course) throw new Error(`Flagship course ${FLAGSHIP_COURSE_ID} not found.`);
  log(`Flagship course: "${course.title}" (${course.id})`);

  console.log("\nBEFORE:");
  for (const r of await countNullRows()) console.log(`  ${r.table}: ${r.count}`);
  console.log();

  await deletePendingD2H();
  await mapRefundedD2H();
  await mapCounsellingBookings();
  await mapMockInterviews();

  console.log("\nAFTER:");
  for (const r of await countNullRows()) console.log(`  ${r.table}: ${r.count}`);
  console.log(
    DRY
      ? "\n(dry run — nothing changed; re-run without --dry to apply)\n"
      : "\nDone. Re-run `npx prisma db push` to make course_id required.\n",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

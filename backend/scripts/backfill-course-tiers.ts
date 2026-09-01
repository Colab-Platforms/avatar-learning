/**
 * Legacy cleanup for the per-course D2H migration.
 *
 * Run this BETWEEN the two `prisma db push` steps:
 *
 *   1. push an interim schema where Direct2HireEnrollment.courseId,
 *      CounsellingBooking.courseId and MockInterview.courseId are OPTIONAL
 *      (`String?`), so the columns exist and are nullable;
 *   2. run this script (`--dry` first) until it reports 0 leftovers;
 *   3. push the real schema, which makes those three columns required.
 *
 * What it does:
 *   1. DELETE abandoned PENDING Direct2HireEnrollment rows with no course —
 *      never paid, never chose a course, pure funnel noise. Two kinds of
 *      PENDING row are NEVER deleted:
 *        - one with `assessment_counselling_paid_at` set. The ₹99 add-on does
 *          not move status to PAID (see payment.service.ts), so a paying
 *          Assessment+Counselling customer sits at PENDING forever. Deleting
 *          it revokes their counselling and cascades away their PaymentOrder.
 *        - one with a PAID PaymentOrder attached — real money a webhook failed
 *          to reconcile. Those are reported for manual review.
 *   2. MAP every remaining null-course Direct2HireEnrollment (PAID, REFUNDED,
 *      and the ₹99 PENDING rows kept above) to the flagship course.
 *   3. MAP null-course CounsellingBooking and MockInterview rows to the flagship.
 *   4. Collapse CourseUserMapper: on the old code every paying user was enrolled
 *      in EVERY isDirect2HireCourse course, and the new `tier` column defaults
 *      to D2H — so after the push they would hold full D2H access to all of
 *      them. Keep only the flagship, forced onto the D2H track, and drop the
 *      other D2H mappers that carry no progress and no separate paid order.
 *      Legacy rows never become BOTH — see collapseD2HMappers for why.
 *   5. VERIFY nothing is left NULL, so step 3 above cannot fail.
 *
 * Real customer data is never touched — no User row is deleted, no PAID
 * enrollment is deleted, no PaymentOrder that ever succeeded is deleted.
 *
 * Flags:
 *   --dry           preview without writing
 *   --user=<email>  scope every statement to one user (smoke test first)
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import prisma from "../prisma";

const DRY = process.argv.includes("--dry");
const USER_EMAIL = process.argv
  .find((a) => a.startsWith("--user="))
  ?.slice("--user=".length);

/** ₹4999 "AI Fundamentals & ChatGPT Mastery" — the original D2H programme. */
const FLAGSHIP_COURSE_ID = "cmqtgomgu00081vbc7th2ga75";

type Tx = Prisma.TransactionClient;

let scopedUserId: string | null = null;

function log(...args: unknown[]) {
  console.log(DRY ? "[dry]" : "[run]", ...args);
}

/** `AND user_id = '...'` when --user was given, otherwise nothing. */
function userScope(column = "user_id") {
  if (!scopedUserId) return Prisma.empty;
  return Prisma.sql`AND ${Prisma.raw(column)} = ${scopedUserId}`;
}

async function countNullRows(tx: Tx) {
  // "table" is a reserved word in Postgres — it must be quoted as an alias.
  return tx.$queryRaw<{ table: string; count: bigint }[]>`
    SELECT 'direct2hire_enrollments' AS "table", COUNT(*)::bigint AS count
      FROM direct2hire_enrollments WHERE course_id IS NULL ${userScope()}
    UNION ALL
    SELECT 'counselling_bookings', COUNT(*)::bigint
      FROM counselling_bookings WHERE course_id IS NULL ${userScope()}
    UNION ALL
    SELECT 'mock_interviews', COUNT(*)::bigint
      FROM mock_interviews WHERE course_id IS NULL ${userScope()}
  `;
}

/**
 * PENDING enrollments that nonetheless carry a PAID PaymentOrder — a webhook
 * that never landed. Deleting these would cascade away a real payment record,
 * so they are reported and left alone for a human to reconcile.
 */
async function reportPaidPendings(tx: Tx) {
  const rows = await tx.$queryRaw<{ id: string; email: string }[]>`
    SELECT e.id, u.email
      FROM direct2hire_enrollments e
      JOIN users u ON u.id = e.user_id
     WHERE e.course_id IS NULL
       AND e.status = 'PENDING'
       AND EXISTS (
         SELECT 1 FROM payment_orders p
          WHERE p.direct2hire_enrollment_id = e.id AND p.status = 'PAID'
       )
       ${userScope("e.user_id")}
  `;
  if (rows.length) {
    console.warn(
      `\n!! ${rows.length} PENDING enrollment(s) have a PAID PaymentOrder — NOT deleted, reconcile by hand:`,
    );
    for (const r of rows) console.warn(`     ${r.id}  ${r.email}`);
    console.warn();
  }
  return rows.map((r) => r.id);
}

async function deletePendingD2H(tx: Tx, protectedIds: string[]) {
  const keep =
    protectedIds.length > 0
      ? Prisma.sql`AND id NOT IN (${Prisma.join(protectedIds)})`
      : Prisma.empty;

  // assessment_counselling_paid_at marks a ₹99 customer whose status never
  // leaves PENDING — they keep their enrollment and get mapped like a payer.
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM direct2hire_enrollments
     WHERE course_id IS NULL
       AND status = 'PENDING'
       AND assessment_counselling_paid_at IS NULL
       ${keep} ${userScope()}
  `;
  const kept = await tx.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM direct2hire_enrollments
     WHERE course_id IS NULL
       AND status = 'PENDING'
       AND assessment_counselling_paid_at IS NOT NULL
       ${userScope()}
  `;
  log(`₹99 Assessment+Counselling PENDING rows preserved: ${kept[0].count}`);
  log(`Abandoned PENDING D2H with NULL course_id: ${rows.length} row(s) to delete`);
  if (rows.length === 0 || DRY) return rows.length;

  const ids = Prisma.join(rows.map((r) => r.id));

  // PartnerReferral.direct2hireEnrollmentId is nullable but has no cascade —
  // null it out first or the delete violates the FK.
  const nulled = await tx.$executeRaw`
    UPDATE partner_referrals SET direct2hire_enrollment_id = NULL
     WHERE direct2hire_enrollment_id IN (${ids})
  `;
  log(`  nulled ${nulled} partner_referrals FK(s)`);

  // PaymentOrder.direct2hireEnrollmentId cascades — the abandoned PENDING
  // payment attempts pointing at these enrollments go with them, which is
  // correct: reportPaidPendings already excluded anything actually paid.
  const deleted = await tx.$executeRaw`
    DELETE FROM direct2hire_enrollments WHERE id IN (${ids})
  `;
  log(`  deleted ${deleted} enrollment(s)`);
  return deleted;
}

/**
 * Map the surviving null-course enrollments (PAID + REFUNDED) to the flagship.
 * A user who somehow already holds a flagship enrollment cannot get a second
 * one (@@unique([userId, courseId])), so the stale null row is dropped instead
 * of being left behind to fail the final NOT NULL push.
 */
async function mapRemainingD2H(tx: Tx) {
  const clashes = await tx.$queryRaw<{ id: string }[]>`
    SELECT e.id FROM direct2hire_enrollments e
     WHERE e.course_id IS NULL
       AND EXISTS (
         SELECT 1 FROM direct2hire_enrollments o
          WHERE o.user_id = e.user_id AND o.course_id = ${FLAGSHIP_COURSE_ID}
       )
       ${userScope("e.user_id")}
  `;
  log(`D2H null rows clashing with an existing flagship row: ${clashes.length}`);

  if (clashes.length > 0 && !DRY) {
    const ids = Prisma.join(clashes.map((r) => r.id));
    await tx.$executeRaw`
      UPDATE partner_referrals SET direct2hire_enrollment_id = NULL
       WHERE direct2hire_enrollment_id IN (${ids})
    `;
    await tx.$executeRaw`DELETE FROM direct2hire_enrollments WHERE id IN (${ids})`;
    log(`  dropped ${clashes.length} duplicate row(s)`);
  }

  const rows = await tx.$queryRaw<{ id: string; status: string }[]>`
    SELECT id, status FROM direct2hire_enrollments
     WHERE course_id IS NULL ${userScope()}
  `;
  log(`D2H with NULL course_id to map: ${rows.length} row(s)`);
  if (rows.length === 0 || DRY) return rows.length;

  const updated = await tx.$executeRaw`
    UPDATE direct2hire_enrollments SET course_id = ${FLAGSHIP_COURSE_ID}
     WHERE course_id IS NULL ${userScope()}
  `;
  log(`  mapped ${updated} row(s)`);
  return updated;
}

/** Same shape for the two other tables that gained a required course_id. */
async function mapByUser(
  tx: Tx,
  table: "counselling_bookings" | "mock_interviews",
) {
  const t = Prisma.raw(table);

  const clashes = await tx.$queryRaw<{ id: string }[]>`
    SELECT a.id FROM ${t} a
     WHERE a.course_id IS NULL
       AND EXISTS (
         SELECT 1 FROM ${t} b
          WHERE b.user_id = a.user_id AND b.course_id = ${FLAGSHIP_COURSE_ID}
       )
       ${userScope("a.user_id")}
  `;
  if (clashes.length > 0) {
    log(`${table}: ${clashes.length} duplicate null row(s) to drop`);
    if (!DRY) {
      await tx.$executeRaw`
        DELETE FROM ${t} WHERE id IN (${Prisma.join(clashes.map((r) => r.id))})
      `;
    }
  }

  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM ${t} WHERE course_id IS NULL ${userScope()}
  `;
  log(`${table} with NULL course_id: ${rows.length} row(s) to map`);
  if (rows.length === 0 || DRY) return rows.length;

  const updated = await tx.$executeRaw`
    UPDATE ${t} SET course_id = ${FLAGSHIP_COURSE_ID}
     WHERE course_id IS NULL ${userScope()}
  `;
  log(`  mapped ${updated} row(s)`);
  return updated;
}

/**
 * Old `grantCourseAccess` enrolled every paying user in EVERY D2H course, and
 * the new `tier` column defaults to D2H — so after the push those users would
 * hold full D2H access to every course. Collapse each of them onto the flagship.
 *
 * A non-flagship mapper is only removed when it carries no progress and no
 * separate paid COURSE order, so a genuine ₹499 BASIC purchase survives.
 */
async function collapseD2HMappers(tx: Tx) {
  const stale = await tx.$queryRaw<{ id: string }[]>`
    SELECT m.id
      FROM course_user_mapper m
      JOIN courses c ON c.id = m.course_id
     WHERE c.is_direct2hire_course = true
       AND m.course_id <> ${FLAGSHIP_COURSE_ID}
       AND m.progress = 0
       AND m.is_completed = false
       AND EXISTS (
         SELECT 1 FROM direct2hire_enrollments e
          WHERE e.user_id = m.user_id AND e.status IN ('PAID', 'REFUNDED')
       )
       AND NOT EXISTS (
         SELECT 1 FROM payment_orders p
          WHERE p.user_id = m.user_id AND p.course_id = m.course_id
            AND p.product_type = 'COURSE' AND p.status = 'PAID'
       )
       ${userScope("m.user_id")}
  `;
  log(`Non-flagship D2H mappers to remove: ${stale.length}`);
  if (stale.length > 0 && !DRY) {
    await tx.$executeRaw`
      DELETE FROM course_user_mapper
       WHERE id IN (${Prisma.join(stale.map((r) => r.id))})
    `;
  }

  // Every paid/refunded user must end up holding the flagship mapper.
  const missing = await tx.$queryRaw<{ user_id: string }[]>`
    SELECT DISTINCT e.user_id
      FROM direct2hire_enrollments e
     WHERE e.status IN ('PAID', 'REFUNDED')
       AND NOT EXISTS (
         SELECT 1 FROM course_user_mapper m
          WHERE m.user_id = e.user_id AND m.course_id = ${FLAGSHIP_COURSE_ID}
       )
       ${userScope("e.user_id")}
  `;
  log(`Paid users missing the flagship mapper: ${missing.length}`);
  if (missing.length > 0 && !DRY) {
    for (const { user_id } of missing) {
      await tx.$executeRaw`
        INSERT INTO course_user_mapper
          (id, user_id, course_id, tier, enrolled_at, progress, is_completed)
        VALUES
          (gen_random_uuid()::text, ${user_id}, ${FLAGSHIP_COURSE_ID}, 'D2H', now(), 0, false)
      `;
    }
  }

  // Force the flagship mapper to the D2H track for every legacy payer.
  //
  // Deliberately NOT derived from their payment history. The BASIC/D2H split
  // does not exist on main — there is no ₹499 track, no tier column and no
  // two-track content there — so a legacy `COURSE` order means "bought this
  // course", not "bought the BASIC track". Reading those rows as a BASIC
  // purchase invents a transaction that was never possible and lands the
  // student on BOTH, showing them two tracks where they should see one.
  //
  // BOTH is reachable going forward: payment.service.ts assigns it when a
  // student who already holds one track buys the other.
  const forced = await tx.$queryRaw<{ id: string }[]>`
    SELECT m.id FROM course_user_mapper m
     WHERE m.course_id = ${FLAGSHIP_COURSE_ID}
       AND m.tier <> 'D2H'
       AND EXISTS (
         SELECT 1 FROM direct2hire_enrollments e
          WHERE e.user_id = m.user_id AND e.status IN ('PAID', 'REFUNDED')
       )
       ${userScope("m.user_id")}
  `;
  log(`Flagship mappers to force onto the D2H track: ${forced.length}`);
  if (forced.length > 0 && !DRY) {
    await tx.$executeRaw`
      UPDATE course_user_mapper SET tier = 'D2H'
       WHERE id IN (${Prisma.join(forced.map((r) => r.id))})
    `;
  }
}

async function main() {
  if (DRY) console.log("\n*** DRY RUN — no writes ***\n");

  if (USER_EMAIL) {
    const u = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
      select: { id: true, email: true },
    });
    if (!u) throw new Error(`No user with email ${USER_EMAIL}`);
    scopedUserId = u.id;
    console.log(`*** SCOPED to single user: ${u.email} (${u.id}) ***\n`);
  }

  const course = await prisma.courses.findUnique({
    where: { id: FLAGSHIP_COURSE_ID },
    select: { id: true, title: true, isDirect2HireCourse: true },
  });
  if (!course) throw new Error(`Flagship course ${FLAGSHIP_COURSE_ID} not found.`);
  if (!course.isDirect2HireCourse) {
    throw new Error(
      `Flagship course "${course.title}" is not flagged isDirect2HireCourse.`,
    );
  }
  log(`Flagship course: "${course.title}" (${course.id})`);

  // One transaction: a failure halfway through must not leave the DB in a
  // state where some rows are mapped and the rest are still NULL.
  await prisma.$transaction(
    async (tx) => {
      console.log("\nBEFORE:");
      for (const r of await countNullRows(tx)) console.log(`  ${r.table}: ${r.count}`);
      console.log();

      const protectedIds = await reportPaidPendings(tx);
      await deletePendingD2H(tx, protectedIds);
      await mapRemainingD2H(tx);
      await mapByUser(tx, "counselling_bookings");
      await mapByUser(tx, "mock_interviews");
      await collapseD2HMappers(tx);

      console.log("\nAFTER:");
      const after = await countNullRows(tx);
      for (const r of after) console.log(`  ${r.table}: ${r.count}`);

      // Scoped runs legitimately leave other users' rows NULL.
      const leftovers = after.filter((r) => r.count > 0n);
      if (!DRY && !scopedUserId && leftovers.length > 0) {
        throw new Error(
          `Rows still NULL after backfill (${leftovers
            .map((r) => `${r.table}=${r.count}`)
            .join(", ")}) — the final db push would fail. Rolling back.`,
        );
      }
    },
    { timeout: 120_000 },
  );

  console.log(
    DRY
      ? "\n(dry run — nothing changed; re-run without --dry to apply)\n"
      : "\nDone. Now `npx prisma db push` with the real schema to make course_id required.\n",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

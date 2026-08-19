import "dotenv/config";
import prisma from "../prisma";
import { direct2hireService } from "../src/modules/direct2hire/direct2hire.service";

// One-off backfill: the Standard/Pro tiered gating (internship = Standard+,
// placement = Pro-only) is new. Every existing PAID enrollment predates plan
// selection, so bump them all to PRO and grant the PRO-only courses too —
// nobody who already paid should lose access they had before this shipped.
async function main() {
  const paidEnrollments = await prisma.direct2HireEnrollment.findMany({
    where: { status: "PAID" },
    select: { id: true, userId: true, plan: true },
  });

  console.log(`Found ${paidEnrollments.length} PAID enrollments.`);

  let updated = 0;
  for (const enrollment of paidEnrollments) {
    if (enrollment.plan !== "PRO") {
      await prisma.direct2HireEnrollment.update({
        where: { id: enrollment.id },
        data: { plan: "PRO" },
      });
      updated++;
    }
    await direct2hireService.grantCourseAccess(enrollment.userId, "PRO");
  }

  console.log(`✅ Updated ${updated} enrollments to PRO, verified course access for ${paidEnrollments.length} users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

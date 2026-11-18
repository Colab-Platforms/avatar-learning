import cron from "node-cron";
import prisma from "@root/prisma.js";

const BATCH_SIZE = 100;

// Deletes expired sessions in bounded batches so a large backlog never
// takes one long table-locking DELETE.
export const cleanupExpiredSessions = async (): Promise<number> => {
  let totalDeleted = 0;

  while (true) {
    const expired = await prisma.session.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { id: true },
      take: BATCH_SIZE,
    });

    if (expired.length === 0) break;

    await prisma.session.deleteMany({
      where: { id: { in: expired.map((s) => s.id) } },
    });

    totalDeleted += expired.length;

    if (expired.length < BATCH_SIZE) break;
  }

  if (totalDeleted > 0) {
    console.log(`[SessionCleanup] Deleted ${totalDeleted} expired session(s).`);
  }

  return totalDeleted;
};

// Runs once at boot (covers any backlog / time since last deploy), then daily at 03:00.
export const startSessionCleanupJob = (): void => {
  cleanupExpiredSessions().catch((err) =>
    console.error("[SessionCleanup] Initial run failed:", err),
  );

  cron.schedule("0 3 * * *", () => { // 03:00 AM daily
    cleanupExpiredSessions().catch((err) =>
      console.error("[SessionCleanup] Scheduled run failed:", err),
    );
  });
};

import cron from "node-cron";
import { partnerService } from "@/modules/partners/partner.service.js";

// const isProd = process.env.NODE_ENV === "production";
let isProd = true; // TODO: Remove this line before deploying to production. It is only for testing the cron job in dev mode.
// Runs once at boot (covers any backlog / time since last deploy), then:
//   prod: daily at 04:00 — matches the real 15-day hold.
//   dev:  every minute — matches partner.service.ts's 5-minute dev hold, so
//   the schedule → cron → credit pipeline is actually observable while testing.
export const startPartnerCommissionJob = (): void => {
  const run = () =>
    partnerService
      .processMaturedReferrals()
      .then(({ credited, refunded }) => {
        if (credited > 0 || refunded > 0) {
          console.log(
            `[PartnerCommission] Credited ${credited}, skipped ${refunded} refunded referral(s).`,
          );
        }
      })
      .catch((err) => console.error("[PartnerCommission] Run failed:", err));

  run();

  cron.schedule(isProd ? "0 4 * * *" : "* * * * *", run);
};

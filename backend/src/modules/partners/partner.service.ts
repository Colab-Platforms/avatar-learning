import crypto from "crypto";
import dayjs from "dayjs";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import {
  sendPartnerApplicationEmail,
  sendPartnerClaimEmail,
} from "./partner.mail.js";
import { ApplyPartnerBody } from "./partner.types.js";

// Refund-safety hold. Matches the Direct2Hire refund policy:
//   within 48 hours of purchase → 100% refund
//   within 3–7 days             → 50% refund
//   after 7 days                → 0% refund (non-refundable)
// Held for 15 days (margin past the 7-day cutoff) before a partner is paid,
// so a refund can never land after the commission has already gone out.
// Shortened to 5 minutes outside production so the whole schedule → cron →
// credit pipeline can be verified without waiting half a month.
// const isProd = process.env.NODE_ENV === "production";
const isProd = true; // TODO: Remove this line before deploying to production. It is only for testing the cron job in dev mode.
const getEligibleAt = () =>
  isProd
    ? dayjs().add(COMMISSION_HOLD_DAYS, "day").toDate()
    : dayjs().add(5, "minute").toDate();
const COMMISSION_HOLD_DAYS = 15;

// Commission model — differs by partner type.
//
// INDIVIDUAL: flat 10% credited on every referral, immediately.
//
// INSTITUTE: bracket/band commission. No commission on referrals 1–10 (below
// threshold — the implicit "band 0"). Each bounded band pays out as ONE LUMP
// SUM the moment its FIRST referral arrives (i.e. the referral that crosses
// INTO the new tier) — sized by the width of the band just completed,
// charged at the new tier's rate:
//   entering 11–25   → 10  (width of 1–10)   × 20% = ₹1,000-ish
//   entering 26–50   → 15  (width of 11–25)  × 25%
//   entering 51–100  → 25  (width of 26–50)  × 30%
//   entering 101–200 → 50  (width of 51–100) × 40%
//   entering 201–500 → 100 (width of 101–200)× 50%
//   entering 501+    → 300 (width of 201–500)× 60%
// Every other referral inside a band (not the one entering it) earns ₹0
// individually. The final band (501+) has no next threshold to wait for, so
// referrals after the entry one there fall back to flat per-referral 60%.
//
// CORPORATE: no referral dashboard, never reaches this function.

const INSTITUTE_TIERS: { min: number; max: number; rate: number }[] = [
  { min: 1, max: 10, rate: 0 }, // pre-threshold, never pays — exists only to supply width=10
  { min: 11, max: 25, rate: 20 },
  { min: 26, max: 50, rate: 25 },
  { min: 51, max: 100, rate: 30 },
  { min: 101, max: 200, rate: 40 },
  { min: 201, max: 500, rate: 50 },
];
const INSTITUTE_UNCAPPED_MIN = 501;
const INSTITUTE_UNCAPPED_RATE = 60;
const INSTITUTE_UNCAPPED_PRECEDING_WIDTH = 500 - 201 + 1; // width of the 201–500 band

interface CommissionResult {
  rate: number | null;
  commissionEarned: number;
}

// `n` is this referral's position in the partner's overall credited-referral
// sequence (previous credited count + 1).
const computeCommission = (
  n: number,
  partnerType: "INDIVIDUAL" | "INSTITUTE" | "CORPORATE",
  amount: number,
): CommissionResult => {
  if (partnerType === "INDIVIDUAL") {
    return { rate: 10, commissionEarned: Math.round((amount * 10) / 100) };
  }

  if (n > INSTITUTE_UNCAPPED_MIN) {
    // Inside the uncapped band, past its entry referral — flat per-referral.
    return {
      rate: INSTITUTE_UNCAPPED_RATE,
      commissionEarned: Math.round((amount * INSTITUTE_UNCAPPED_RATE) / 100),
    };
  }
  if (n === INSTITUTE_UNCAPPED_MIN) {
    // Entering the uncapped band — lump using the preceding (201–500) band's width.
    return {
      rate: INSTITUTE_UNCAPPED_RATE,
      commissionEarned: Math.round(
        INSTITUTE_UNCAPPED_PRECEDING_WIDTH *
          amount *
          (INSTITUTE_UNCAPPED_RATE / 100),
      ),
    };
  }

  const idx = INSTITUTE_TIERS.findIndex((t) => n >= t.min && n <= t.max);
  if (idx === -1) return { rate: null, commissionEarned: 0 }; // unreachable given the ranges above
  const tier = INSTITUTE_TIERS[idx];

  if (tier.rate === 0) return { rate: 0, commissionEarned: 0 }; // band 0 (1–10), never pays
  if (n !== tier.min) return { rate: tier.rate, commissionEarned: 0 }; // mid-band, not the entry referral

  const precedingTier = INSTITUTE_TIERS[idx - 1];
  const precedingWidth = precedingTier.max - precedingTier.min + 1;
  return {
    rate: tier.rate,
    commissionEarned: Math.round(precedingWidth * amount * (tier.rate / 100)),
  };
};

const generateUniqueReferralCode = async (
  partnerType: "INDIVIDUAL" | "INSTITUTE" | "CORPORATE",
): Promise<string> => {
  const prefix = partnerType === "INDIVIDUAL" ? "IND" : "INS";
  for (let i = 0; i < 5; i++) {
    const code = `${prefix}${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
    const existing = await prisma.partner.findUnique({
      where: { referralCode: code },
    });
    if (!existing) return code;
  }
  throw new ApiError(
    "Failed to generate a unique referral code",
    STATUS_CODES.SERVER_ERROR,
  );
};

export class PartnerService {
  async apply(userId: string, body: ApplyPartnerBody) {
    const existing = await prisma.partner.findUnique({ where: { userId } });

    if (existing) {
      throw new ApiError(
        "You have already applied for partnership with this account",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const data = {
      type: body.type,
      organizationName: body.organizationName ?? null,
      contactPerson: body.contactPerson ?? null,
      designation: body.designation ?? null,
      instituteType: body.instituteType ?? null,
      phone: body.phone,
      email: body.email,
      location: body.location || null,
      profession: body.profession || null,
      linkedin: body.linkedin || null,
      website: body.website || null,
      purpose: body.purpose,
      aadharNumber: body.aadharNumber || null,
      aadharFileUrl: body.aadharFileUrl || null,
      panNumber: body.panNumber || null,
      panFileUrl: body.panFileUrl || null,
      bankAccountNumber: body.bankAccountNumber || null,
      bankIfsc: body.bankIfsc || null,
      bankProofFileUrl: body.bankProofFileUrl || null,
    };

    const partner = await prisma.partner.create({ data: { userId, ...data } });

    await sendPartnerApplicationEmail(partner);
    return partner;
  }

  async getMine(userId: string) {
    return prisma.partner.findUnique({ where: { userId } });
  }

  async getMyReferrals(userId: string, take?: number, skip?: number) {
    const partner = await prisma.partner.findUnique({ where: { userId } });
    if (!partner)
      throw new ApiError("Partner profile not found", STATUS_CODES.NOT_FOUND);

    const referrals = await prisma.partnerReferral.findMany({
      where: { partnerId: partner.id },
      include: {
        referredUser: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });
    const totalRecords = await prisma.partnerReferral.count({
      where: { partnerId: partner.id },
    });
    return { referrals, totalRecords };
  }

  async claim(userId: string) {
    const partner = await prisma.partner.findUnique({ where: { userId } });
    if (!partner)
      throw new ApiError("Partner profile not found", STATUS_CODES.NOT_FOUND);
    if (partner.status !== "APPROVED") {
      throw new ApiError(
        "Only approved partners can claim payouts",
        STATUS_CODES.FORBIDDEN,
      );
    }
    if (partner.walletBalance <= 0) {
      throw new ApiError(
        "No balance available to claim",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const amount = partner.walletBalance;
    const [claimRecord] = await prisma.$transaction([
      prisma.partnerClaim.create({ data: { partnerId: partner.id, amount } }),
      prisma.partner.update({
        where: { id: partner.id },
        data: { walletBalance: 0 },
      }),
    ]);

    await sendPartnerClaimEmail(partner, amount);
    return claimRecord;
  }

  // Called from the Direct2Hire payment-confirmation path. Does NOT credit
  // anything yet — a refund is still possible within the enrollment's
  // refund window, so this only schedules the referral to be picked up by
  // the daily maturity sweep (processMaturedReferrals) 15 days from now.
  // Idempotent: a referral already scheduled (eligibleAt set) is left alone,
  // so repeat payment-confirm calls (e.g. admin re-clicking mark-paid) never
  // reset the clock. Non-throwing by contract — an unreferred user (the
  // overwhelming majority) is a cheap no-op.
  async scheduleReferralCredit(
    userId: string,
    direct2hireEnrollmentId: string,
    amount: number,
  ) {
    const referral = await prisma.partnerReferral.findFirst({
      where: { referredUserId: userId, creditedAt: null, eligibleAt: null },
    });
    if (!referral || amount <= 0) return;

    await prisma.partnerReferral.update({
      where: { id: referral.id },
      data: {
        direct2hireEnrollmentId,
        pendingAmount: amount,
        eligibleAt: getEligibleAt(),
      },
    });
  }

  // Daily sweep (see backend/src/jobs/partnerCommission.job.ts): finds every
  // referral whose 15-day hold has elapsed and either credits it (enrollment
  // still PAID) or permanently skips it (enrollment REFUNDED during the
  // hold — the refund policy's own window closes at day 7, well before the
  // 15-day hold ends, so a refund can no longer happen by the time this runs).
  async processMaturedReferrals(): Promise<{
    credited: number;
    refunded: number;
  }> {
    const due = await prisma.partnerReferral.findMany({
      where: {
        creditedAt: null,
        isRefunded: false,
        eligibleAt: { lte: new Date() },
      },
      include: {
        partner: { select: { id: true, type: true } },
        direct2hireEnrollment: { select: { status: true } },
      },
    });

    let credited = 0;
    let refunded = 0;

    // Sequential, not Promise.all — commission depends on the partner's
    // running credited-count, so concurrent processing of two due referrals
    // for the same partner could race and miscompute the tier.
    for (const referral of due) {
      if (referral.direct2hireEnrollment?.status === "REFUNDED") {
        await prisma.partnerReferral.update({
          where: { id: referral.id },
          data: { isRefunded: true },
        });
        refunded++;
        continue;
      }

      const priorCreditedCount = await prisma.partnerReferral.count({
        where: {
          partnerId: referral.partnerId,
          creditedAt: { not: null },
          isRefunded: false,
        },
      });
      const { rate, commissionEarned } = computeCommission(
        priorCreditedCount + 1,
        referral.partner.type,
        referral.pendingAmount ?? 0,
      );

      await prisma.$transaction([
        prisma.partnerReferral.update({
          where: { id: referral.id },
          data: {
            creditedAt: new Date(),
            commissionRate: rate,
            commissionEarned,
          },
        }),
        ...(commissionEarned > 0
          ? [
              prisma.partner.update({
                where: { id: referral.partnerId },
                data: { walletBalance: { increment: commissionEarned } },
              }),
            ]
          : []),
      ]);
      credited++;
    }

    return { credited, refunded };
  }
}

export class AdminPartnerService {
  async list(status?: string, type?: string, take?: number, skip?: number) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const partners = await prisma.partner.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });
    const totalRecords = await prisma.partner.count({ where });
    return { partners, totalRecords };
  }

  async getById(id: string) {
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        referrals: { orderBy: { createdAt: "desc" } },
        claims: { orderBy: { requestedAt: "desc" } },
      },
    });
    if (!partner)
      throw new ApiError("Partner not found", STATUS_CODES.NOT_FOUND);
    return partner;
  }

  async approve(id: string, note?: string) {
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner)
      throw new ApiError("Partner not found", STATUS_CODES.NOT_FOUND);
    if (partner.type === "CORPORATE") {
      throw new ApiError(
        "Corporate applications do not get a referral dashboard",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const referralCode =
      partner.referralCode ?? (await generateUniqueReferralCode(partner.type));
    return prisma.partner.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        referralCode,
        reviewNote: note || null,
      },
    });
  }

  async reject(id: string, note?: string) {
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner)
      throw new ApiError("Partner not found", STATUS_CODES.NOT_FOUND);
    return prisma.partner.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        reviewNote: note || null,
      },
    });
  }

  async listClaims(status?: string, take?: number, skip?: number) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const claims = await prisma.partnerClaim.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            type: true,
            organizationName: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { requestedAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });
    const totalRecords = await prisma.partnerClaim.count({ where });
    return { claims, totalRecords };
  }

  async markClaimPaid(claimId: string) {
    const claim = await prisma.partnerClaim.findUnique({
      where: { id: claimId },
    });
    if (!claim) throw new ApiError("Claim not found", STATUS_CODES.NOT_FOUND);
    return prisma.partnerClaim.update({
      where: { id: claimId },
      data: { status: "PAID", paidAt: new Date() },
    });
  }
}

export const partnerService = new PartnerService();

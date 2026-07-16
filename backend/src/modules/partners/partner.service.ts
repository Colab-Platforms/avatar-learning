import crypto from "crypto";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { sendPartnerApplicationEmail, sendPartnerClaimEmail } from "./partner.mail.js";
import { ApplyPartnerBody } from "./partner.types.js";

// Commission tiers — differ by partner type.
//
// INDIVIDUAL: flat 10% on every referral regardless of volume.
//
// INSTITUTE: no commission on the first 10 referrals (threshold to unlock).
//   From the 11th credited referral onward, tiers apply:
//   11–25  → 20%
//   26–50  → 25%
//   51–100 → 30%
//   101–200→ 40%
//   201–500→ 50%
//   501+   → 60%
//
// CORPORATE: no referral dashboard, never reaches this function.

const INSTITUTE_TIERS: { min: number; max: number; rate: number }[] = [
  { min: 11,  max: 25,       rate: 20 },
  { min: 26,  max: 50,       rate: 25 },
  { min: 51,  max: 100,      rate: 30 },
  { min: 101, max: 200,      rate: 40 },
  { min: 201, max: 500,      rate: 50 },
  { min: 501, max: Infinity, rate: 60 },
];

const getCommissionRate = (
  cumulativeCreditedCount: number,
  partnerType: "INDIVIDUAL" | "INSTITUTE" | "CORPORATE",
): number => {
  if (partnerType === "INDIVIDUAL") return 10;
  // cumulativeCreditedCount is already the new total (previous + 1)
  const tier = INSTITUTE_TIERS.find(
    (t) => cumulativeCreditedCount >= t.min && cumulativeCreditedCount <= t.max,
  );
  return tier?.rate ?? 0; // 0 for referrals 1–10 (below threshold)
};

const generateUniqueReferralCode = async (): Promise<string> => {
  for (let i = 0; i < 5; i++) {
    const code = crypto.randomBytes(6).toString("hex").toUpperCase();
    const existing = await prisma.partner.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }
  throw new ApiError("Failed to generate a unique referral code", STATUS_CODES.SERVER_ERROR);
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
    if (!partner) throw new ApiError("Partner profile not found", STATUS_CODES.NOT_FOUND);

    const referrals = await prisma.partnerReferral.findMany({
      where: { partnerId: partner.id },
      include: {
        referredUser: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });
    const totalRecords = await prisma.partnerReferral.count({ where: { partnerId: partner.id } });
    return { referrals, totalRecords };
  }

  async claim(userId: string) {
    const partner = await prisma.partner.findUnique({ where: { userId } });
    if (!partner) throw new ApiError("Partner profile not found", STATUS_CODES.NOT_FOUND);
    if (partner.status !== "APPROVED") {
      throw new ApiError("Only approved partners can claim payouts", STATUS_CODES.FORBIDDEN);
    }
    if (partner.walletBalance <= 0) {
      throw new ApiError("No balance available to claim", STATUS_CODES.BAD_REQUEST);
    }

    const amount = partner.walletBalance;
    const [claimRecord] = await prisma.$transaction([
      prisma.partnerClaim.create({ data: { partnerId: partner.id, amount } }),
      prisma.partner.update({ where: { id: partner.id }, data: { walletBalance: 0 } }),
    ]);

    await sendPartnerClaimEmail(partner, amount);
    return claimRecord;
  }

  // Called from the Direct2Hire payment-confirmation path. Non-throwing by
  // contract with callers other than internal bugs — a referred user who was
  // never actually referred (the overwhelming majority) is a cheap no-op.
  async creditReferralIfEligible(userId: string, amount: number) {
    const referral = await prisma.partnerReferral.findFirst({
      where: { referredUserId: userId, creditedAt: null },
      include: { partner: { select: { type: true } } },
    });
    if (!referral || amount <= 0) return;

    const creditedCount = await prisma.partnerReferral.count({
      where: { partnerId: referral.partnerId, creditedAt: { not: null } },
    });
    const rate = getCommissionRate(creditedCount + 1, referral.partner.type);
    const commissionEarned = Math.round((amount * rate) / 100);

    await prisma.$transaction([
      prisma.partnerReferral.update({
        where: { id: referral.id },
        data: { creditedAt: new Date(), commissionRate: rate, commissionEarned },
      }),
      prisma.partner.update({
        where: { id: referral.partnerId },
        data: { walletBalance: { increment: commissionEarned } },
      }),
    ]);
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
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
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
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        referrals: { orderBy: { createdAt: "desc" } },
        claims: { orderBy: { requestedAt: "desc" } },
      },
    });
    if (!partner) throw new ApiError("Partner not found", STATUS_CODES.NOT_FOUND);
    return partner;
  }

  async approve(id: string) {
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new ApiError("Partner not found", STATUS_CODES.NOT_FOUND);
    if (partner.type === "CORPORATE") {
      throw new ApiError(
        "Corporate applications do not get a referral dashboard",
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const referralCode = partner.referralCode ?? (await generateUniqueReferralCode());
    return prisma.partner.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date(), referralCode },
    });
  }

  async reject(id: string) {
    const partner = await prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new ApiError("Partner not found", STATUS_CODES.NOT_FOUND);
    return prisma.partner.update({
      where: { id },
      data: { status: "REJECTED", rejectedAt: new Date() },
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
    const claim = await prisma.partnerClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new ApiError("Claim not found", STATUS_CODES.NOT_FOUND);
    return prisma.partnerClaim.update({
      where: { id: claimId },
      data: { status: "PAID", paidAt: new Date() },
    });
  }
}

export const partnerService = new PartnerService();

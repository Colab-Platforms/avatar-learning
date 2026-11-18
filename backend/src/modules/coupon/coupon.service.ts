import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { Coupon } from "@prisma/client";

export interface CouponWithUsage extends Coupon {
  usedCount: number;
}

export interface CouponRedemption {
  orderId: string;
  userName: string;
  email: string | null;
  phoneNo: string | null;
  productType: string;
  amountPaid: number;
  discountAmount: number;
  paidAt: Date;
}

export class CouponService {
  async validateCoupon(code: string): Promise<Coupon> {
    const normalized = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
    if (!coupon || !coupon.isActive) {
      throw new ApiError("Invalid coupon code", STATUS_CODES.BAD_REQUEST);
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new ApiError("This coupon has expired", STATUS_CODES.BAD_REQUEST);
    }
    return coupon;
  }

  async list(): Promise<CouponWithUsage[]> {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { paymentOrders: { where: { status: "PAID" } } } },
      },
    });
    return coupons.map(({ _count, ...coupon }) => ({
      ...coupon,
      usedCount: _count.paymentOrders,
    }));
  }

  async getById(id: string): Promise<CouponWithUsage> {
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        _count: { select: { paymentOrders: { where: { status: "PAID" } } } },
      },
    });
    if (!coupon) throw new ApiError("Coupon not found", STATUS_CODES.NOT_FOUND);
    const { _count, ...rest } = coupon;
    return { ...rest, usedCount: _count.paymentOrders };
  }

  async getRedemptions(couponId: string): Promise<CouponRedemption[]> {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new ApiError("Coupon not found", STATUS_CODES.NOT_FOUND);

    const orders = await prisma.paymentOrder.findMany({
      where: { couponId, status: "PAID" },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phoneNo: true } },
      },
    });

    return orders.map((o) => ({
      orderId: o.id,
      userName: `${o.user.firstName ?? ""} ${o.user.lastName ?? ""}`.trim(),
      email: o.user.email,
      phoneNo: o.user.phoneNo,
      productType: o.productType,
      amountPaid: o.amount,
      discountAmount: o.discountAmount,
      paidAt: o.updatedAt,
    }));
  }

  async create(data: {
    code: string;
    discountPercent: number;
    expiresAt?: Date | null;
  }): Promise<Coupon> {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new ApiError("Coupon code already exists", STATUS_CODES.CONFLICT);
    }
    return prisma.coupon.create({
      data: {
        code,
        discountPercent: data.discountPercent,
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  async update(
    id: string,
    data: { discountPercent?: number; isActive?: boolean; expiresAt?: Date | null },
  ): Promise<Coupon> {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new ApiError("Coupon not found", STATUS_CODES.NOT_FOUND);
    return prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new ApiError("Coupon not found", STATUS_CODES.NOT_FOUND);
    await prisma.coupon.delete({ where: { id } });
  }
}

export const couponService = new CouponService();

import Razorpay from "razorpay";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { verifyRazorpaySignature } from "./payment.utils.js";
import type {
  CreateOrderResponse,
  RazorpayWebhookPayload,
} from "./payment.types.js";

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ApiError("Razorpay credentials not configured", STATUS_CODES.SERVER_ERROR);
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export class PaymentService {
  async createOrder(userId: string, courseId: string): Promise<CreateOrderResponse> {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
    if (!course.isPublished) throw new ApiError("Course is not available", STATUS_CODES.BAD_REQUEST);
    if (course.price <= 0) throw new ApiError("This course is free — use the enroll endpoint", STATUS_CODES.BAD_REQUEST);

    const existing = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw new ApiError("You are already enrolled in this course", STATUS_CODES.CONFLICT);

    // Check if there's already a pending order for this user+course to avoid duplicates
    const pendingOrder = await prisma.paymentOrder.findFirst({
      where: { userId, courseId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const razorpay = getRazorpay();
    const amountInPaise = course.price * 100;

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { courseId, userId },
    });

    // If a stale pending order exists, mark it failed before creating new one
    if (pendingOrder) {
      await prisma.paymentOrder.update({
        where: { id: pendingOrder.id },
        data: { status: "FAILED" },
      });
    }

    await prisma.paymentOrder.create({
      data: {
        userId,
        courseId,
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: "INR",
        status: "PENDING",
      },
    });

    return {
      orderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID!,
    };
  }

  async verifyPayment(
    userId: string,
    courseId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): Promise<void> {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new ApiError("Razorpay secret not configured", STATUS_CODES.SERVER_ERROR);

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      secret,
    );
    if (!isValid) throw new ApiError("Payment signature verification failed", STATUS_CODES.BAD_REQUEST);

    const order = await prisma.paymentOrder.findUnique({
      where: { razorpayOrderId },
    });
    if (!order) throw new ApiError("Payment order not found", STATUS_CODES.NOT_FOUND);
    if (order.userId !== userId) throw new ApiError("Unauthorized", STATUS_CODES.FORBIDDEN);
    if (order.courseId !== courseId) throw new ApiError("Course mismatch", STATUS_CODES.BAD_REQUEST);
    if (order.status === "PAID") throw new ApiError("Payment already processed", STATUS_CODES.CONFLICT);

    // Check idempotency — if this payment ID was already recorded
    const existingTx = await prisma.paymentTransaction.findUnique({
      where: { razorpayPaymentId },
    });
    if (existingTx) throw new ApiError("Payment already processed", STATUS_CODES.CONFLICT);

    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.create({
        data: {
          paymentOrderId: order.id,
          razorpayPaymentId,
          razorpaySignature,
          amount: order.amount,
          status: "SUCCESS",
        },
      });

      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      // Upsert enrollment — safe even if somehow already exists
      await tx.courseUserMapper.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {},
      });
    });
  }

  async handleWebhook(payload: RazorpayWebhookPayload): Promise<void> {
    const event = payload.event;

    if (event === "payment.captured") {
      const payment = payload.payload.payment?.entity;
      if (!payment) return;

      const order = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId: payment.order_id },
      });
      if (!order || order.status === "PAID") return;

      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { razorpayPaymentId: payment.id },
      });
      if (existingTx) return;

      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.create({
          data: {
            paymentOrderId: order.id,
            razorpayPaymentId: payment.id,
            razorpaySignature: "webhook",
            paymentMethod: payment.method,
            amount: payment.amount,
            status: "SUCCESS",
            metadata: payment.notes as object,
          },
        });

        await tx.paymentOrder.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });

        await tx.courseUserMapper.upsert({
          where: { userId_courseId: { userId: order.userId, courseId: order.courseId } },
          create: { userId: order.userId, courseId: order.courseId },
          update: {},
        });
      });
    }

    if (event === "payment.failed") {
      const payment = payload.payload.payment?.entity;
      if (!payment) return;

      const order = await prisma.paymentOrder.findUnique({
        where: { razorpayOrderId: payment.order_id },
      });
      if (!order || order.status !== "PENDING") return;

      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
    }

    if (event === "refund.processed") {
      const refund = payload.payload.refund?.entity;
      if (!refund) return;

      const tx = await prisma.paymentTransaction.findUnique({
        where: { razorpayPaymentId: refund.payment_id },
      });
      if (!tx) return;

      await prisma.$transaction(async (db) => {
        await db.paymentTransaction.update({
          where: { id: tx.id },
          data: { status: "REFUNDED" },
        });
        await db.paymentOrder.update({
          where: { id: tx.paymentOrderId },
          data: { status: "REFUNDED" },
        });
      });
    }
  }
}

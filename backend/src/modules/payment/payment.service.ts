import Razorpay from "razorpay";
import type { Prisma } from "@prisma/client";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { verifyRazorpaySignature } from "./payment.utils.js";
import { getPaymentProvider, getBackendBaseUrl } from "./payment.config.js";
import { getCashfree, getCashfreeEnvironment } from "./cashfree.client.js";
import {
  direct2hireService,
  DIRECT2HIRE_COMMISSION_BASE_AMOUNT,
} from "@/modules/direct2hire/direct2hire.service.js";
import { partnerService } from "@/modules/partners/partner.service.js";
import type {
  CreateOrderResponse,
  RazorpayWebhookPayload,
  CashfreeWebhookPayload,
  VerifyPaymentBody,
  VerifyCashfreePaymentBody,
  VerifyRazorpayPaymentBody,
  Direct2HireLeadInput,
} from "./payment.types.js";

const DIRECT2HIRE_PRICE_RUPEES = 1;

interface OrderContext {
  productType: "COURSE" | "DIRECT2HIRE";
  courseId?: string;
  direct2hireEnrollmentId?: string;
  description: string;
  returnPath: string;
}

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new ApiError(
      "Razorpay credentials not configured",
      STATUS_CODES.SERVER_ERROR,
    );
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function generateCashfreeOrderId(): string {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function markPendingOrderFailed(pendingOrderId: string): Promise<void> {
  await prisma.paymentOrder.update({
    where: { id: pendingOrderId },
    data: { status: "FAILED" },
  });
}

async function saveDirect2HireLead(
  userId: string,
  lead: Direct2HireLeadInput,
): Promise<void> {
  await prisma.direct2HireLead.upsert({
    where: { userId },
    create: { userId, ...lead, paymentCompleted: true },
    update: { ...lead, paymentCompleted: true },
  });
}

async function completePayment(params: {
  orderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  paymentMethod?: string;
  metadata?: object;
  lead?: Direct2HireLeadInput;
}): Promise<void> {
  const {
    orderId,
    gatewayPaymentId,
    gatewaySignature,
    paymentMethod,
    metadata,
    lead,
  } = params;

  const order = await prisma.paymentOrder.findUnique({
    where: { gatewayOrderId: orderId },
  });
  if (!order) return;

  // The webhook and the client-side verify call race to record the same payment.
  // Whichever arrives second must still persist the lead (if it carries one) even
  // though the transaction/enrollment were already written by the winner.
  if (order.status === "PAID") {
    if (lead && order.productType === "DIRECT2HIRE") {
      await saveDirect2HireLead(order.userId, lead);
    }
    return;
  }

  const existingTx = await prisma.paymentTransaction.findUnique({
    where: { gatewayPaymentId },
  });
  if (existingTx) {
    if (lead && order.productType === "DIRECT2HIRE") {
      await saveDirect2HireLead(order.userId, lead);
    }
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.create({
        data: {
          paymentOrderId: order.id,
          gatewayPaymentId,
          gatewaySignature,
          paymentMethod,
          amount: order.amount,
          status: "SUCCESS",
          metadata,
        },
      });

      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      if (
        order.productType === "DIRECT2HIRE" &&
        order.direct2hireEnrollmentId
      ) {
        await tx.direct2HireEnrollment.update({
          where: { id: order.direct2hireEnrollmentId },
          data: { status: "PAID" },
        });

        if (lead) {
          await tx.direct2HireLead.upsert({
            where: { userId: order.userId },
            create: { userId: order.userId, ...lead, paymentCompleted: true },
            update: { ...lead, paymentCompleted: true },
          });
        }
      } else if (order.courseId) {
        await tx.courseUserMapper.upsert({
          where: {
            userId_courseId: { userId: order.userId, courseId: order.courseId },
          },
          create: { userId: order.userId, courseId: order.courseId },
          update: {},
        });
      }
    });

    if (order.productType === "DIRECT2HIRE" && order.direct2hireEnrollmentId) {
      // Grant course access + credit any referring partner. Best-effort — a
      // hiccup here must never fail a payment that has already been captured.
      try {
        await direct2hireService.grantCourseAccess(order.userId);
        await partnerService.creditReferralIfEligible(
          order.userId,
          DIRECT2HIRE_COMMISSION_BASE_AMOUNT,
        );
      } catch (err) {
        console.error(
          "[Payment] Failed to grant D2H access / credit partner commission:",
          err,
        );
      }
    }
  } catch (err: any) {
    if (err.code === "P2002") {
      // Concurrent webhook/verify call already recorded this payment — safe to ignore,
      // but still try to save the lead since this call may be the one carrying it.
      if (lead && order.productType === "DIRECT2HIRE") {
        await saveDirect2HireLead(order.userId, lead);
      }
      return;
    }
    throw err;
  }
}

export class PaymentService {
  async createOrder(
    userId: string,
    courseId: string,
  ): Promise<CreateOrderResponse> {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);
    if (!course.isPublished)
      throw new ApiError("Course is not available", STATUS_CODES.BAD_REQUEST);
    if (course.price <= 0)
      throw new ApiError(
        "This course is free — use the enroll endpoint",
        STATUS_CODES.BAD_REQUEST,
      );

    const existing = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing)
      throw new ApiError(
        "You are already enrolled in this course",
        STATUS_CODES.CONFLICT,
      );

    const pendingOrder = await prisma.paymentOrder.findFirst({
      where: { userId, courseId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const provider = getPaymentProvider();
    const amountInPaise = course.price * 100;
    const ctx: OrderContext = {
      productType: "COURSE",
      courseId,
      description: course.title,
      returnPath: `/courses/${courseId}`,
    };

    if (provider === "cashfree") {
      return this.createCashfreeOrder(
        userId,
        ctx,
        course.price,
        amountInPaise,
        pendingOrder?.id,
      );
    }

    return this.createRazorpayOrder(
      userId,
      ctx,
      amountInPaise,
      pendingOrder?.id,
    );
  }

  async createDirect2HireOrder(userId: string): Promise<CreateOrderResponse> {
    const paidEnrollment = await prisma.direct2HireEnrollment.findFirst({
      where: { userId, status: "PAID" },
    });
    if (paidEnrollment) {
      throw new ApiError(
        "You have already enrolled in the Direct2Hire programme",
        STATUS_CODES.CONFLICT,
      );
    }

    let enrollment = await prisma.direct2HireEnrollment.findFirst({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    if (!enrollment) {
      enrollment = await prisma.direct2HireEnrollment.create({
        data: { userId },
      });
    }

    const pendingOrder = await prisma.paymentOrder.findFirst({
      where: {
        userId,
        direct2hireEnrollmentId: enrollment.id,
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    const provider = getPaymentProvider();
    const amountInPaise = DIRECT2HIRE_PRICE_RUPEES * 100;
    const ctx: OrderContext = {
      productType: "DIRECT2HIRE",
      direct2hireEnrollmentId: enrollment.id,
      description: "Direct2Hire Programme",
      returnPath: "/direct2hire",
    };

    if (provider === "cashfree") {
      return this.createCashfreeOrder(
        userId,
        ctx,
        DIRECT2HIRE_PRICE_RUPEES,
        amountInPaise,
        pendingOrder?.id,
      );
    }

    return this.createRazorpayOrder(
      userId,
      ctx,
      amountInPaise,
      pendingOrder?.id,
    );
  }

  private async createRazorpayOrder(
    userId: string,
    ctx: OrderContext,
    amountInPaise: number,
    pendingOrderId?: string,
  ): Promise<CreateOrderResponse> {
    const razorpay = getRazorpay();

    const notes: Record<string, string> = {
      userId,
      productType: ctx.productType,
    };
    if (ctx.courseId) notes.courseId = ctx.courseId;
    if (ctx.direct2hireEnrollmentId)
      notes.direct2hireEnrollmentId = ctx.direct2hireEnrollmentId;

    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes,
    });

    if (pendingOrderId) {
      await markPendingOrderFailed(pendingOrderId);
    }

    const orderData: Prisma.PaymentOrderUncheckedCreateInput = {
      userId,
      provider: "RAZORPAY",
      gatewayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      status: "PENDING",
      productType: ctx.productType,
      courseId: ctx.courseId,
      direct2hireEnrollmentId: ctx.direct2hireEnrollmentId,
    };
    await prisma.paymentOrder.create({ data: orderData });

    return {
      provider: "razorpay",
      orderId: rzpOrder.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID!,
    };
  }

  private async createCashfreeOrder(
    userId: string,
    ctx: OrderContext,
    amountInRupees: number,
    amountInPaise: number,
    pendingOrderId?: string,
  ): Promise<CreateOrderResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);

    const cashfree = getCashfree();
    const gatewayOrderId = generateCashfreeOrderId();
    const backendUrl = getBackendBaseUrl();
    const frontendUrl = (
      process.env.FRONTEND_URL ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    const customerPhone = user.phoneNo?.replace(/\D/g, "") || "9999999999";
    const customerName =
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Customer";

    let response;
    try {
      response = await cashfree.PGCreateOrder({
        order_id: gatewayOrderId,
        order_amount: amountInRupees,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_name: customerName,
          customer_email: user.email ?? undefined,
          customer_phone: customerPhone,
        },
        order_meta: {
          notify_url: `${backendUrl}/api/payment/webhook/cashfree`,
          return_url: `${frontendUrl}${ctx.returnPath}?payment=success&order_id={order_id}`,
        },
        order_note: ctx.description,
      });
    } catch (err: any) {
      const detail = err?.response?.data ?? err?.message ?? err;
      console.error(
        "[createCashfreeOrder] PGCreateOrder failed:",
        JSON.stringify(detail),
      );
      throw new ApiError(
        `Cashfree order creation failed: ${JSON.stringify(detail)}`,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const paymentSessionId = response.data.payment_session_id;
    if (!paymentSessionId) {
      throw new ApiError(
        "Failed to create Cashfree payment session",
        STATUS_CODES.SERVER_ERROR,
      );
    }

    if (pendingOrderId) {
      await markPendingOrderFailed(pendingOrderId);
    }

    const orderData: Prisma.PaymentOrderUncheckedCreateInput = {
      userId,
      provider: "CASHFREE",
      gatewayOrderId,
      amount: amountInPaise,
      currency: "INR",
      status: "PENDING",
      productType: ctx.productType,
      courseId: ctx.courseId,
      direct2hireEnrollmentId: ctx.direct2hireEnrollmentId,
    };
    await prisma.paymentOrder.create({ data: orderData });

    return {
      provider: "cashfree",
      orderId: gatewayOrderId,
      amount: amountInPaise,
      currency: "INR",
      paymentSessionId,
      mode: getCashfreeEnvironment(),
    };
  }

  async verifyRazorpayPayment(
    userId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    courseId?: string,
    lead?: Direct2HireLeadInput,
  ): Promise<void> {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret)
      throw new ApiError(
        "Razorpay secret not configured",
        STATUS_CODES.SERVER_ERROR,
      );

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      secret,
    );
    if (!isValid)
      throw new ApiError(
        "Payment signature verification failed",
        STATUS_CODES.BAD_REQUEST,
      );

    const order = await prisma.paymentOrder.findUnique({
      where: { gatewayOrderId: razorpayOrderId },
    });
    if (!order)
      throw new ApiError("Payment order not found", STATUS_CODES.NOT_FOUND);
    if (order.userId !== userId)
      throw new ApiError("Unauthorized", STATUS_CODES.FORBIDDEN);
    if (courseId && order.courseId !== courseId)
      throw new ApiError("Course mismatch", STATUS_CODES.BAD_REQUEST);
    if (order.status === "FAILED" || order.status === "REFUNDED") {
      throw new ApiError(
        "This payment order is no longer valid",
        STATUS_CODES.CONFLICT,
      );
    }

    // If the order is already PAID (the webhook can win the race against this
    // client-side call) completePayment() is still invoked below — it detects the
    // already-processed transaction and simply persists the lead, without
    // re-crediting anything.
    await completePayment({
      orderId: razorpayOrderId,
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature,
      lead,
    });
  }

  async verifyCashfreePayment(
    userId: string,
    orderId: string,
    courseId?: string,
    lead?: Direct2HireLeadInput,
  ): Promise<void> {
    console.log(
      `[verifyCashfreePayment] orderId=${orderId} userId=${userId} courseId=${courseId ?? "-"}`,
    );

    const order = await prisma.paymentOrder.findUnique({
      where: { gatewayOrderId: orderId },
    });
    if (!order)
      throw new ApiError("Payment order not found", STATUS_CODES.NOT_FOUND);
    if (order.userId !== userId)
      throw new ApiError("Unauthorized", STATUS_CODES.FORBIDDEN);
    if (courseId && order.courseId !== courseId)
      throw new ApiError("Course mismatch", STATUS_CODES.BAD_REQUEST);
    if (order.status === "PAID") return;

    const cashfree = getCashfree();
    let cfOrder: any;
    try {
      const response = await cashfree.PGFetchOrder(orderId);
      cfOrder = response.data;
      console.log(
        `[verifyCashfreePayment] Cashfree order_status=${cfOrder.order_status}`,
        JSON.stringify(cfOrder),
      );
    } catch (err: any) {
      const detail = err?.response?.data ?? err?.message ?? err;
      console.error(
        "[verifyCashfreePayment] PGFetchOrder failed:",
        JSON.stringify(detail),
      );
      throw new ApiError(
        `Cashfree order fetch failed: ${JSON.stringify(detail)}`,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    if (cfOrder.order_status !== "PAID") {
      console.warn(
        `[verifyCashfreePayment] order_status is "${cfOrder.order_status}", not PAID`,
      );
      throw new ApiError(
        `Payment not completed yet (status: ${cfOrder.order_status})`,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const paymentId = String(
      cfOrder.cf_payment_id ??
        cfOrder.payments?.[0]?.cf_payment_id ??
        cfOrder.payment_session_id ??
        orderId,
    );

    await completePayment({
      orderId,
      gatewayPaymentId: paymentId,
      gatewaySignature: "client-verify",
      metadata: { order_status: cfOrder.order_status },
      lead,
    });
  }

  async verifyPayment(userId: string, body: VerifyPaymentBody): Promise<void> {
    const provider = getPaymentProvider();

    if (provider === "cashfree") {
      const cashfreeBody = body as VerifyCashfreePaymentBody;
      await this.verifyCashfreePayment(
        userId,
        cashfreeBody.order_id,
        cashfreeBody.courseId,
        cashfreeBody.lead,
      );
      return;
    }

    const razorpayBody = body as VerifyRazorpayPaymentBody;
    await this.verifyRazorpayPayment(
      userId,
      razorpayBody.razorpay_order_id,
      razorpayBody.razorpay_payment_id,
      razorpayBody.razorpay_signature,
      razorpayBody.courseId,
      razorpayBody.lead,
    );
  }

  async handleRazorpayWebhook(payload: RazorpayWebhookPayload): Promise<void> {
    const event = payload.event;

    if (event === "payment.captured") {
      const payment = payload.payload.payment?.entity;
      if (!payment) return;

      await completePayment({
        orderId: payment.order_id,
        gatewayPaymentId: payment.id,
        gatewaySignature: "webhook",
        paymentMethod: payment.method,
        metadata: payment.notes as object,
      });
    }

    if (event === "payment.failed") {
      const payment = payload.payload.payment?.entity;
      if (!payment) return;

      const order = await prisma.paymentOrder.findUnique({
        where: { gatewayOrderId: payment.order_id },
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
        where: { gatewayPaymentId: refund.payment_id },
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

  async handleCashfreeWebhook(payload: CashfreeWebhookPayload): Promise<void> {
    const eventType = payload.type;
    const orderId = payload.data?.order?.order_id;
    if (!orderId) return;

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      const payment = payload.data.payment;
      if (!payment || payment.payment_status !== "SUCCESS") return;

      await completePayment({
        orderId,
        gatewayPaymentId: String(payment.cf_payment_id),
        gatewaySignature: "webhook",
        paymentMethod: payment.payment_group,
        metadata: payload.data as object,
      });
      return;
    }

    if (
      eventType === "PAYMENT_FAILED_WEBHOOK" ||
      eventType === "PAYMENT_USER_DROPPED_WEBHOOK"
    ) {
      const order = await prisma.paymentOrder.findUnique({
        where: { gatewayOrderId: orderId },
      });
      if (!order || order.status !== "PENDING") return;

      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: "FAILED" },
      });
    }
  }
}

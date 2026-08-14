import Razorpay from "razorpay";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { verifyRazorpaySignature } from "@/modules/payment/payment.utils.js";
import type { RazorpayWebhookPayload } from "@/modules/payment/payment.types.js";
import type {
  CreateWebinarOrderBody,
  CreateWebinarOrderResponse,
} from "./webinar.types.js";

const WEBINAR_PRICE_PAISE: number = process.env.WEBINAR_PRICE_PAISE
  ? parseInt(process.env.WEBINAR_PRICE_PAISE)
  : 700;

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

export class WebinarService {
  async createOrder(
    body: CreateWebinarOrderBody,
  ): Promise<CreateWebinarOrderResponse> {
    const { name, email, phoneNumber } = body;

    const paidRegistration = await prisma.webinarRegistration.findFirst({
      where: { email, status: "PAID" },
    });
    if (paidRegistration) {
      throw new ApiError(
        "You have already registered and paid for this webinar",
        STATUS_CODES.CONFLICT,
      );
    }

    // Reuse an existing PENDING registration for this email (e.g. retry after
    // an abandoned/failed payment attempt) instead of creating a new row.
    let registration = await prisma.webinarRegistration.findFirst({
      where: { email, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: WEBINAR_PRICE_PAISE,
      currency: "INR",
      receipt: `webinar_rcpt_${Date.now()}`,
      notes: { name, email, phoneNumber },
    });

    if (registration) {
      registration = await prisma.webinarRegistration.update({
        where: { id: registration.id },
        data: {
          name,
          phoneNumber,
          amount: WEBINAR_PRICE_PAISE,
          currency: "INR",
          razorpayOrderId: rzpOrder.id,
          razorpayPaymentId: null,
          razorpaySignature: null,
        },
      });
    } else {
      registration = await prisma.webinarRegistration.create({
        data: {
          name,
          email,
          phoneNumber,
          amount: WEBINAR_PRICE_PAISE,
          currency: "INR",
          status: "PENDING",
          razorpayOrderId: rzpOrder.id,
        },
      });
    }

    return {
      orderId: rzpOrder.id,
      amount: WEBINAR_PRICE_PAISE,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID!,
      registrationId: registration.id,
      name: registration.name,
      email: registration.email,
      phoneNumber: registration.phoneNumber,
    };
  }

  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
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

    const registration = await prisma.webinarRegistration.findUnique({
      where: { razorpayOrderId },
    });
    if (!registration)
      throw new ApiError(
        "Webinar registration not found",
        STATUS_CODES.NOT_FOUND,
      );

    // Already processed (e.g. duplicate verify call on refresh/retry) — no-op.
    if (registration.status === "PAID") return;

    if (registration.status === "FAILED" || registration.status === "REFUNDED") {
      throw new ApiError(
        "This registration is no longer valid",
        STATUS_CODES.CONFLICT,
      );
    }

    try {
      await prisma.webinarRegistration.update({
        where: { id: registration.id },
        data: {
          status: "PAID",
          razorpayPaymentId,
          razorpaySignature,
          paidAt: new Date(),
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        // Concurrent verify call already recorded this payment — safe to ignore.
        return;
      }
      throw err;
    }
  }

  // Fallback path for when the client never completes the /verify-payment call
  // (tab closed, network drop, app crash right after Razorpay captures the
  // charge). Razorpay still delivers the webhook independently of the
  // checkout.js `handler`, so this is the only guaranteed reconciliation path.
  // Shares the single /api/payment/webhook endpoint — payment.controller.ts
  // invokes this alongside PaymentService's own webhook handling, and this
  // silently no-ops for orderIds it doesn't recognise (i.e. non-webinar ones).
  async handleRazorpayWebhook(payload: RazorpayWebhookPayload): Promise<void> {
    const event = payload.event;

    if (event === "payment.captured") {
      const payment = payload.payload.payment?.entity;
      if (!payment) return;

      const registration = await prisma.webinarRegistration.findUnique({
        where: { razorpayOrderId: payment.order_id },
      });
      if (!registration || registration.status !== "PENDING") return;

      try {
        await prisma.webinarRegistration.update({
          where: { id: registration.id },
          data: {
            status: "PAID",
            razorpayPaymentId: payment.id,
            razorpaySignature: "webhook",
            paidAt: new Date(),
          },
        });
      } catch (err: any) {
        // Concurrent /verify-payment call already recorded this payment.
        if (err.code !== "P2002") throw err;
      }
      return;
    }

    if (event === "payment.failed") {
      const payment = payload.payload.payment?.entity;
      if (!payment) return;

      const registration = await prisma.webinarRegistration.findUnique({
        where: { razorpayOrderId: payment.order_id },
      });
      if (!registration || registration.status !== "PENDING") return;

      await prisma.webinarRegistration.update({
        where: { id: registration.id },
        data: { status: "FAILED" },
      });
    }
  }
}

export const webinarService = new WebinarService();

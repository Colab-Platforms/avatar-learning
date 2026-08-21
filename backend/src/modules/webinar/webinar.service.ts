import crypto from "crypto";
import Razorpay from "razorpay";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { verifyRazorpaySignature } from "@/modules/payment/payment.utils.js";
import type { RazorpayWebhookPayload } from "@/modules/payment/payment.types.js";
import {
  sendWebinarPaymentConfirmationEmail,
  sendWebinarRecoveryOtpEmail,
} from "./webinar.mail.js";
import { googleSheetsService } from "@/services/googleSheets.service.js";
import type {
  CreateWebinarOrderBody,
  CreateWebinarOrderResponse,
  AlreadyRegisteredResponse,
  WebinarRegistrationStatusResponse,
} from "./webinar.types.js";

const WEBINAR_PRICE_PAISE: number = process.env.WEBINAR_PRICE_PAISE
  ? parseInt(process.env.WEBINAR_PRICE_PAISE)
  : 700;

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashOtp = (otp: string): string =>
  crypto.createHash("sha256").update(otp).digest("hex");

const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

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
  ): Promise<CreateWebinarOrderResponse | AlreadyRegisteredResponse> {
    const { name, phoneNumber } = body;
    const email = normalizeEmail(body.email);

    const paidRegistration = await prisma.webinarRegistration.findFirst({
      where: { email, status: "PAID" },
    });
    if (paidRegistration) {
      // Already paid — let the frontend redirect straight to the success
      // page instead of creating a second Razorpay order.
      return { alreadyRegistered: true, registrationId: paidRegistration.id };
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
      const updated = await prisma.webinarRegistration.update({
        where: { id: registration.id },
        data: {
          status: "PAID",
          razorpayPaymentId,
          razorpaySignature,
          paidAt: new Date(),
        },
      });
      void sendWebinarPaymentConfirmationEmail(updated.email, {
        name: updated.name,
        amount: updated.amount,
        currency: updated.currency,
      });
      void googleSheetsService.appendWebinarRegistration({
        name: updated.name,
        email: updated.email,
        phoneNumber: updated.phoneNumber,
        amountPaid: updated.amount,
        paidAt: updated.paidAt ?? new Date(),
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
        const updated = await prisma.webinarRegistration.update({
          where: { id: registration.id },
          data: {
            status: "PAID",
            razorpayPaymentId: payment.id,
            razorpaySignature: "webhook",
            paidAt: new Date(),
          },
        });
        void sendWebinarPaymentConfirmationEmail(updated.email, {
          name: updated.name,
          amount: updated.amount,
          currency: updated.currency,
        });
        void googleSheetsService.appendWebinarRegistration({
          name: updated.name,
          email: updated.email,
          phoneNumber: updated.phoneNumber,
          amountPaid: updated.amount,
          paidAt: updated.paidAt ?? new Date(),
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

  async getRegistrationStatus(
    registrationId: string,
  ): Promise<WebinarRegistrationStatusResponse> {
    const registration = await prisma.webinarRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!registration)
      throw new ApiError(
        "Webinar registration not found",
        STATUS_CODES.NOT_FOUND,
      );

    return {
      registrationId: registration.id,
      status: registration.status,
      name: registration.name,
      amount: registration.amount,
      currency: registration.currency,
      paidAt: registration.paidAt,
    };
  }

  // Always resolves — never reveals whether an email is registered, to
  // prevent enumeration. Only actually sends an OTP when a PAID
  // registration exists for the email; PENDING/FAILED registrations are
  // better recovered via the normal /webinar retry flow.
  async requestRecoveryOtp(rawEmail: string): Promise<void> {
    const email = normalizeEmail(rawEmail);

    const registration = await prisma.webinarRegistration.findFirst({
      where: { email, status: "PAID" },
    });
    if (!registration) return;

    const otp = generateOtp();
    await prisma.otpVerification.create({
      data: {
        email,
        otpCode: hashOtp(otp),
        type: "WEBINAR_RECOVERY",
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    void sendWebinarRecoveryOtpEmail(email, otp);
  }

  async verifyRecoveryOtp(
    rawEmail: string,
    otp: string,
  ): Promise<{ registrationId: string }> {
    const email = normalizeEmail(rawEmail);

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email,
        type: "WEBINAR_RECOVERY",
        used: false,
        expiresAt: { gt: new Date() },
        otpCode: hashOtp(otp),
      },
      orderBy: { createdAt: "desc" },
    });
    if (!otpRecord)
      throw new ApiError("Invalid or expired code", STATUS_CODES.BAD_REQUEST);

    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const registration = await prisma.webinarRegistration.findFirst({
      where: { email, status: "PAID" },
      orderBy: { createdAt: "desc" },
    });
    if (!registration)
      throw new ApiError(
        "Webinar registration not found",
        STATUS_CODES.NOT_FOUND,
      );

    return { registrationId: registration.id };
  }
}

export const webinarService = new WebinarService();

export class AdminWebinarService {
  async getAll(
    take?: number,
    skip?: number,
    search?: string,
    status?: "PENDING" | "PAID" | "FAILED" | "REFUNDED",
  ) {
    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              {
                phoneNumber: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const registrations = await prisma.webinarRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(take !== undefined && { take }),
      ...(skip !== undefined && { skip }),
    });

    const totalRecords = await prisma.webinarRegistration.count({ where });
    return { registrations, totalRecords };
  }

  async getById(id: string) {
    const registration = await prisma.webinarRegistration.findUnique({
      where: { id },
    });
    if (!registration)
      throw new ApiError(
        "Webinar registration not found",
        STATUS_CODES.NOT_FOUND,
      );
    return registration;
  }
}

export const adminWebinarService = new AdminWebinarService();

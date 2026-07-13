import { ApiError } from "@/utils/ApiError.js";

export type PaymentGatewayProvider = "RAZORPAY" | "CASHFREE";

export interface PaymentInitiationResult {
  provider: PaymentGatewayProvider;
  orderId: string;
  amount: number;
  currency: string;
  status: "NOT_IMPLEMENTED";
}

/**
 * Placeholder payment service.
 * Real Razorpay/Cashfree integration will plug in here once KYC is complete.
 */
export class PaymentService {
  getProvider(): PaymentGatewayProvider {
    const provider = process.env.PAYMENT_PROVIDER?.toUpperCase();
    if (provider === "CASHFREE") return "CASHFREE";
    return "RAZORPAY";
  }

  async initiateDirect2HirePayment(
    _userId: string,
  ): Promise<PaymentInitiationResult> {
    throw new ApiError("Payment integration coming soon", 501);
  }

  async verifyPayment(_payload: Record<string, string>): Promise<void> {
    throw new ApiError("Payment verification is not implemented yet", 501);
  }
}

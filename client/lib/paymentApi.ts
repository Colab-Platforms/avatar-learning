import apiClient from "./apiClient";

export type PaymentProvider = "razorpay" | "cashfree";

export interface CreateOrderResponse {
  provider: PaymentProvider;
  orderId: string;
  amount: number;
  currency: string;
  key?: string;
  paymentSessionId?: string;
  mode?: "sandbox" | "production";
  discountAmount?: number;
}

export interface ApplyCouponResponse {
  code: string;
  discountPercent: number;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface Direct2HireLeadInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  institutionName: string;
  currentEducation: string;
  city: string;
  state: string;
}

export interface VerifyRazorpayPayload {
  courseId?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  lead?: Direct2HireLeadInput;
}

export interface VerifyCashfreePayload {
  courseId?: string;
  order_id: string;
  lead?: Direct2HireLeadInput;
}

export type VerifyPaymentPayload = VerifyRazorpayPayload | VerifyCashfreePayload;

export interface PaymentConfigResponse {
  provider: PaymentProvider;
}

export const getPaymentConfig = (): Promise<PaymentConfigResponse> =>
  apiClient.get("/payment/config").then((r) => r.data.data);

export const createPaymentOrder = (courseId: string): Promise<CreateOrderResponse> =>
  apiClient.post("/payment/create-order", { courseId }).then((r) => r.data.data);

export const verifyPayment = (payload: VerifyPaymentPayload): Promise<void> =>
  apiClient.post("/payment/verify", payload).then((r) => r.data);

export const createDirect2HireOrder = (
  couponCode?: string,
): Promise<CreateOrderResponse> =>
  apiClient
    .post("/direct2hire/create-order", couponCode ? { couponCode } : {})
    .then((r) => r.data.data);

export const applyCoupon = (code: string): Promise<ApplyCouponResponse> =>
  apiClient.post("/coupons/apply", { code }).then((r) => r.data.data);

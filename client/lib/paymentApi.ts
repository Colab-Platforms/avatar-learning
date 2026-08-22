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

export interface ReferralDiscountResponse {
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
  country: string;
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

export type Direct2HirePlan = "BASIC" | "STANDARD" | "PRO";

export const createDirect2HireOrder = (
  plan: Direct2HirePlan,
  couponCode?: string,
): Promise<CreateOrderResponse> =>
  apiClient
    .post("/direct2hire/create-order", {
      plan,
      ...(couponCode ? { couponCode } : {}),
    })
    .then((r) => r.data.data);

export const createAssessmentCounsellingOrder = (): Promise<CreateOrderResponse> =>
  apiClient
    .post("/direct2hire/assessment-counselling/create-order")
    .then((r) => r.data.data);

export const applyCoupon = (
  code: string,
  plan: Direct2HirePlan = "STANDARD",
): Promise<ApplyCouponResponse> =>
  apiClient.post("/coupons/apply", { code, plan }).then((r) => r.data.data);

export const getReferralDiscount = (
  plan: Direct2HirePlan = "STANDARD",
): Promise<ReferralDiscountResponse | null> =>
  apiClient
    .get("/direct2hire/referral-discount", { params: { plan } })
    .then((r) => r.data.data);

export interface CreateWebinarOrderInput {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface CreateWebinarOrderResponse {
  alreadyRegistered?: false;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  registrationId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface AlreadyRegisteredResponse {
  alreadyRegistered: true;
  registrationId: string;
}

export interface VerifyWebinarPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export type WebinarRegistrationStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface WebinarRegistrationStatusResponse {
  registrationId: string;
  status: WebinarRegistrationStatus;
  name: string;
  amount: number;
  currency: string;
  paidAt: string | null;
  webinarTitle: string | null;
  webinarScheduledAt: string | null;
  isLiveWebinar: boolean;
}

export const createWebinarOrder = (
  input: CreateWebinarOrderInput,
): Promise<CreateWebinarOrderResponse | AlreadyRegisteredResponse> =>
  apiClient.post("/webinar/create-order", input).then((r) => r.data.data);

export const verifyWebinarPayment = (
  payload: VerifyWebinarPaymentPayload,
): Promise<void> =>
  apiClient.post("/webinar/verify-payment", payload).then((r) => r.data);

export const getWebinarRegistrationStatus = (
  registrationId: string,
): Promise<WebinarRegistrationStatusResponse> =>
  apiClient
    .get(`/webinar/registration/${registrationId}/status`)
    .then((r) => r.data.data);

export const requestWebinarRecoveryOtp = (email: string): Promise<void> =>
  apiClient.post("/webinar/recovery/request-otp", { email }).then((r) => r.data);

export const verifyWebinarRecoveryOtp = (
  email: string,
  otp: string,
): Promise<{ registrationId: string }> =>
  apiClient
    .post("/webinar/recovery/verify-otp", { email, otp })
    .then((r) => r.data.data);

export interface WebinarLiveSchedule {
  id: string;
  title: string;
  scheduledAt: string;
  durationMinutes: number;
  meetLink: string | null;
  isPublished: boolean;
  isLive: boolean;
}

export const getLiveWebinarSchedule = (): Promise<WebinarLiveSchedule | null> =>
  apiClient.get("/webinar/live-schedule").then((r) => r.data.data);

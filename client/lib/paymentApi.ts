import apiClient from "./apiClient";

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

export interface VerifyPaymentPayload {
  courseId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const createPaymentOrder = (courseId: string): Promise<CreateOrderResponse> =>
  apiClient.post("/payment/create-order", { courseId }).then((r) => r.data.data);

export const verifyPayment = (payload: VerifyPaymentPayload): Promise<void> =>
  apiClient.post("/payment/verify", payload).then((r) => r.data);

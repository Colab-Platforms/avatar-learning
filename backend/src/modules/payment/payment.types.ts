export interface CreateOrderBody {
  courseId: string;
}

export interface VerifyRazorpayPaymentBody {
  courseId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyCashfreePaymentBody {
  courseId: string;
  order_id: string;
}

export type VerifyPaymentBody = VerifyRazorpayPaymentBody | VerifyCashfreePaymentBody;

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method?: string;
        notes?: Record<string, string>;
        error_code?: string;
        error_description?: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
      };
    };
  };
  created_at: number;
}

export interface CashfreeWebhookPayload {
  type: string;
  event_time: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
    };
    payment?: {
      cf_payment_id: string | number;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_message?: string;
      payment_group?: string;
    };
  };
}

export interface CreateOrderResponse {
  provider: "razorpay" | "cashfree";
  orderId: string;
  amount: number;
  currency: string;
  key?: string;
  paymentSessionId?: string;
  mode?: "sandbox" | "production";
}

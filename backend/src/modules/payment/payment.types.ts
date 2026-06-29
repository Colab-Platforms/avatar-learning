export interface CreateOrderBody {
  courseId: string;
}

export interface VerifyPaymentBody {
  courseId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

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

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

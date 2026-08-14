export interface CreateWebinarOrderBody {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface CreateWebinarOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  registrationId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface VerifyWebinarPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

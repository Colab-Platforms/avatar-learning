export interface CreateWebinarOrderBody {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface CreateWebinarOrderResponse {
  alreadyRegistered?: false;
  isFree?: false;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
  registrationId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

// Free webinar (priceInPaise === 0) — registration is confirmed immediately,
// there's no Razorpay order to open on the client.
export interface FreeWebinarRegistrationResponse {
  alreadyRegistered?: false;
  isFree: true;
  registrationId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface AlreadyRegisteredResponse {
  alreadyRegistered: true;
  registrationId: string;
}

export interface VerifyWebinarPaymentBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface WebinarRegistrationStatusResponse {
  registrationId: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  name: string;
  amount: number;
  currency: string;
  paidAt: Date | null;
  webinarTitle: string | null;
  webinarScheduledAt: Date | null;
  isLiveWebinar: boolean;
}

export interface RequestWebinarRecoveryOtpBody {
  email: string;
}

export interface VerifyWebinarRecoveryOtpBody {
  email: string;
  otp: string;
}

export interface WebinarScheduleResponse {
  id: string;
  title: string;
  scheduledAt: Date;
  durationMinutes: number;
  meetLink: string | null;
  priceInPaise: number;
  isPublished: boolean;
  isLive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateWebinarScheduleBody {
  title?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetLink?: string;
  priceInPaise?: number;
}

export interface UpdateWebinarScheduleBody {
  title?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  meetLink?: string;
  priceInPaise?: number;
}

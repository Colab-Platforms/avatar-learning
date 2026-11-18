export type PaymentProviderName = "razorpay" | "cashfree";

export function getPaymentProvider(): PaymentProviderName {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase();
  if (provider === "cashfree") return "cashfree";
  return "razorpay";
}

export function getBackendBaseUrl(): string {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL.replace(/\/$/, "");
  const port = process.env.PORT ?? "5000";
  return `http://localhost:${port}`;
}

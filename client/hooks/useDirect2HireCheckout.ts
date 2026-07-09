"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCashfree } from "@/hooks/useCashfree";
import { useCreateDirect2HireOrder } from "@/hooks/mutations/useCreateDirect2HireOrder";
import { useVerifyPayment } from "@/hooks/mutations/useVerifyPayment";
import { useDirect2HireStatus } from "@/hooks/queries/useDirect2HireStatus";
import { useAppSelector } from "@/store/hooks";
import type { CreateOrderResponse } from "@/lib/paymentApi";

type MessageType = "success" | "error";

export function useDirect2HireCheckout() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const razorpayLoaded = useRazorpay();
  const cashfreeLoaded = useCashfree();
  const { mutateAsync: createOrder } = useCreateDirect2HireOrder();
  const { mutateAsync: verifyPayment } = useVerifyPayment();
  const { data: statusData, refetch: refetchStatus } = useDirect2HireStatus(!!user);

  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: MessageType } | null>(null);

  const enrolled = statusData?.enrolled ?? false;

  const showMessage = (text: string, type: MessageType) => setMessage({ text, type });

  const handleRazorpayCheckout = useCallback(
    async (order: CreateOrderResponse) => {
      if (!user) return;

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Avatar India",
          description: "Direct2Hire Career Session",
          order_id: order.orderId,
          prefill: {
            name: `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim(),
            email: (user as any).email ?? "",
          },
          theme: { color: "#00C8FF" },
          retry: { enabled: true, max_count: 3 },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              await refetchStatus();
              showMessage(
                "Payment successful! Our team will reach out on WhatsApp shortly.",
                "success",
              );
              resolve();
            } catch (verifyErr: unknown) {
              const e = verifyErr as { response?: { data?: { message?: string } } };
              reject(new Error(e?.response?.data?.message ?? "Payment verification failed"));
            }
          },
          modal: {
            ondismiss: () => reject(new Error("cancelled")),
          },
        });

        rzp.open();
      });
    },
    [user, verifyPayment, refetchStatus],
  );

  const handleCashfreeCheckout = useCallback(
    async (order: CreateOrderResponse) => {
      if (!order.paymentSessionId) {
        throw new Error("Missing Cashfree payment session");
      }
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded");
      }

      const cashfree = window.Cashfree({ mode: order.mode ?? "sandbox" });
      const result = await cashfree.checkout({
        paymentSessionId: order.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Payment failed");
      }

      await verifyPayment({ order_id: order.orderId });
      await refetchStatus();
      showMessage("Payment successful! Our team will reach out on WhatsApp shortly.", "success");
    },
    [verifyPayment, refetchStatus],
  );

  const enroll = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (enrolled) {
      showMessage("You're already enrolled in the Direct2Hire programme.", "success");
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const order = await createOrder();

      if (order.provider === "cashfree") {
        if (!cashfreeLoaded) {
          showMessage("Payment SDK is still loading. Please try again.", "error");
          return;
        }
        await handleCashfreeCheckout(order);
        return;
      }

      if (!razorpayLoaded) {
        showMessage("Payment SDK is still loading. Please try again.", "error");
        return;
      }
      await handleRazorpayCheckout(order);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg =
        e?.response?.data?.message ?? (err instanceof Error ? err.message : "Payment failed");
      if (msg === "cancelled") {
        showMessage("Payment was cancelled.", "error");
      } else {
        showMessage(msg, "error");
      }
    } finally {
      setProcessing(false);
    }
  }, [
    user,
    enrolled,
    router,
    createOrder,
    cashfreeLoaded,
    razorpayLoaded,
    handleCashfreeCheckout,
    handleRazorpayCheckout,
  ]);

  return { enroll, processing, message, enrolled };
}

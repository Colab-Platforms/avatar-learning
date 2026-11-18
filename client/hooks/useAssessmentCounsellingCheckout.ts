"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCashfree } from "@/hooks/useCashfree";
import { useCreateAssessmentCounsellingOrder } from "@/hooks/mutations/useCreateAssessmentCounsellingOrder";
import { useVerifyPayment } from "@/hooks/mutations/useVerifyPayment";
import { useD2HStatus } from "@/hooks/queries/useD2HStatus";
import { useAppSelector } from "@/store/hooks";
import type { CreateOrderResponse } from "@/lib/paymentApi";

type MessageType = "success" | "error";

const RAZORPAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const RAZORPAY_TIMEOUT_SECONDS = RAZORPAY_TIMEOUT_MS / 1000;

export function useAssessmentCounsellingCheckout() {
  const router = useRouter();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);

  const razorpayLoaded = useRazorpay();
  const cashfreeLoaded = useCashfree();
  const { mutateAsync: createOrder } = useCreateAssessmentCounsellingOrder();
  const { mutateAsync: verifyPayment } = useVerifyPayment();
  const { data: statusData, refetch: refetchStatus } = useD2HStatus({
    enabled: hasHydrated && Boolean(user),
  });

  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: MessageType;
  } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RAZORPAY_TIMEOUT_SECONDS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enrolled = statusData?.enrollment?.hasAssessmentCounsellingAccess ?? false;

  const showMessage = (text: string, type: MessageType) =>
    setMessage({ text, type });

  useEffect(() => {
    if (!processing) {
      setSecondsLeft(RAZORPAY_TIMEOUT_SECONDS);
      return;
    }
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [processing, secondsLeft]);

  const handleRazorpayCheckout = useCallback(
    async (order: CreateOrderResponse) => {
      if (!user) return;

      await new Promise<void>((resolve, reject) => {
        const settle = (fn: () => void) => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          fn();
        };

        const rzp = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "Avatar India",
          description: "Direct2Hire Assessment + Counselling",
          order_id: order.orderId,
          prefill: {
            name: `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim(),
            email: (user as any).email ?? "",
            contact: (user as any).phoneNo ?? "",
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
                "Payment successful! Redirecting to your dashboard…",
                "success",
              );
              settle(resolve);
            } catch (verifyErr: unknown) {
              const e = verifyErr as {
                response?: { data?: { message?: string } };
              };
              settle(() =>
                reject(
                  new Error(
                    e?.response?.data?.message ?? "Payment verification failed",
                  ),
                ),
              );
            }
          },
          modal: {
            ondismiss: () => settle(() => reject(new Error("cancelled"))),
          },
        });

        timeoutRef.current = setTimeout(() => {
          settle(() => {
            rzp.close();
            reject(new Error("timeout"));
          });
        }, RAZORPAY_TIMEOUT_MS);

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
      showMessage(
        "Payment successful! Redirecting to your dashboard…",
        "success",
      );
    },
    [verifyPayment, refetchStatus],
  );

  const enroll = useCallback(async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (enrolled) {
      showMessage(
        "You already have Assessment + Counselling access.",
        "success",
      );
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const order = await createOrder();

      if (order.provider === "cashfree") {
        if (!cashfreeLoaded) {
          showMessage(
            "Payment SDK is still loading. Please try again.",
            "error",
          );
          return;
        }
        await handleCashfreeCheckout(order);
      } else {
        if (!razorpayLoaded) {
          showMessage(
            "Payment SDK is still loading. Please try again.",
            "error",
          );
          return;
        }
        await handleRazorpayCheckout(order);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      const msg =
        e?.response?.data?.message ??
        (err instanceof Error ? err.message : "Payment failed");
      if (msg === "cancelled") {
        showMessage(
          "Payment was cancelled. You can retry anytime — your order is still pending.",
          "error",
        );
      } else if (msg === "timeout") {
        showMessage(
          "Payment is taking longer than expected. If money was deducted, it will reflect shortly — otherwise please retry.",
          "error",
        );
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

  return { enroll, processing, message, enrolled, secondsLeft };
}

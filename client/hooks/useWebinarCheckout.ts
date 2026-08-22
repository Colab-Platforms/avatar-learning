"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCreateWebinarOrder } from "@/hooks/mutations/useCreateWebinarOrder";
import { useVerifyWebinarPayment } from "@/hooks/mutations/useVerifyWebinarPayment";
import { setStoredWebinarRegistrationId } from "@/lib/webinarStorage";
import type { CreateWebinarOrderInput } from "@/lib/paymentApi";

type MessageType = "success" | "error";

const RAZORPAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export function useWebinarCheckout() {
  const router = useRouter();
  const razorpayLoaded = useRazorpay();
  const { mutateAsync: createOrder } = useCreateWebinarOrder();
  const { mutateAsync: verifyPayment } = useVerifyWebinarPayment();

  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: MessageType;
  } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = (text: string, type: MessageType) =>
    setMessage({ text, type });

  const register = useCallback(
    async (input: CreateWebinarOrderInput) => {
      if (!razorpayLoaded) {
        showMessage("Payment SDK is still loading. Please try again.", "error");
        return;
      }

      setProcessing(true);
      setMessage(null);

      try {
        const order = await createOrder(input);

        if (order.alreadyRegistered) {
          setStoredWebinarRegistrationId(order.registrationId);
          router.replace(`/webinar?registrationId=${order.registrationId}`, { scroll: false });
          return;
        }

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
            description: "AI Webinar Seat Reservation",
            order_id: order.orderId,
            prefill: {
              name: order.name,
              email: order.email,
              contact: order.phoneNumber,
            },
            theme: { color: "#1E6BFA" },
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
                setStoredWebinarRegistrationId(order.registrationId);
                settle(() => {
                  resolve();
                  router.replace(`/webinar?registrationId=${order.registrationId}`, { scroll: false });
                });
              } catch (verifyErr: unknown) {
                const e = verifyErr as {
                  response?: { data?: { message?: string } };
                };
                settle(() =>
                  reject(
                    new Error(
                      e?.response?.data?.message ??
                        "Payment verification failed",
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
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        const msg =
          e?.response?.data?.message ??
          (err instanceof Error ? err.message : "Payment failed");
        if (msg === "cancelled") {
          showMessage(
            "Payment was cancelled. You can retry anytime — your seat is still held.",
            "error",
          );
        } else if (msg === "timeout") {
          showMessage(
            "Payment is taking longer than expected. If money was deducted, please contact support — otherwise retry.",
            "error",
          );
        } else {
          showMessage(msg, "error");
        }
      } finally {
        setProcessing(false);
      }
    },
    [razorpayLoaded, createOrder, verifyPayment, router],
  );

  return { register, processing, message };
}

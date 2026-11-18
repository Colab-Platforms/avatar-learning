"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { ApiResponse } from "@/types/index";

interface Msg91Config {
  widgetId: string;
  tokenAuth: string;
}

interface Msg91PhoneWidgetProps {
  phoneNo: string;
  onVerified: (accessToken: string) => void;
  onError: (message: string) => void;
}

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
  }
}

const SCRIPT_URLS = [
  "https://verify.msg91.com/otp-provider.js",
  "https://verify.phone91.com/otp-provider.js",
];

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

function loadMsg91Script(): Promise<void> {
  if (typeof window.initSendOTP === "function") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let index = 0;

    const attempt = () => {
      const script = document.createElement("script");
      script.src = SCRIPT_URLS[index];
      script.async = true;
      script.onload = () => {
        if (typeof window.initSendOTP === "function") {
          resolve();
        } else {
          reject(new Error("MSG91 widget failed to initialize."));
        }
      };
      script.onerror = () => {
        index += 1;
        if (index < SCRIPT_URLS.length) {
          attempt();
        } else {
          reject(new Error("Failed to load MSG91 verification widget."));
        }
      };
      document.head.appendChild(script);
    };

    attempt();
  });
}

export function Msg91PhoneWidget({ phoneNo, onVerified, onError }: Msg91PhoneWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const onVerifiedRef = useRef(onVerified);
  const onErrorRef = useRef(onError);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onVerifiedRef.current = onVerified;
    onErrorRef.current = onError;
  }, [onVerified, onError]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data: res } = await apiClient.get<ApiResponse<Msg91Config>>("/auth/msg91-config");
        console.log("MSG91 Config Response:", res);
        if (!res.data?.widgetId || !res.data?.tokenAuth) {
          throw new Error("Phone verification is not configured.");
        }

        await loadMsg91Script();
        if (cancelled || initializedRef.current) return;

        initializedRef.current = true;

        window.initSendOTP?.({
          widgetId: res.data.widgetId,
          tokenAuth: res.data.tokenAuth,
          identifier: normalizePhone(phoneNo),
          exposeMethods: false,
          success: (data: { message?: string }) => {
            const token = data?.message;
            if (!token) {
              onErrorRef.current("Phone verification succeeded but no token was returned.");
              return;
            }
            onVerifiedRef.current(token);
          },
          failure: (error: unknown) => {
            const message =
              typeof error === "string"
                ? error
                : error && typeof error === "object" && "message" in error
                  ? String((error as { message: unknown }).message)
                  : "Phone verification failed. Please try again.";
            onErrorRef.current(message);
          },
        });

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load phone verification.";
        setLoadError(message);
        setLoading(false);
        onErrorRef.current(message);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [phoneNo]);

  if (loadError) {
    return (
      <p className="text-[13px] text-red-400 text-center">{loadError}</p>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
        </div>
      )}
      <div ref={containerRef} className={loading ? "hidden" : "min-h-[120px]"} />
    </div>
  );
}

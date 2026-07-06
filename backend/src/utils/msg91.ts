import axios from "axios";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_WIDGET_ID = process.env.MSG91_WIDGET_ID;
const MSG91_TOKEN_AUTH = process.env.MSG91_TOKEN_AUTH;

if (!MSG91_AUTH_KEY) {
    console.warn("[MSG91] MSG91_AUTH_KEY not found in environment variables.");
}

const MSG91_CONTROL_BASE = "https://control.msg91.com/api/v5";
const MSG91_REQUEST_TIMEOUT = 5000;

export interface Msg91WidgetConfig {
    widgetId: string;
    tokenAuth: string;
}

export interface Msg91VerifyResult {
    success: boolean;
    mobile?: string;
    message?: string;
}

//normalizes a phone number to the format expected by MSG91 (e.g., "919876543210" for an Indian number).
export const normalizePhoneNumber = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, "");

    if (cleaned.length === 10) {
        return `91${cleaned}`;
    }

    return cleaned;
};

export const getMsg91WidgetConfig = (): Msg91WidgetConfig | null => {
    if (!MSG91_WIDGET_ID || !MSG91_TOKEN_AUTH) {
        return null;
    }

    return {
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
    };
};

/**
 * Server-side validation of MSG91 widget access token (from otp.js / index.html flow).
 */
export const verifyMsg91AccessToken = async (accessToken: string): Promise<Msg91VerifyResult> => {
    if (!MSG91_AUTH_KEY) {
        return { success: false, message: "MSG91 is not configured on the server." };
    }

    if (!accessToken) {
        return { success: false, message: "Access token is required." };
    }

    try {
        const response = await axios.post(
            `${MSG91_CONTROL_BASE}/widget/verifyAccessToken`,
            {
                authkey: MSG91_AUTH_KEY,
                "access-token": accessToken,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: MSG91_REQUEST_TIMEOUT,
            }
        );

        const data = response.data;

        if (response.status === 200 && data?.type === "success") {
            const mobile =
                data.mobile ??
                data.phone ??
                data.identifier ??
                data.data?.mobile ??
                data.data?.phone;

            return {
                success: true,
                mobile: typeof mobile === "string" ? mobile : undefined,
                message: data.message,
            };
        }

        return {
            success: false,
            message: data?.message ?? "Invalid or expired phone verification token.",
        };
    } catch (error: any) {
        console.error("[MSG91] verifyAccessToken failed:", error.response?.data ?? error.message);
        return {
            success: false,
            message: error.response?.data?.message ?? "Phone verification failed.",
        };
    }
};
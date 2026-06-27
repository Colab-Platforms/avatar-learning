import axios from "axios";

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_WIDGET_ID = process.env.MSG91_WIDGET_ID;

if (!MSG91_AUTH_KEY) {
    console.warn("[MSG91] MSG91_AUTH_KEY not found in environment variables. SMS OTP will be skipped.");
}

const MSG91_CONTROL_BASE = "https://control.msg91.com/api/v5";
const MSG91_API_BASE = "https://api.msg91.com/api/v5";
const MSG91_REQUEST_TIMEOUT = 5000;

/**
 * Normalizes phone number to strict format: '919819121547'
 * Keeps or prepends the country code (no leading + symbols)
 */
const normalizePhoneNumber = (phoneNumber: string): string => {
    const cleaned = phoneNumber.replace(/\D/g, "");

    // If it's a bare 10-digit Indian number, prepend '91'
    if (cleaned.length === 10) {
        return `91${cleaned}`;
    }

    return cleaned;
};

export const sendOtpSms = async (phoneNumber: string, otp: string): Promise<boolean> => {
    if (!MSG91_AUTH_KEY) {
        console.warn(`[MSG91] Skipping SMS to ${phoneNumber} — MSG91_AUTH_KEY not configured`);
        return false;
    }

    if (!phoneNumber) {
        console.warn(`[MSG91] Skipping SMS — no phone number provided`);
        return false;
    }

    // Now properly yields '919819121547'
    const normalizedPhone = normalizePhoneNumber(phoneNumber); 

    if (!normalizedPhone || normalizedPhone.length < 11) {
        console.warn(`[MSG91] Invalid phone length configuration: ${phoneNumber} (normalized: ${normalizedPhone})`);
        return false;
    }

    // ==========================================
    // PATHWAY 1: MSG91 WIDGET API (MSG91 Generates the OTP)
    // ==========================================
    if (MSG91_WIDGET_ID) {
        try {
            console.log(`[MSG91] Trying widget endpoint for: ${normalizedPhone}`);
            const widgetUrl = `${MSG91_CONTROL_BASE}/widget/sendOtp/${MSG91_WIDGET_ID}`;
            
            const widgetResponse = await axios.post(
                widgetUrl,
                { invisible: 0, mobile: normalizedPhone },
                {
                    headers: {
                        "authkey": MSG91_AUTH_KEY,
                        "Content-Type": "application/json",
                    },
                    timeout: MSG91_REQUEST_TIMEOUT,
                }
            );

            console.log(`[MSG91 Widget Response]`, widgetResponse.data);

            if (widgetResponse.data?.type === "success") {
                console.log(`[MSG91 Success] Managed OTP sent via widget to ${normalizedPhone}`);
                return true;
            }
            console.warn(`[MSG91] Widget explicitly rejected parameters:`, widgetResponse.data);
        } catch (widgetErr: any) {
            console.warn(`[MSG91] Widget endpoint failed, transferring to standard fallback:`, widgetErr.message);
        }
    }

    // ==========================================
    // PATHWAY 2: STANDARD FALLBACK (Using default MSG91 template)
    // ==========================================
    try {
        console.log(`[MSG91] Trying standard OTP endpoint with default template for: ${normalizedPhone}`);

        // Use standard /otp/send endpoint with POST body (no DLT required with default template)
        const otpUrl = `${MSG91_API_BASE}/otp/send`;

        const response = await axios.post(
            otpUrl,
            {
                mobile: normalizedPhone,
                otp: otp,
                template_id: "default" // Use MSG91's default template (no DLT required)
            },
            {
                headers: {
                    "authkey": MSG91_AUTH_KEY,
                    "Content-Type": "application/json"
                },
                timeout: MSG91_REQUEST_TIMEOUT,
            }
        );

        console.log(`[MSG91 OTP Response]`, response.data);

        if (response.data?.type === "success" || response.data?.status === "success") {
            console.log(`[MSG91 Success] OTP sent successfully using default template: ${normalizedPhone}`);
            return true;
        }

        console.error(`[MSG91 Error] Unexpected response:`, response.data);
        return false;
    } catch (error: any) {
        console.error(`[MSG91 Error] Failed to send OTP:`, error.response?.data || error.message);
        return false;
    }
};
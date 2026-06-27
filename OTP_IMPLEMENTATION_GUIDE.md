# MSG91 OTP Implementation Guide

## Overview
The OTP system now sends OTPs via both **email** (Resend) and **SMS** (MSG91) simultaneously. Email OTP is fully functional and tested. SMS integration is implemented with fallback mechanisms.

**Status:** ✅ Email OTP working | 🔧 SMS requires MSG91 account configuration

## Files Modified

### 1. **`backend/src/utils/msg91.ts`** (NEW)
- Utility functions for MSG91 SMS OTP sending and verification
- Functions:
  - `sendOtpSms(phoneNumber, otp)` - Sends OTP via SMS
  - `verifyOtpMsg91(phoneNumber, otp)` - Verifies OTP (for future use)

### 2. **`backend/src/modules/auth/auth.service.ts`** (UPDATED)
- Updated `register()` - Now sends both email and SMS OTP
- Updated `login()` - Now sends both email and SMS OTP when email not verified
- Updated `resendOtp()` - Now resends both email and SMS OTP
- New method `testOtpSending(email, phoneNo, otpType)` - For testing OTP delivery

### 3. **`backend/src/modules/auth/auth.controller.ts`** (UPDATED)
- New endpoint handler `testOtpSending` for testing OTP delivery

### 4. **`backend/src/modules/auth/auth.route.ts`** (UPDATED)
- New route: `POST /api/auth/test-otp` for testing OTP sending

### 5. **`backend/.env`** (UPDATED)
- Added `MSG91_AUTH_KEY=545210AMvF3Mt56a3f734eP1`

## Environment Variables Required

```
MSG91_AUTH_KEY=545210AMvF3Mt56a3f734eP1
RESEND_API_KEY=re_T9Ux2Zsf_J3YZYbTPa7aJws7sUEz4Xbeh
SMTP_FROM_EMAIL=support@avatarindia.com
```

## Testing

### Test Endpoint
**Endpoint:** `POST http://localhost:5000/api/auth/test-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNo": "919876543210",
  "otpType": "REGISTER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "otp": "123456",
    "email": {
      "success": true,
      "message": "Email OTP sent successfully"
    },
    "sms": {
      "success": true,
      "message": "SMS OTP sent successfully"
    },
    "message": "Test OTP: 123456\n\nEmail: Email OTP sent successfully\nSMS: SMS OTP sent successfully"
  },
  "message": "Test OTP sent successfully",
  "statusCode": 200
}
```

### Using cURL
```bash
curl -X POST http://localhost:5000/api/auth/test-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phoneNo": "919876543210",
    "otpType": "REGISTER"
  }'
```

### Using Postman
1. Create a POST request to `http://localhost:5000/api/auth/test-otp`
2. Set Header: `Content-Type: application/json`
3. Body (raw JSON):
```json
{
  "email": "your-email@example.com",
  "phoneNo": "91XXXXXXXXXX",
  "otpType": "REGISTER"
}
```

## OTP Flow

### Registration
1. User calls `POST /api/auth/register` with email, password, phoneNo
2. System generates OTP and sends via:
   - **Email** via Resend
   - **SMS** via MSG91
3. User receives OTP on both channels
4. User verifies OTP via `POST /api/auth/verify-otp`

### Login (for unverified email)
1. User calls `POST /api/auth/login` with email and password
2. If email not verified, system generates OTP and sends via:
   - **Email** via Resend
   - **SMS** via MSG91
3. User verifies OTP via `POST /api/auth/verify-otp`

### Resend OTP
1. User calls `POST /api/auth/resend-otp`
2. System resends OTP via both channels

## Notes

- **Phone Number Format:** Use Indian format with country code (e.g., `919876543210` for +91-98765-43210)
- **OTP Expiry:** 10 minutes
- **SMS Graceful Fallback:** If MSG91 fails, email OTP is still sent
- **Test Endpoint:** Returns the actual OTP in response (only for testing/development)
- **Production:** Never return the OTP in the response; only show success/failure status

## MSG91 Account Setup

### For SMS to work, ensure:
1. **Active MSG91 Account** with SMS sending permissions
2. **Valid Auth Key** (already configured: `MSG91_AUTH_KEY`)
3. **One of two options:**
   - **Widget-based** (Recommended): Configure `MSG91_WIDGET_ID` in `.env` for pre-configured OTP delivery
   - **Standard OTP API**: Uses `/api/v5/otp/send` endpoint (requires OTP templates setup in MSG91)
4. **India-based phone numbers** format: `91XXXXXXXXXX`

### If SMS fails:
- Email OTP will still be sent successfully (primary channel)
- Check MSG91 dashboard for account status and API limits
- Verify phone number format is correct (`91` prefix for India)
- Ensure account has SMS quota remaining

## Logging

All OTP operations are logged with `[MSG91]` and `[Auth]` prefixes:
- `[MSG91] Sending OTP SMS to: <phone>`
- `[MSG91 Widget Response]` or `[MSG91 OTP Response]` — actual API response
- `[MSG91 Success] OTP sent to <phone>`
- `[MSG91 Error] Failed to send OTP`
- `[Auth] Failed to send registration OTP SMS` — gracefully handled, email still sent

## Troubleshooting SMS

### SMS not sending but email works:
1. Check browser console / server logs for `[MSG91 Error]` messages
2. Verify `MSG91_AUTH_KEY` is correct in `.env`
3. Test with `/api/auth/test-otp` endpoint to see detailed error responses
4. Ensure phone number starts with `91` for Indian numbers

### Get detailed response in test endpoint:
The test endpoint returns both email and SMS results separately:
```json
{
  "sms": {
    "success": false,
    "message": "SMS API returned false"
  }
}
```

Check server logs for the actual `[MSG91 Error]` message.

## Production Notes
- **Never expose OTP in response** for production (test endpoint is development-only)
- **Implement rate limiting** on `/test-otp` endpoint or remove it
- **Monitor MSG91 usage** to avoid quota exhaustion
- **Graceful degradation**: Email OTP ensures users can always register/login even if SMS fails

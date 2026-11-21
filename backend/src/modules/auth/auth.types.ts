export interface RegisterBody {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNo: string;
    state: string;
    country: string;
    city: string;
    referralCode?: string;
}

export interface LoginBody {
    email: string;
    password: string;
    /**
     * The password exactly as typed (read from the raw request body). The global XSS sanitizer rewrites `<` and `>` in
     * `password`, but the bootstrap script and Admin Management hash the typed text, so login tries this first.
     */
    rawPassword?: string;
}

export interface VerifyOtpBody {
    email: string;
    otp: string;
    type: "REGISTER" | "LOGIN";
}

export interface ResendOtpBody {
    email: string;
    type: "REGISTER" | "LOGIN";
}

export interface ForgotPasswordBody {
    email: string;
}

export interface ResetPasswordBody {
    token: string;
    password: string;
}

export interface RefreshTokenBody {
    refreshToken: string;
}

export interface VerifyPhoneBody {
    email: string;
    accessToken: string;
}

export interface GoogleAuthBody {
    idToken: string;
    referralCode?: string;
}

export interface CompleteProfileBody {
    firstName: string;
    lastName: string;
    phoneNo: string;
    state?: string;
    country?: string;
    city?: string;
    dateOfBirth?: string;
}

export interface JwtPayload {
    id: string;
    role: "USER" | "ADMIN" | "SUPERADMIN" | "BUSINESS_ADMIN";
}

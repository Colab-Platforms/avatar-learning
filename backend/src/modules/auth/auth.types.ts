export interface RegisterBody {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNo: string;
    state: string;
    country: string;
}

export interface LoginBody {
    email: string;
    password: string;
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
}

export interface JwtPayload {
    id: string;
    role: "USER" | "ADMIN" | "SUPERADMIN";
}

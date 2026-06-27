import prisma from "@root/prisma.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OtpType } from "@prisma/client";
import { hashPassword, comparePassword } from "@/utils/auth.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { sendOtpEmail, sendPasswordResetEmail } from "@/utils/mailer.js";
import { sendOtpSms } from "@/utils/msg91.js";
import { RegisterBody, LoginBody, VerifyOtpBody, ResendOtpBody } from "./auth.types.js";

dayjs.extend(utc);

const REFRESH_TOKEN_TTL_DAYS = 30;
const ACCESS_TOKEN_TTL = "1d";

const getHighestRole = (roleNames: string[]): "USER" | "ADMIN" | "SUPERADMIN" => {
    if (roleNames.includes("SUPERADMIN") || roleNames.includes("SUPER_ADMIN")) return "SUPERADMIN";
    if (roleNames.includes("ADMIN")) return "ADMIN";
    return "USER";
};

const signAccessToken = (userId: string, role: "USER" | "ADMIN" | "SUPERADMIN"): string => {
    if (!process.env.JWT_SECRET) throw new ApiError("JWT secret is not defined", STATUS_CODES.SERVER_ERROR);
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
};

const hashToken = (token: string): string =>
    crypto.createHash("sha256").update(token).digest("hex");

const hashOtp = (otp: string): string =>
    crypto.createHash("sha256").update(otp).digest("hex");

const generateOtp = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

// Creates a session, stores hashed refresh token, returns plain token to caller
const createSession = async (userId: string, device?: string): Promise<string> => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    await prisma.session.create({
        data: {
            userId,
            refreshToken: hashToken(rawToken),
            device: device ?? null,
            expiresAt: dayjs().add(REFRESH_TOKEN_TTL_DAYS, "day").toDate(),
        },
    });

    return rawToken;
};

class AuthService {
    async register(data: RegisterBody) {
        const existingUser = await prisma.user.findFirst({
            where: { email: data.email, isDeleted: false },
        });

        if (existingUser?.isEmailVerified) {
            throw new ApiError("Email already registered", STATUS_CODES.CONFLICT);
        }
        
        //fetch role and hash password in parallel
        const [hashedPassword, roleRecord] = await Promise.all([ 
            hashPassword(data.password),
            prisma.role.findUnique({ where: { name: "USER" } }),
        ]);
        // console.log(roleRecord);
        if (!roleRecord) throw new ApiError("USER role not found — run db:seed first", STATUS_CODES.SERVER_ERROR);

        let userId: string;
       
        //email not verfied 
        if (existingUser) {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { firstName: data.firstName, lastName: data.lastName, password: hashedPassword },
            });
            userId = existingUser.id;
        } 
        //new user
        else {
            const user = await prisma.$transaction(async (tx) => { //creating user and mapping role in a transaction 
                const created = await tx.user.create({
                    data: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        password: hashedPassword,
                        phoneNo: data.phoneNo,
                        state: data.state,
                        country: data.country,
                        isEmailVerified: false,
                    },
                });
                await tx.userRoleMapping.create({
                    data: { userId: created.id, roleId: roleRecord.id },
                });
                return created;
            });
            userId = user.id;
        }

        //mark any existing OTPs as used
        await prisma.otpVerification.updateMany({
            where: { email: data.email, type: OtpType.REGISTER, used: false },
            data: { used: true },
        });

        const otp = generateOtp();
        await prisma.otpVerification.create({
            data: {
                email: data.email,
                otpCode: hashOtp(otp),
                type: OtpType.REGISTER,
                userId,
                expiresAt: dayjs().add(10, "minute").toDate(),
            },
        });

        await Promise.all([
            sendOtpEmail(data.email, otp, "REGISTER").catch((err) =>
                console.error("[Auth] Failed to send registration OTP email:", err)
            ),
            data.phoneNo ? sendOtpSms(data.phoneNo, otp).catch((err) =>
                console.error("[Auth] Failed to send registration OTP SMS:", err)
            ) : Promise.resolve(),
        ]);

        return { message: "OTP sent to your email and phone. Please verify to complete registration." };
    }

    async verifyOtp(data: VerifyOtpBody, device?: string) {
        const otpRecord = await prisma.otpVerification.findFirst({
            where: {
                email: data.email,
                otpCode: hashOtp(data.otp),
                type: data.type as OtpType,
                used: false,
            },
            orderBy: { createdAt: "desc" },
        });

        if (!otpRecord) throw new ApiError("Invalid OTP", STATUS_CODES.BAD_REQUEST);

        if (dayjs().isAfter(otpRecord.expiresAt)) {
            throw new ApiError("OTP has expired. Please request a new one.", STATUS_CODES.BAD_REQUEST);
        }

        await prisma.otpVerification.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });

        const user = await prisma.user.findFirst({
            where: { email: data.email, isDeleted: false },
            include: { userRoleMappings: { include: { role: true } } },
        });

        if (!user) throw new ApiError("User not found", STATUS_CODES.NOT_FOUND);

        if (data.type === "REGISTER" && !user.isEmailVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true },
            });
        }

        const roleNames = user.userRoleMappings.map((ur) => ur.role.name);
        const accessToken = signAccessToken(user.id, getHighestRole(roleNames));
        const refreshToken = await createSession(user.id, device);

        const { password: _, ...safeUser } = user;
        return {
            user: safeUser,
            accessToken,
            refreshToken,
            message:
                data.type === "REGISTER"
                    ? "Email verified. Welcome to Avatar Learner!"
                    : "Logged in successfully.",
        };
    }

    async login(data: LoginBody, device?: string) {
        const user = await prisma.user.findFirst({
            where: { email: data.email, isDeleted: false },
            include: { userRoleMappings: { include: { role: true } } },
        });

        if (!user || !user.password) {
            throw new ApiError("Invalid email or password", STATUS_CODES.UNAUTHORIZED);
        }

        const isPasswordValid = await comparePassword(data.password, user.password);
        if (!isPasswordValid) {
            throw new ApiError("Invalid email or password", STATUS_CODES.UNAUTHORIZED);
        }

        if (!user.isActive) {
            throw new ApiError("Your account has been deactivated. Contact support.", STATUS_CODES.FORBIDDEN);
        }

        if (!user.isEmailVerified) {
            await prisma.otpVerification.updateMany({
                where: { email: data.email, type: OtpType.LOGIN, used: false },
                data: { used: true },
            });

            const otp = generateOtp();
            await prisma.otpVerification.create({
                data: {
                    email: data.email,
                    otpCode: hashOtp(otp),
                    type: OtpType.LOGIN,
                    userId: user.id,
                    expiresAt: dayjs().add(10, "minute").toDate(),
                },
            });

            await Promise.all([
                sendOtpEmail(data.email, otp, "LOGIN").catch((err) =>
                    console.error("[Auth] Failed to send login OTP email:", err)
                ),
                user.phoneNo ? sendOtpSms(user.phoneNo, otp).catch((err) =>
                    console.error("[Auth] Failed to send login OTP SMS:", err)
                ) : Promise.resolve(),
            ]);

            return {
                requiresVerification: true,
                message: "Your email is not verified. An OTP has been sent to your email and phone.",
            };
        }

        const roleNames = user.userRoleMappings.map((ur) => ur.role.name);
        const accessToken = signAccessToken(user.id, getHighestRole(roleNames));
        const refreshToken = await createSession(user.id, device);

        const { password: _, ...safeUser } = user;
        return { user: safeUser, accessToken, refreshToken };
    }

    async refresh(rawRefreshToken: string, device?: string) {
        const hashed = hashToken(rawRefreshToken);

        const session = await prisma.session.findFirst({
            where: { refreshToken: hashed },
            include: {
                user: { include: { userRoleMappings: { include: { role: true } } } },
            },
        });

        if (!session) throw new ApiError("Invalid refresh token", STATUS_CODES.UNAUTHORIZED);

        if (dayjs().isAfter(session.expiresAt)) {
            await prisma.session.delete({ where: { id: session.id } });
            throw new ApiError("Refresh token has expired. Please log in again.", STATUS_CODES.UNAUTHORIZED);
        }

        if (!session.user.isActive || session.user.isDeleted) {
            throw new ApiError("Account is no longer active.", STATUS_CODES.FORBIDDEN);
        }

        // Rotate: delete old session, create new one
        await prisma.session.delete({ where: { id: session.id } });

        const roleNames = session.user.userRoleMappings.map((ur) => ur.role.name);
        const accessToken = signAccessToken(session.user.id, getHighestRole(roleNames));
        const newRefreshToken = await createSession(session.user.id, device ?? session.device ?? undefined);

        return { accessToken, refreshToken: newRefreshToken };
    }

    async logout(rawRefreshToken: string) {
        const hashed = hashToken(rawRefreshToken);

        await prisma.session.deleteMany({ where: { refreshToken: hashed } });

        return { message: "Logged out successfully." };
    }

    async logoutAll(userId: string) {
        await prisma.session.deleteMany({ where: { userId } });
        return { message: "Logged out from all devices." };
    }

    async resendOtp(data: ResendOtpBody) {
        const user = await prisma.user.findFirst({
            where: { email: data.email, isDeleted: false },
        });

        if (!user) return { message: "If this email is registered, an OTP has been sent." };

        if (data.type === "REGISTER" && user.isEmailVerified) {
            throw new ApiError("This email is already verified.", STATUS_CODES.CONFLICT);
        }

        const recentOtp = await prisma.otpVerification.findFirst({
            where: {
                email: data.email,
                type: data.type as OtpType,
                used: false,
                createdAt: { gte: dayjs().subtract(60, "second").toDate() },
            },
        });

        if (recentOtp) {
            throw new ApiError("Please wait 60 seconds before requesting another OTP.", STATUS_CODES.TOO_MANY_REQUESTS);
        }

        await prisma.otpVerification.updateMany({
            where: { email: data.email, type: data.type as OtpType, used: false },
            data: { used: true },
        });

        const otp = generateOtp();
        await prisma.otpVerification.create({
            data: {
                email: data.email,
                otpCode: hashOtp(otp),
                type: data.type as OtpType,
                userId: user.id,
                expiresAt: dayjs().add(10, "minute").toDate(),
            },
        });

        await Promise.all([
            sendOtpEmail(data.email, otp, data.type).catch((err) =>
                console.error("[Auth] Failed to resend OTP email:", err)
            ),
            user.phoneNo ? sendOtpSms(user.phoneNo, otp).catch((err) =>
                console.error("[Auth] Failed to resend OTP SMS:", err)
            ) : Promise.resolve(),
        ]);

        return { message: "A new OTP has been sent to your email and phone." };
    }

    async forgotPassword(email: string) {
        const user = await prisma.user.findFirst({
            where: { email, isDeleted: false },
        });

        if (!user) return { message: "If this email exists, a reset link has been sent." };

        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });

        const token = crypto.randomBytes(32).toString("hex");

        await prisma.passwordResetToken.create({
            data: { userId: user.id, token, expiresAt: dayjs().add(1, "hour").toDate() },
        });

        sendPasswordResetEmail(email, token).catch((err) =>
            console.error("[Auth] Failed to send password reset email:", err)
        );

        return { message: "If this email exists, a reset link has been sent." };
    }

    async resetPassword(token: string, newPassword: string) {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken || resetToken.used) {
            throw new ApiError("Invalid or expired reset link", STATUS_CODES.BAD_REQUEST);
        }

        if (dayjs().isAfter(resetToken.expiresAt)) {
            throw new ApiError("Password reset link has expired. Please request a new one.", STATUS_CODES.BAD_REQUEST);
        }

        const hashed = await hashPassword(newPassword);

        await prisma.$transaction([
            prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } }),
            prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } }),
        ]);

        return { message: "Password reset successfully. You can now log in." };
    }

    async testOtpSending(email: string, phoneNo: string, otpType: string) {
        const otp = generateOtp();

        console.log(`[Test OTP] Testing with email=${email}, phone=${phoneNo}, otp=${otp}`);

        const [emailRes, smsRes] = await Promise.all([
            sendOtpEmail(email, otp, otpType as "REGISTER" | "LOGIN")
                .then(() => ({ success: true, message: "Email OTP sent successfully" }))
                .catch((err) => ({ success: false, message: `Email failed: ${err.message}` })),
            sendOtpSms(phoneNo, otp)
                .then((result) => result
                    ? { success: true, message: "SMS OTP sent successfully" }
                    : { success: false, message: "SMS API returned false" }
                )
                .catch((err) => ({ success: false, message: `SMS failed: ${err.message}` })),
        ]);

        return {
            otp,
            email: emailRes,
            sms: smsRes,
            message: `Test OTP: ${otp}\n\nEmail: ${emailRes.message}\nSMS: ${smsRes.message}`,
        };
    }
}

export default AuthService;

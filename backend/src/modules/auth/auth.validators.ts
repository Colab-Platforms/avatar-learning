import Joi from "joi";

const registerSchema = Joi.object({
    firstName: Joi.string().trim().required().messages({
        "string.empty": "First name is required",
        "any.required": "First name is required",
    }),
    lastName: Joi.string().trim().required().messages({
        "string.empty": "Last name is required",
        "any.required": "Last name is required",
    }),
    email: Joi.string().trim().lowercase().email().required().messages({
        "string.email": "A valid email is required",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
    password: Joi.string().min(8).required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).messages({
        "string.min": "Password must be at least 8 characters",
        "string.empty": "Password is required",
        "any.required": "Password is required",
        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),
    phoneNo: Joi.string().trim().required().messages({
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
    }),
    state: Joi.string().trim().required().messages({
        "string.empty": "State is required",
        "any.required": "State is required",
    }),
    country: Joi.string().trim().required().messages({
        "string.empty": "Country is required",
        "any.required": "Country is required",
    }),
});

const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
        "string.email": "A valid email is required",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
        "string.empty": "Password is required",
        "any.required": "Password is required",
    }),
});

const verifyOtpSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
        "string.email": "A valid email is required",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
        "string.length": "OTP must be 6 digits",
        "string.pattern.base": "OTP must be a 6-digit number",
        "string.empty": "OTP is required",
        "any.required": "OTP is required",
    }),
    type: Joi.string().valid("REGISTER", "LOGIN").required().messages({
        "any.only": "Type must be REGISTER or LOGIN",
        "any.required": "Type is required",
    }),
});

const resendOtpSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
        "string.email": "A valid email is required",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
    type: Joi.string().valid("REGISTER", "LOGIN").required().messages({
        "any.only": "Type must be REGISTER or LOGIN",
        "any.required": "Type is required",
    }),
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        "string.empty": "Refresh token is required",
        "any.required": "Refresh token is required",
    }),
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
        "string.email": "A valid email is required",
        "any.required": "Email is required",
    }),
});

const resetPasswordSchema = Joi.object({
    token: Joi.string().required().messages({
        "any.required": "Reset token is required",
    }),
    password: Joi.string().min(8).required().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).messages({
        "string.min": "Password must be at least 8 characters",
        "string.pattern.base": "Password must contain uppercase, lowercase, and a number",
        "any.required": "Password is required",
    }),
});

export const validateRegisterSchema = (data: unknown) => registerSchema.validate(data, { abortEarly: false });
export const validateLoginSchema = (data: unknown) => loginSchema.validate(data, { abortEarly: false });
export const validateVerifyOtpSchema = (data: unknown) => verifyOtpSchema.validate(data, { abortEarly: false });
export const validateResendOtpSchema = (data: unknown) => resendOtpSchema.validate(data, { abortEarly: false });
export const validateRefreshTokenSchema = (data: unknown) => refreshTokenSchema.validate(data, { abortEarly: false });
export const validateForgotPasswordSchema = (data: unknown) => forgotPasswordSchema.validate(data, { abortEarly: false });
export const validateResetPasswordSchema = (data: unknown) => resetPasswordSchema.validate(data, { abortEarly: false });

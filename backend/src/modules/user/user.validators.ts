import Joi from "joi";

// ── CreateUser ──────────────────────────────────────────────
const createUserSchema = Joi.object({
    firstName: Joi.string().trim().required().messages({
        "string.empty": "firstName is required",
        "any.required": "firstName is required",
    }),
    lastName: Joi.string().trim().required().messages({
        "string.empty": "lastName is required",
        "any.required": "lastName is required",
    }),
    email: Joi.string().email().required().messages({
        "string.email": "A valid email is required",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
    password: Joi.string()
        .min(8)
        .required()
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
            "string.min": "Password must be at least 8 characters",
            "string.empty": "Password is required",
            "any.required": "Password is required",
            "string.pattern.base":
                "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        }),
    phone: Joi.string().trim().allow(null, "").optional(),
});

export const validateCreateUserSchema = (data: unknown) => {
    return createUserSchema.validate(data, { abortEarly: false });
};

// ── UpdateUser ──────────────────────────────────────────────
const updateUserSchema = Joi.object({
    firstName: Joi.string().trim().allow("").optional(),
    lastName: Joi.string().trim().allow("").optional(),
    phoneNo: Joi.string().trim().allow(null, "").optional(),
    address: Joi.string().trim().allow(null, "").optional(),
    gender: Joi.string().trim().allow(null, "").optional(),
    state: Joi.string().trim().allow(null, "").optional(),
    country: Joi.string().trim().allow(null, "").optional(),
    city: Joi.string().trim().allow(null, "").optional(),
    isActive: Joi.boolean().optional(),
});

export const validateUpdateUserSchema = (data: unknown) => {
    return updateUserSchema.validate(data, { abortEarly: false });
};

// ── SetUserRole ─────────────────────────────────────────────
const setUserRoleSchema = Joi.object({
    role: Joi.string().valid("ADMIN", "USER").required().messages({
        "any.only": "role must be either ADMIN or USER",
        "any.required": "role is required",
    }),
});

export const validateSetUserRoleSchema = (data: unknown) => {
    return setUserRoleSchema.validate(data, { abortEarly: false });
};

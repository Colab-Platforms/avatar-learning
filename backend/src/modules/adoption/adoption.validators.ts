import Joi from "joi";

// Shared rules for the AI Adoption account forms.
const email = Joi.string().trim().lowercase().email().max(254).required().messages({
  "string.email": "Enter a valid email address.",
  "string.empty": "Email is required.",
  "any.required": "Email is required.",
});
const newPassword = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters.",
    "string.max": "Password must be at most 128 characters.",
    "string.pattern.base": "Password must include an uppercase letter, a lowercase letter and a number.",
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  });
const code = Joi.string().trim().pattern(/^\d{6}$/).required().messages({
  "string.pattern.base": "Enter the 6-digit code.",
  "string.empty": "Enter the 6-digit code.",
  "any.required": "Enter the 6-digit code.",
});

const opts = { abortEarly: true, stripUnknown: true };

export const validateRegister = (body: unknown) =>
  Joi.object({
    fullName: Joi.string().trim().min(2).max(120).required().messages({
      "string.min": "Enter your full name.",
      "string.empty": "Full name is required.",
      "any.required": "Full name is required.",
    }),
    email,
    password: newPassword,
  }).validate(body, opts);

export const validateLogin = (body: unknown) =>
  Joi.object({
    email,
    password: Joi.string().max(128).required().messages({ "string.empty": "Password is required.", "any.required": "Password is required." }),
  }).validate(body, opts);

export const validateVerifyEmail = (body: unknown) => Joi.object({ email, code }).validate(body, opts);

export const validateEmailOnly = (body: unknown) => Joi.object({ email }).validate(body, opts);

export const validateResetPassword = (body: unknown) => Joi.object({ email, code, password: newPassword }).validate(body, opts);

export const validateGoogle = (body: unknown) =>
  Joi.object({
    idToken: Joi.string().max(4096).required().messages({ "any.required": "Missing Google credential." }),
  }).validate(body, opts);

import Joi from "joi";
import type {
  CreateWebinarOrderBody,
  VerifyWebinarPaymentBody,
} from "./webinar.types.js";

export function validateCreateWebinarOrder(data: unknown): {
  error?: { message: string };
  value: CreateWebinarOrderBody;
} {
  const schema = Joi.object<CreateWebinarOrderBody>({
    name: Joi.string()
      .trim()
      .min(2)
      .max(60)
      .pattern(/^[A-Za-z][A-Za-z\s'.-]*$/)
      .required()
      .messages({
        "any.required": "name is required",
        "string.empty": "name cannot be empty",
        "string.min": "name must be at least 2 characters",
        "string.max": "name cannot exceed 60 characters",
        "string.pattern.base": "name must contain only letters, spaces, and -'.",
      }),
    email: Joi.string().trim().email().required().messages({
      "any.required": "email is required",
      "string.email": "email must be a valid email address",
    }),
    // Digits only (after stripping spaces/hyphens/parens), optional leading
    // "+", 8-15 digits — the old character-class-only regex accepted strings
    // with zero digits (e.g. "-------"), which is not a valid phone number.
    phoneNumber: Joi.string()
      .trim()
      .custom((value: string, helpers) => {
        const digits = value.replace(/[\s\-()]/g, "");
        if (!/^\+?[0-9]{8,15}$/.test(digits)) {
          return helpers.error("any.invalid");
        }
        return value;
      })
      .required()
      .messages({
        "any.required": "phoneNumber is required",
        "any.invalid": "phoneNumber must be a valid phone number",
      }),
  });
  const { error, value } = schema.validate(data, { abortEarly: true });
  if (error)
    return { error: { message: error.message }, value: value as CreateWebinarOrderBody };
  return { value };
}

export function validateVerifyWebinarPayment(data: unknown): {
  error?: { message: string };
  value: VerifyWebinarPaymentBody;
} {
  const schema = Joi.object<VerifyWebinarPaymentBody>({
    razorpay_order_id: Joi.string().trim().required(),
    razorpay_payment_id: Joi.string().trim().required(),
    razorpay_signature: Joi.string().trim().required(),
  });
  const { error, value } = schema.validate(data, { abortEarly: true });
  if (error)
    return { error: { message: error.message }, value: value as VerifyWebinarPaymentBody };
  return { value };
}

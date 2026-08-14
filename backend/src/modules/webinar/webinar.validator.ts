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
    name: Joi.string().trim().min(2).required().messages({
      "any.required": "name is required",
      "string.empty": "name cannot be empty",
    }),
    email: Joi.string().trim().email().required().messages({
      "any.required": "email is required",
      "string.email": "email must be a valid email address",
    }),
    phoneNumber: Joi.string()
      .trim()
      .pattern(/^[0-9+\-\s]{7,15}$/)
      .required()
      .messages({
        "any.required": "phoneNumber is required",
        "string.pattern.base": "phoneNumber must be a valid phone number",
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

import Joi from "joi";
import { getPaymentProvider } from "./payment.config.js";
import type {
  CreateOrderBody,
  VerifyCashfreePaymentBody,
  VerifyPaymentBody,
  VerifyRazorpayPaymentBody,
} from "./payment.types.js";

export function validateCreateOrder(data: unknown): {
  error?: { message: string };
  value: CreateOrderBody;
} {
  const schema = Joi.object<CreateOrderBody>({
    courseId: Joi.string().trim().required().messages({
      "any.required": "courseId is required",
      "string.empty": "courseId cannot be empty",
    }),
  });
  const { error, value } = schema.validate(data, { abortEarly: true });
  if (error) return { error: { message: error.message }, value: value as CreateOrderBody };
  return { value };
}

export function validateVerifyPayment(data: unknown): {
  error?: { message: string };
  value: VerifyPaymentBody;
} {
  const provider = getPaymentProvider();

  if (provider === "cashfree") {
    const schema = Joi.object<VerifyCashfreePaymentBody>({
      courseId: Joi.string().trim().required(),
      order_id: Joi.string().trim().required(),
    });
    const { error, value } = schema.validate(data, { abortEarly: true });
    if (error) return { error: { message: error.message }, value: value as VerifyCashfreePaymentBody };
    return { value };
  }

  const schema = Joi.object<VerifyRazorpayPaymentBody>({
    courseId: Joi.string().trim().required(),
    razorpay_order_id: Joi.string().trim().required(),
    razorpay_payment_id: Joi.string().trim().required(),
    razorpay_signature: Joi.string().trim().required(),
  });
  const { error, value } = schema.validate(data, { abortEarly: true });
  if (error) return { error: { message: error.message }, value: value as VerifyRazorpayPaymentBody };
  return { value };
}

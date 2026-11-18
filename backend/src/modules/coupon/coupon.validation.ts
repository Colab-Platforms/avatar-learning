import Joi from "joi";

export interface CreateCouponBody {
  code: string;
  discountPercent: number;
  expiresAt?: string | null;
}

export interface UpdateCouponBody {
  discountPercent?: number;
  isActive?: boolean;
  expiresAt?: string | null;
}

export interface ApplyCouponBody {
  code: string;
}

export function validateCreateCoupon(data: unknown): {
  error?: { message: string };
  value: CreateCouponBody;
} {
  const schema = Joi.object<CreateCouponBody>({
    code: Joi.string().trim().min(3).max(30).required(),
    discountPercent: Joi.number().integer().min(1).max(100).required(),
    expiresAt: Joi.date().iso().allow(null).optional(),
  });
  const { error, value } = schema.validate(data, { abortEarly: true });
  if (error) return { error: { message: error.message }, value: value as CreateCouponBody };
  return { value };
}

export function validateUpdateCoupon(data: unknown): {
  error?: { message: string };
  value: UpdateCouponBody;
} {
  const schema = Joi.object<UpdateCouponBody>({
    discountPercent: Joi.number().integer().min(1).max(100).optional(),
    isActive: Joi.boolean().optional(),
    expiresAt: Joi.date().iso().allow(null).optional(),
  }).min(1);
  const { error, value } = schema.validate(data, { abortEarly: true });
  if (error) return { error: { message: error.message }, value: value as UpdateCouponBody };
  return { value };
}

export function validateApplyCoupon(data: unknown): {
  error?: { message: string };
  value: ApplyCouponBody;
} {
  const schema = Joi.object<ApplyCouponBody>({
    code: Joi.string().trim().required().messages({
      "any.required": "Coupon code is required",
      "string.empty": "Coupon code cannot be empty",
    }),
  });
  const { error, value } = schema.validate(data, { abortEarly: true });
  if (error) return { error: { message: error.message }, value: value as ApplyCouponBody };
  return { value };
}

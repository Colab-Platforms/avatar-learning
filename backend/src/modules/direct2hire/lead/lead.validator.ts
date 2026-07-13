import Joi from "joi";

const upsertLeadSchema = Joi.object({
  fullName: Joi.string().trim().required().messages({
    "any.required": "Full name is required",
  }),
  email: Joi.string().trim().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Email must be valid",
  }),
  phoneNumber: Joi.string().trim().required().messages({
    "any.required": "Phone number is required",
  }),
  institutionName: Joi.string().trim().required().messages({
    "any.required": "Institution name is required",
  }),
  currentEducation: Joi.string().trim().required().messages({
    "any.required": "Current education is required",
  }),
  city: Joi.string().trim().required().messages({
    "any.required": "City is required",
  }),
  state: Joi.string().trim().required().messages({
    "any.required": "State is required",
  }),
});

export const validateUpsertLead = (data: unknown) =>
  upsertLeadSchema.validate(data, { abortEarly: false });

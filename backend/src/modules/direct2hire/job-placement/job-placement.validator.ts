import Joi from "joi";

const createSchema = Joi.object({
  companyName: Joi.string().trim().min(1).max(200).required().messages({
    "any.required": "Company name is required",
    "string.empty": "Company name is required",
  }),
  jobTitle: Joi.string().trim().min(1).max(200).required().messages({
    "any.required": "Job title is required",
    "string.empty": "Job title is required",
  }),
  location: Joi.string().trim().max(200).optional().allow(null, ""),
  ctcLpa: Joi.number().min(0).max(1000).optional().allow(null).messages({
    "number.min": "CTC cannot be negative",
    "number.max": "CTC seems too high, please double-check",
  }),
  joinedAt: Joi.date().iso().required().messages({
    "any.required": "Joining date is required",
    "date.base": "Please provide a valid joining date",
  }),
  notes: Joi.string().trim().max(1000).optional().allow(null, ""),
});

const updateSchema = Joi.object({
  companyName: Joi.string().trim().min(1).max(200).optional(),
  jobTitle: Joi.string().trim().min(1).max(200).optional(),
  location: Joi.string().trim().max(200).optional().allow(null, ""),
  ctcLpa: Joi.number().min(0).max(1000).optional().allow(null),
  joinedAt: Joi.date().iso().optional(),
  leftAt: Joi.date().iso().optional().allow(null),
  notes: Joi.string().trim().max(1000).optional().allow(null, ""),
}).min(1);

export const validateCreateJobPlacementEntry = (data: unknown) =>
  createSchema.validate(data, { abortEarly: false });

export const validateUpdateJobPlacementEntry = (data: unknown) =>
  updateSchema.validate(data, { abortEarly: false });

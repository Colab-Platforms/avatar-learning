import Joi from "joi";

const outcomeItem = Joi.object({
  title: Joi.string().trim().required(),
  body: Joi.string().trim().required(),
});

const createInternshipSchema = Joi.object({
  categoryId: Joi.string().required().messages({ "any.required": "Category is required" }),
  title: Joi.string().trim().required().messages({ "any.required": "Title is required" }),
  company: Joi.string().trim().required().messages({ "any.required": "Company is required" }),
  description: Joi.string().trim().optional().allow(""),
  domain: Joi.string().trim().optional().allow(""),
  stipend: Joi.string().trim().optional().allow(""),
  employmentType: Joi.string().valid("FULL_TIME", "PART_TIME", "REMOTE").required().messages({ "any.required": "Employment type is required" }),
  location: Joi.string().trim().optional().allow(""),
  deadline: Joi.string().isoDate().optional().allow(""),
  keyLearningOutcomes: Joi.array().items(outcomeItem).optional().default([]),
  majorProject: Joi.array().items(outcomeItem).optional().default([]),
  whatYouReceive: Joi.array().items(outcomeItem).optional().default([]),
});

const updateInternshipSchema = Joi.object({
  categoryId: Joi.string().optional(),
  title: Joi.string().trim().optional(),
  company: Joi.string().trim().optional(),
  description: Joi.string().trim().optional().allow(""),
  domain: Joi.string().trim().optional().allow(""),
  stipend: Joi.string().trim().optional().allow(""),
  employmentType: Joi.string().valid("FULL_TIME", "PART_TIME", "REMOTE").optional(),
  location: Joi.string().trim().optional().allow(""),
  deadline: Joi.string().isoDate().optional().allow(""),
  isPublished: Joi.boolean().optional(),
  keyLearningOutcomes: Joi.array().items(outcomeItem).optional(),
  majorProject: Joi.array().items(outcomeItem).optional(),
  whatYouReceive: Joi.array().items(outcomeItem).optional(),
});

export const validateCreateInternship = (data: unknown) =>
  createInternshipSchema.validate(data, { abortEarly: false });
export const validateUpdateInternship = (data: unknown) =>
  updateInternshipSchema.validate(data, { abortEarly: false });

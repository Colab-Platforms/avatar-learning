import Joi from "joi";

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({ "any.required": "Name is required" }),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).optional().messages({
    "string.pattern.base": "Slug must contain only lowercase letters, numbers, and hyphens",
  }),
  sortOrder: Joi.number().integer().optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).optional().messages({
    "string.pattern.base": "Slug must contain only lowercase letters, numbers, and hyphens",
  }),
  sortOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const createDocumentSchema = Joi.object({
  categoryId: Joi.string().required().messages({ "any.required": "Category is required" }),
  name: Joi.string().trim().max(300).required().messages({ "any.required": "Name is required" }),
  url: Joi.string().uri().required().messages({ "any.required": "URL is required" }),
});

const updateDocumentSchema = Joi.object({
  categoryId: Joi.string().optional(),
  name: Joi.string().trim().max(300).optional(),
  url: Joi.string().uri().optional(),
}).min(1);

export const validateCreateCategory = (data: unknown) =>
  createCategorySchema.validate(data, { abortEarly: false });
export const validateUpdateCategory = (data: unknown) =>
  updateCategorySchema.validate(data, { abortEarly: false });
export const validateCreateDocument = (data: unknown) =>
  createDocumentSchema.validate(data, { abortEarly: false });
export const validateUpdateDocument = (data: unknown) =>
  updateDocumentSchema.validate(data, { abortEarly: false });

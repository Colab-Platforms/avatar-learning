import Joi from "joi";

const createContactSchema = Joi.object({
  name: Joi.string().trim().required().messages({ "any.required": "Name is required" }),
  email: Joi.string().trim().email({ tlds: false }).required().messages({
    "any.required": "Email is required",
    "string.email": "Enter a valid email",
  }),
  subject: Joi.string().trim().required().messages({ "any.required": "Subject is required" }),
  message: Joi.string().trim().required().messages({ "any.required": "Message is required" }),
});

export const validateCreateContact = (data: unknown) =>
  createContactSchema.validate(data, { abortEarly: false });

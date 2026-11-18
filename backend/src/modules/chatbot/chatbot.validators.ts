import Joi from "joi";

const userContextSchema = Joi.object({
  name: Joi.string().trim().max(100).optional().allow(""),
  email: Joi.string().trim().email().optional().allow(""),
  role: Joi.string().trim().max(50).optional().allow(""),
  interest: Joi.string().trim().max(200).optional().allow(""),
}).optional();

const chatSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Message is required",
    "any.required": "Message is required",
  }),
  sessionId: Joi.string().trim().max(120).optional(),
  user: userContextSchema,
});

export const validateChatRequestSchema = (payload: unknown) =>
  chatSchema.validate(payload, { abortEarly: false });

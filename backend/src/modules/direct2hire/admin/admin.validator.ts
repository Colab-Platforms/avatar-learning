import Joi from "joi";

const studentUserIdParamSchema = Joi.object({
    userId: Joi.string().trim().required().messages({
        "string.empty": "userId is required",
        "any.required": "userId is required",
    }),
});

export const validateStudentUserIdParam = (data: unknown) =>
    studentUserIdParamSchema.validate(data, { abortEarly: false });

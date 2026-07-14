import Joi from "joi";

const createAssessmentSchema = Joi.object({
    title: Joi.string().trim().required().messages({ "any.required": "Title is required" }),
    description: Joi.string().trim().optional().allow(""),
    timeLimitMinutes: Joi.number().integer().min(1).required().messages({ "any.required": "Time limit is required" }),
    passingScorePercent: Joi.number().integer().min(0).max(100).optional(),
    maxTabSwitchWarnings: Joi.number().integer().min(1).default(3),
});

const updateAssessmentSchema = Joi.object({
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(""),
    timeLimitMinutes: Joi.number().integer().min(1).optional(),
    passingScorePercent: Joi.number().integer().min(0).max(100).optional().allow(null),
    maxTabSwitchWarnings: Joi.number().integer().min(1).optional(),
});

const optionSchema = Joi.object({
    optionText: Joi.string().trim().required().messages({ "any.required": "Option text is required" }),
    isCorrect: Joi.boolean().required(),
    optionOrder: Joi.number().integer().min(1).required(),
});

const optionsArray = Joi.array()
    .items(optionSchema)
    .min(2)
    .required()
    .messages({ "array.min": "A question needs at least 2 options" })
    .custom((value: { isCorrect: boolean }[], helpers) => {
        const correctCount = value.filter((o) => o.isCorrect).length;
        if (correctCount !== 1) {
            return helpers.message({ custom: "Exactly one option must be marked correct" });
        }
        return value;
    });

const createQuestionSchema = Joi.object({
    questionText: Joi.string().trim().required().messages({ "any.required": "Question text is required" }),
    points: Joi.number().integer().min(1).default(1),
    questionOrder: Joi.number().integer().min(1).required().messages({ "any.required": "Question order is required" }),
    options: optionsArray,
});

const updateQuestionSchema = Joi.object({
    questionText: Joi.string().trim().optional(),
    points: Joi.number().integer().min(1).optional(),
    questionOrder: Joi.number().integer().min(1).optional(),
    options: optionsArray.optional(),
});

const saveAnswerSchema = Joi.object({
    selectedOptionId: Joi.string().allow(null).required(),
});

export const validateCreateAssessment = (data: unknown) => createAssessmentSchema.validate(data, { abortEarly: false });
export const validateUpdateAssessment = (data: unknown) => updateAssessmentSchema.validate(data, { abortEarly: false });
export const validateCreateQuestion   = (data: unknown) => createQuestionSchema.validate(data, { abortEarly: false });
export const validateUpdateQuestion   = (data: unknown) => updateQuestionSchema.validate(data, { abortEarly: false });
export const validateSaveAnswer       = (data: unknown) => saveAnswerSchema.validate(data, { abortEarly: false });

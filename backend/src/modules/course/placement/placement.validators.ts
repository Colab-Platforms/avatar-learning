import Joi from "joi";

const createPlacementAssessmentSchema = Joi.object({
    title: Joi.string().trim().required().messages({ "any.required": "Title is required" }),
    description: Joi.string().trim().optional().allow(""),
    timeLimitMinutes: Joi.number().integer().min(1).required().messages({ "any.required": "Time limit is required" }),
    passingScorePercent: Joi.number().integer().min(0).max(100).default(60),
    questionsPerAttempt: Joi.number().integer().min(1).default(20),
    maxTabSwitchWarnings: Joi.number().integer().min(1).default(3),
    maxAttempts: Joi.number().integer().min(1).default(3),
});

const updatePlacementAssessmentSchema = Joi.object({
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(""),
    timeLimitMinutes: Joi.number().integer().min(1).optional(),
    passingScorePercent: Joi.number().integer().min(0).max(100).optional(),
    questionsPerAttempt: Joi.number().integer().min(1).optional(),
    maxTabSwitchWarnings: Joi.number().integer().min(1).optional(),
    maxAttempts: Joi.number().integer().min(1).optional(),
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

const createPlacementQuestionSchema = Joi.object({
    questionText: Joi.string().trim().required().messages({ "any.required": "Question text is required" }),
    points: Joi.number().integer().min(1).default(1),
    questionOrder: Joi.number().integer().min(1).required().messages({ "any.required": "Question order is required" }),
    options: optionsArray,
});

const updatePlacementQuestionSchema = Joi.object({
    questionText: Joi.string().trim().optional(),
    points: Joi.number().integer().min(1).optional(),
    questionOrder: Joi.number().integer().min(1).optional(),
    options: optionsArray.optional(),
});

const savePlacementAnswerSchema = Joi.object({
    selectedOptionId: Joi.string().allow(null).required(),
});

const grantPlacementAttemptsSchema = Joi.object({
    attemptsGranted: Joi.number().integer().min(1).max(10).required().messages({
        "any.required": "Number of extra attempts is required",
    }),
    reason: Joi.string().trim().min(10).required().messages({
        "any.required": "Reason is required",
        "string.min": "Reason must be at least 10 characters",
    }),
});

export const validateCreatePlacementAssessment = (data: unknown) =>
    createPlacementAssessmentSchema.validate(data, { abortEarly: false });
export const validateUpdatePlacementAssessment = (data: unknown) =>
    updatePlacementAssessmentSchema.validate(data, { abortEarly: false });
export const validateCreatePlacementQuestion = (data: unknown) =>
    createPlacementQuestionSchema.validate(data, { abortEarly: false });
export const validateUpdatePlacementQuestion = (data: unknown) =>
    updatePlacementQuestionSchema.validate(data, { abortEarly: false });
export const validateSavePlacementAnswer = (data: unknown) =>
    savePlacementAnswerSchema.validate(data, { abortEarly: false });
export const validateGrantPlacementAttempts = (data: unknown) =>
    grantPlacementAttemptsSchema.validate(data, { abortEarly: false });

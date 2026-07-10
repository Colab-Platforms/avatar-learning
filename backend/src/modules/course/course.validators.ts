import Joi from "joi";

const whatYouLearnItem = Joi.object({
    title: Joi.string().trim().required(),
    body: Joi.string().trim().required(),
});

const audienceItem = Joi.object({
    title: Joi.string().trim().required(),
    body: Joi.string().trim().required(),
});

const createCategorySchema = Joi.object({
    name: Joi.string().trim().required().messages({ "string.empty": "Category name is required" }),
    slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).required().messages({
        "string.pattern.base": "Slug must contain only lowercase letters, numbers, and hyphens",
    }),
    description: Joi.string().trim().optional().allow(""),
    thumbnail: Joi.string().uri().optional().allow(""),
});

const createCourseSchema = Joi.object({
    categoryId: Joi.string().required().messages({ "any.required": "Category is required" }),
    title: Joi.string().trim().required().messages({ "any.required": "Title is required" }),
    description: Joi.string().trim().optional().allow(""),
    thumbnail: Joi.string().uri().optional().allow(""),
    heroImage: Joi.string().uri().optional().allow(""),
    bannerImage: Joi.string().uri().optional().allow(""),
    level: Joi.string().valid("BEGINNER", "INTERMEDIATE", "ADVANCED").required(),
    price: Joi.number().min(0).default(0),
    totalWeeks: Joi.number().integer().min(1).default(1),
    tools: Joi.array().items(Joi.string().trim()).optional().default([]),
    sessions: Joi.string().trim().optional().allow(""),
    certificate: Joi.boolean().default(false),
    rating: Joi.number().min(0).max(5).optional(),
    reviews: Joi.string().trim().optional().allow(""),
    startDate: Joi.string().trim().optional().allow(""),
    seats: Joi.string().trim().optional().allow(""),
    whatYouLearn: Joi.array().items(whatYouLearnItem).optional().default([]),
    audience: Joi.array().items(audienceItem).optional().default([]),
    isDirect2HireCourse: Joi.boolean().default(false),
});

const updateCourseSchema = Joi.object({
    categoryId: Joi.string().optional(),
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(""),
    thumbnail: Joi.string().uri().optional().allow(""),
    heroImage: Joi.string().uri().optional().allow(""),
    bannerImage: Joi.string().uri().optional().allow(""),
    level: Joi.string().valid("BEGINNER", "INTERMEDIATE", "ADVANCED").optional(),
    price: Joi.number().min(0).optional(),
    totalWeeks: Joi.number().integer().min(1).optional(),
    isPublished: Joi.boolean().optional(),
    tools: Joi.array().items(Joi.string().trim()).optional(),
    sessions: Joi.string().trim().optional().allow(""),
    certificate: Joi.boolean().optional(),
    rating: Joi.number().min(0).max(5).optional(),
    reviews: Joi.string().trim().optional().allow(""),
    startDate: Joi.string().trim().optional().allow(""),
    seats: Joi.string().trim().optional().allow(""),
    whatYouLearn: Joi.array().items(whatYouLearnItem).optional(),
    audience: Joi.array().items(audienceItem).optional(),
    isDirect2HireCourse: Joi.boolean().optional(),
});

const createLessonSchema = Joi.object({
    weekNumber: Joi.number().integer().min(1).required().messages({ "any.required": "Week number is required" }),
    title: Joi.string().trim().required().messages({ "any.required": "Title is required" }),
    description: Joi.string().trim().optional().allow(""),
    modules: Joi.array().items(Joi.string().trim()).optional().default([]),
    duration: Joi.number().integer().min(0).optional(),
    lessonOrder: Joi.number().integer().min(1).required().messages({ "any.required": "Lesson order is required" }),
    releaseDate: Joi.string().isoDate().optional().allow(""),
    isPublished: Joi.boolean().default(false),
    isFreePreview: Joi.boolean().default(false),
});

const updateLessonSchema = Joi.object({
    weekNumber: Joi.number().integer().min(1).optional(),
    title: Joi.string().trim().optional(),
    description: Joi.string().trim().optional().allow(""),
    modules: Joi.array().items(Joi.string().trim()).optional(),
    duration: Joi.number().integer().min(0).optional(),
    lessonOrder: Joi.number().integer().min(1).optional(),
    releaseDate: Joi.string().isoDate().optional().allow(""),
    isPublished: Joi.boolean().optional(),
    isFreePreview: Joi.boolean().optional(),
});

export const validateCreateCategory = (data: unknown) => createCategorySchema.validate(data, { abortEarly: false });
export const validateCreateCourse   = (data: unknown) => createCourseSchema.validate(data, { abortEarly: false });
export const validateUpdateCourse   = (data: unknown) => updateCourseSchema.validate(data, { abortEarly: false });
export const validateCreateLesson   = (data: unknown) => createLessonSchema.validate(data, { abortEarly: false });
export const validateUpdateLesson   = (data: unknown) => updateLessonSchema.validate(data, { abortEarly: false });

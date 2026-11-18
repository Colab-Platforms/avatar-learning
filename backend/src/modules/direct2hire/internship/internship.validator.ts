import Joi from "joi";

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25 MB

const SUPPORTED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "zip",
  "rar",
  "png",
  "jpg",
  "jpeg",
] as const;

const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "image/png",
  "image/jpeg",
  "application/octet-stream",
] as const;

export const INTERNSHIP_UPLOAD_LIMITS = {
  maxSize: MAX_ATTACHMENT_SIZE,
  extensions: SUPPORTED_EXTENSIONS,
  mimeTypes: SUPPORTED_MIME_TYPES,
} as const;

const taskAttachmentSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().trim().required(),
  originalFilename: Joi.string().trim().max(500).required(),
  mimeType: Joi.string().trim().max(200).required(),
  size: Joi.number().integer().min(1).max(MAX_ATTACHMENT_SIZE).required(),
});

const createTaskSchema = Joi.object({
  weekNumber: Joi.number().integer().min(1).max(8).required(),
  title: Joi.string().trim().min(1).max(200).required(),
  shortDescription: Joi.string().trim().min(1).max(1000).required(),
  detailedInstructions: Joi.string().trim().min(1).max(20000).required(),
  expectedDeliverables: Joi.string().trim().min(1).max(10000).required(),
  estimatedHours: Joi.number().integer().min(1).max(200).allow(null).optional(),
  isPublished: Joi.boolean().optional(),
  attachments: Joi.array().items(taskAttachmentSchema).max(20).optional(),
});

const updateTaskSchema = Joi.object({
  weekNumber: Joi.number().integer().min(1).max(8).optional(),
  title: Joi.string().trim().min(1).max(200).optional(),
  shortDescription: Joi.string().trim().min(1).max(1000).optional(),
  detailedInstructions: Joi.string().trim().min(1).max(20000).optional(),
  expectedDeliverables: Joi.string().trim().min(1).max(10000).optional(),
  estimatedHours: Joi.number().integer().min(1).max(200).allow(null).optional(),
  isPublished: Joi.boolean().optional(),
  attachments: Joi.array().items(taskAttachmentSchema).max(20).optional(),
}).min(1);

const submissionFileSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().trim().required(),
  originalFilename: Joi.string()
    .trim()
    .max(500)
    .required()
    .custom((value, helpers) => {
      const ext = value.split(".").pop()?.toLowerCase() ?? "";
      if (
        !(SUPPORTED_EXTENSIONS as readonly string[]).includes(
          ext as (typeof SUPPORTED_EXTENSIONS)[number],
        )
      ) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .messages({
      "any.invalid":
        "Unsupported file type. Allowed: PDF, DOC, DOCX, ZIP, RAR, PNG, JPG, JPEG",
    }),
  mimeType: Joi.string().trim().max(200).required(),
  size: Joi.number().integer().min(1).max(MAX_ATTACHMENT_SIZE).required(),
});

const submissionLinkSchema = Joi.object({
  url: Joi.string().uri().required(),
  label: Joi.string().trim().max(100).allow(null, "").optional(),
});

const submitTaskSchema = Joi.object({
  files: Joi.array().items(submissionFileSchema).max(10).optional(),
  links: Joi.array().items(submissionLinkSchema).max(10).optional(),
  studentNotes: Joi.string().trim().max(5000).allow(null, "").optional(),
})
  .custom((value, helpers) => {
    const files = value.files ?? [];
    const links = value.links ?? [];
    if (files.length === 0 && links.length === 0) {
      return helpers.error("any.custom", {
        message: "At least one file or link is required",
      });
    }
    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });

const reviewSubmissionSchema = Joi.object({
  status: Joi.string().valid("APPROVED", "CHANGES_REQUESTED").required(),
  adminFeedback: Joi.string().trim().max(5000).allow(null, "").optional(),
});

const courseIdParamSchema = Joi.object({
  courseId: Joi.string().trim().required(),
});

const taskIdParamSchema = Joi.object({
  taskId: Joi.string().trim().required(),
});

const submissionIdParamSchema = Joi.object({
  submissionId: Joi.string().trim().required(),
});

export const validateCreateInternshipTask = (data: unknown) =>
  createTaskSchema.validate(data, { abortEarly: false });

export const validateUpdateInternshipTask = (data: unknown) =>
  updateTaskSchema.validate(data, { abortEarly: false });

export const validateSubmitInternshipTask = (data: unknown) =>
  submitTaskSchema.validate(data, { abortEarly: false });

export const validateReviewSubmission = (data: unknown) =>
  reviewSubmissionSchema.validate(data, { abortEarly: false });

export const validateCourseIdParam = (data: unknown) =>
  courseIdParamSchema.validate(data, { abortEarly: false });

export const validateTaskIdParam = (data: unknown) =>
  taskIdParamSchema.validate(data, { abortEarly: false });

export const validateSubmissionIdParam = (data: unknown) =>
  submissionIdParamSchema.validate(data, { abortEarly: false });

export function isSupportedInternshipFilename(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(
    ext as (typeof SUPPORTED_EXTENSIONS)[number],
  );
}

import Joi from "joi";
import {
  countWords,
  PERFORMANCE_GRADE_VALUES,
} from "./mock-interview.types.js";

const scheduleSchema = Joi.object({
  interviewerName: Joi.string().trim().min(1).max(200).required().messages({
    "any.required": "Interviewer name is required",
    "string.empty": "Interviewer name is required",
  }),
  meetingLink: Joi.string().trim().uri().required().messages({
    "any.required": "Google Meet link is required",
    "string.empty": "Google Meet link is required",
    "string.uri": "Please provide a valid meeting URL",
  }),
  scheduledAt: Joi.date().iso().required().messages({
    "any.required": "Date and time are required",
    "date.base": "Please provide a valid date and time",
  }),
  durationMinutes: Joi.number().integer().min(15).max(180).required().messages({
    "any.required": "Duration is required",
    "number.min": "Duration must be at least 15 minutes",
    "number.max": "Duration cannot exceed 180 minutes",
  }),
  adminNotes: Joi.string().trim().max(2000).optional().allow(null, ""),
});

const feedbackSchema = Joi.object({
  performanceGrade: Joi.string()
    .valid(...PERFORMANCE_GRADE_VALUES)
    .required()
    .messages({
      "any.required": "Student performance grade is required",
      "any.only": "Performance grade must be Grade A, Grade B, or Grade C",
    }),
  feedback: Joi.string()
    .trim()
    .required()
    .max(1000)
    .custom((value, helpers) => {
      if (countWords(value) < 20) {
        return helpers.error("feedback.wordCount");
      }
      return value;
    })
    .messages({
      "any.required": "Overall feedback is required",
      "string.empty": "Overall feedback is required",
      "string.max": "Feedback cannot exceed 1000 characters",
      "feedback.wordCount":
        "Please provide at least 20 words of meaningful feedback.",
    }),
});

export const validateScheduleMockInterview = (data: unknown) =>
  scheduleSchema.validate(data, { abortEarly: false });

export const validatePublishMockInterviewFeedback = (data: unknown) =>
  feedbackSchema.validate(data, { abortEarly: false });

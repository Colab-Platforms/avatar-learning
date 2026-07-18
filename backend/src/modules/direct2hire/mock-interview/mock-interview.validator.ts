import Joi from "joi";
import { RECOMMENDATION_VALUES } from "./mock-interview.types.js";

const rating = Joi.number().integer().min(1).max(5).required().messages({
  "any.required": "Rating is required",
  "number.base": "Rating must be a number",
  "number.min": "Rating must be between 1 and 5",
  "number.max": "Rating must be between 1 and 5",
});

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
  communicationRating: rating.messages({
    "any.required": "Communication rating is required",
  }),
  technicalRating: rating.messages({
    "any.required": "Technical rating is required",
  }),
  confidenceRating: rating.messages({
    "any.required": "Confidence rating is required",
  }),
  resumeRating: rating.messages({
    "any.required": "Resume rating is required",
  }),
  overallRating: rating.messages({
    "any.required": "Overall rating is required",
  }),
  recommendation: Joi.string()
    .valid(...RECOMMENDATION_VALUES)
    .required()
    .messages({
      "any.required": "Recommendation is required",
      "any.only": "Invalid recommendation value",
    }),
  feedback: Joi.string().trim().min(20).max(5000).required().messages({
    "any.required": "Overall feedback is required",
    "string.empty": "Overall feedback is required",
    "string.min": "Feedback must be at least 20 characters",
  }),
});

export const validateScheduleMockInterview = (data: unknown) =>
  scheduleSchema.validate(data, { abortEarly: false });

export const validatePublishMockInterviewFeedback = (data: unknown) =>
  feedbackSchema.validate(data, { abortEarly: false });

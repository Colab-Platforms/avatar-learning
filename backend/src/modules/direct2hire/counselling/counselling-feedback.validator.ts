import Joi from "joi";
import {
  ASSESSMENT_ALIGNMENT_OPTIONS,
  COMMUNICATION_RATING_OPTIONS,
  MOTIVATION_LEVEL_OPTIONS,
  OVERALL_POTENTIAL_OPTIONS,
  RECOMMENDED_COURSE_OPTIONS,
} from "./counselling-feedback.types.js";

const saveCounsellingFeedbackSchema = Joi.object({
  assessmentAlignment: Joi.string()
    .valid(...ASSESSMENT_ALIGNMENT_OPTIONS)
    .required()
    .messages({
      "any.only": "Please select a valid assessment alignment option",
      "any.required": "Assessment alignment is required",
    }),
  recommendedCourse: Joi.string()
    .valid(...RECOMMENDED_COURSE_OPTIONS)
    .required()
    .messages({
      "any.only": "Please select a valid recommended learning path",
      "any.required": "Recommended learning path is required",
    }),
  communicationRating: Joi.string()
    .valid(...COMMUNICATION_RATING_OPTIONS)
    .required()
    .messages({
      "any.only": "Please select a valid communication skills rating",
      "any.required": "Communication skills rating is required",
    }),
  motivationLevel: Joi.string()
    .valid(...MOTIVATION_LEVEL_OPTIONS)
    .required()
    .messages({
      "any.only": "Please select a valid motivation level",
      "any.required": "Motivation level is required",
    }),
  overallPotential: Joi.string()
    .valid(...OVERALL_POTENTIAL_OPTIONS)
    .required()
    .messages({
      "any.only": "Please select a valid overall potential rating",
      "any.required": "Overall potential is required",
    }),
  description: Joi.string().trim().allow("", null).optional(),
});

export function validateSaveCounsellingFeedback(body: unknown) {
  return saveCounsellingFeedbackSchema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
  });
}

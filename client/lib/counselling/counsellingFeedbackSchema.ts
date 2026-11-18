import { z } from "zod";
import {
  ASSESSMENT_ALIGNMENT_OPTIONS,
  COMMUNICATION_RATING_OPTIONS,
  MOTIVATION_LEVEL_OPTIONS,
  OVERALL_POTENTIAL_OPTIONS,
  RECOMMENDED_COURSE_OPTIONS,
} from "./counsellingFeedbackConstants";

const assessmentAlignmentValues = ASSESSMENT_ALIGNMENT_OPTIONS.map(
  (option) => option.value,
);
const recommendedCourseValues = RECOMMENDED_COURSE_OPTIONS.map(
  (option) => option.value,
);
const communicationRatingValues = COMMUNICATION_RATING_OPTIONS.map(
  (option) => option.value,
);
const motivationLevelValues = MOTIVATION_LEVEL_OPTIONS.map(
  (option) => option.value,
);
const overallPotentialValues = OVERALL_POTENTIAL_OPTIONS.map(
  (option) => option.value,
);

function requiredOption<T extends readonly string[]>(
  options: T,
  message: string,
) {
  return z
    .string()
    .min(1, message)
    .refine((value) => (options as readonly string[]).includes(value), message);
}

export const counsellingFeedbackSchema = z.object({
  assessmentAlignment: requiredOption(
    assessmentAlignmentValues,
    "Assessment alignment is required",
  ),
  recommendedCourse: requiredOption(
    recommendedCourseValues,
    "Recommended learning path is required",
  ),
  communicationRating: requiredOption(
    communicationRatingValues,
    "Communication skills rating is required",
  ),
  motivationLevel: requiredOption(
    motivationLevelValues,
    "Motivation level is required",
  ),
  overallPotential: requiredOption(
    overallPotentialValues,
    "Overall potential is required",
  ),
  description: z.string().optional(),
});

export type CounsellingFeedbackFormValues = z.infer<
  typeof counsellingFeedbackSchema
>;

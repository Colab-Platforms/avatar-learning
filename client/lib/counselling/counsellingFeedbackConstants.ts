export const ASSESSMENT_ALIGNMENT_OPTIONS = [
  {
    value: "YES_COMPLETELY_ALIGNED",
    label: "Yes, completely aligned",
  },
  {
    value: "MOSTLY_ALIGNED",
    label: "Mostly aligned",
  },
  {
    value: "PARTIALLY_ALIGNED",
    label: "Partially aligned",
  },
  {
    value: "NOT_ALIGNED",
    label: "Not aligned (Course recommendation changed)",
  },
] as const;

export const RECOMMENDED_COURSE_OPTIONS = [
  {
    value: "AI_FUNDAMENTALS_CHATGPT",
    label: "AI Fundamentals and ChatGPT Mastery",
  },
  {
    value: "AI_MASTERY_SOCIAL_MEDIA",
    label: "AI Mastery for Social Media Executives",
  },
] as const;

export const COMMUNICATION_RATING_OPTIONS = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "AVERAGE", label: "Average" },
  { value: "NEEDS_IMPROVEMENT", label: "Needs Improvement" },
] as const;

export const MOTIVATION_LEVEL_OPTIONS = [
  { value: "HIGHLY_MOTIVATED", label: "Highly Motivated" },
  { value: "MOTIVATED", label: "Motivated" },
  { value: "SOMEWHAT_MOTIVATED", label: "Somewhat Motivated" },
  { value: "EXPLORING_OPTIONS", label: "Exploring Options" },
  { value: "NOT_SURE", label: "Not Sure" },
] as const;

export const OVERALL_POTENTIAL_OPTIONS = [
  { value: "EXCELLENT_POTENTIAL", label: "Excellent Potential" },
  { value: "HIGH_POTENTIAL", label: "High Potential" },
  { value: "MODERATE_POTENTIAL", label: "Moderate Potential" },
  {
    value: "NEEDS_ADDITIONAL_GUIDANCE",
    label: "Needs Additional Guidance",
  },
] as const;

export type AssessmentAlignment =
  (typeof ASSESSMENT_ALIGNMENT_OPTIONS)[number]["value"];
export type RecommendedCourseOption =
  (typeof RECOMMENDED_COURSE_OPTIONS)[number]["value"];
export type CommunicationRating =
  (typeof COMMUNICATION_RATING_OPTIONS)[number]["value"];
export type MotivationLevel =
  (typeof MOTIVATION_LEVEL_OPTIONS)[number]["value"];
export type OverallPotential =
  (typeof OVERALL_POTENTIAL_OPTIONS)[number]["value"];

export interface CounsellingFeedback {
  id: string;
  userId: string;
  assessmentAlignment: AssessmentAlignment;
  recommendedCourse: RecommendedCourseOption;
  communicationRating: CommunicationRating;
  motivationLevel: MotivationLevel;
  overallPotential: OverallPotential;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCounsellingFeedbackPayload {
  assessmentAlignment: AssessmentAlignment;
  recommendedCourse: RecommendedCourseOption;
  communicationRating: CommunicationRating;
  motivationLevel: MotivationLevel;
  overallPotential: OverallPotential;
  description?: string | null;
}

const labelMaps = {
  assessmentAlignment: ASSESSMENT_ALIGNMENT_OPTIONS,
  recommendedCourse: RECOMMENDED_COURSE_OPTIONS,
  communicationRating: COMMUNICATION_RATING_OPTIONS,
  motivationLevel: MOTIVATION_LEVEL_OPTIONS,
  overallPotential: OVERALL_POTENTIAL_OPTIONS,
} as const;

export function getCounsellingFeedbackLabel<
  K extends keyof typeof labelMaps,
>(field: K, value: string | null | undefined): string {
  if (!value) return "—";
  const match = labelMaps[field].find((option) => option.value === value);
  return match?.label ?? value;
}

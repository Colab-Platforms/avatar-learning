export const ASSESSMENT_ALIGNMENT_OPTIONS = [
  "YES_COMPLETELY_ALIGNED",
  "MOSTLY_ALIGNED",
  "PARTIALLY_ALIGNED",
  "NOT_ALIGNED",
] as const;

export const RECOMMENDED_COURSE_OPTIONS = [
  "AI_FUNDAMENTALS_CHATGPT",
  "AI_MASTERY_SOCIAL_MEDIA",
] as const;

export const COMMUNICATION_RATING_OPTIONS = [
  "EXCELLENT",
  "GOOD",
  "AVERAGE",
  "NEEDS_IMPROVEMENT",
] as const;

export const MOTIVATION_LEVEL_OPTIONS = [
  "HIGHLY_MOTIVATED",
  "MOTIVATED",
  "SOMEWHAT_MOTIVATED",
  "EXPLORING_OPTIONS",
  "NOT_SURE",
] as const;

export const OVERALL_POTENTIAL_OPTIONS = [
  "EXCELLENT_POTENTIAL",
  "HIGH_POTENTIAL",
  "MODERATE_POTENTIAL",
  "NEEDS_ADDITIONAL_GUIDANCE",
] as const;

export type AssessmentAlignment = (typeof ASSESSMENT_ALIGNMENT_OPTIONS)[number];
export type RecommendedCourseOption =
  (typeof RECOMMENDED_COURSE_OPTIONS)[number];
export type CommunicationRating = (typeof COMMUNICATION_RATING_OPTIONS)[number];
export type MotivationLevel = (typeof MOTIVATION_LEVEL_OPTIONS)[number];
export type OverallPotential = (typeof OVERALL_POTENTIAL_OPTIONS)[number];

export interface SaveCounsellingFeedbackInput {
  assessmentAlignment: AssessmentAlignment;
  recommendedCourse: RecommendedCourseOption;
  communicationRating: CommunicationRating;
  motivationLevel: MotivationLevel;
  overallPotential: OverallPotential;
  description?: string | null;
}

export interface CounsellingFeedbackResponse {
  id: string;
  userId: string;
  assessmentAlignment: AssessmentAlignment;
  recommendedCourse: RecommendedCourseOption;
  communicationRating: CommunicationRating;
  motivationLevel: MotivationLevel;
  overallPotential: OverallPotential;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

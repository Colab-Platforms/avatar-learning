export type AssessmentTypeValue = "WEEKLY" | "FINAL";

export const WEEKLY_QUESTION_COUNT = 10;
export const FINAL_QUESTION_COUNT = 30;
export const DEFAULT_FINAL_MAX_ATTEMPTS = 3;

export interface CreateAssessmentBody {
  title: string;
  description?: string;
  type: AssessmentTypeValue;
  lessonId?: string | null;
  timeLimitMinutes: number;
  passingScorePercent?: number;
  maxTabSwitchWarnings?: number;
  maxAttempts?: number | null;
}

export interface UpdateAssessmentBody {
  title?: string;
  description?: string;
  timeLimitMinutes?: number;
  passingScorePercent?: number | null;
  maxTabSwitchWarnings?: number;
  maxAttempts?: number | null;
}

export interface AssessmentOptionInput {
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export interface CreateQuestionBody {
  questionText: string;
  points?: number;
  questionOrder: number;
  options: AssessmentOptionInput[];
}

export interface UpdateQuestionBody {
  questionText?: string;
  points?: number;
  questionOrder?: number;
  options?: AssessmentOptionInput[];
}

export interface SaveAnswerBody {
  selectedOptionId: string | null;
}

/** Default questions drawn per attempt (complementary halves of a 60-question bank). */
export const DEFAULT_QUESTIONS_PER_ATTEMPT = 30;

/** Default max attempts before an admin override is required. */
export const DEFAULT_MAX_ATTEMPTS = 2;

/** Cooldown between a failed attempt 1 and starting attempt 2. */
export const ATTEMPT_COOLDOWN_MS = 12 * 60 * 60 * 1000;

export interface CreatePlacementAssessmentBody {
  title: string;
  description?: string;
  timeLimitMinutes: number;
  passingScorePercent?: number;
  questionsPerAttempt?: number;
  maxTabSwitchWarnings?: number;
  maxAttempts?: number;
}

export interface UpdatePlacementAssessmentBody {
  title?: string;
  description?: string;
  timeLimitMinutes?: number;
  passingScorePercent?: number;
  questionsPerAttempt?: number;
  maxTabSwitchWarnings?: number;
  maxAttempts?: number;
}

export interface PlacementOptionInput {
  optionText: string;
  isCorrect: boolean;
  optionOrder: number;
}

export interface CreatePlacementQuestionBody {
  questionText: string;
  points?: number;
  questionOrder: number;
  options: PlacementOptionInput[];
}

export interface UpdatePlacementQuestionBody {
  questionText?: string;
  points?: number;
  questionOrder?: number;
  options?: PlacementOptionInput[];
}

export interface SavePlacementAnswerBody {
  selectedOptionId: string | null;
}

export interface GrantPlacementAttemptsBody {
  attemptsGranted: number;
  reason: string;
}

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

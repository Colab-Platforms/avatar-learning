export interface CreateAssessmentBody {
    title: string;
    description?: string;
    timeLimitMinutes: number;
    passingScorePercent?: number;
    maxTabSwitchWarnings?: number;
}

export interface UpdateAssessmentBody {
    title?: string;
    description?: string;
    timeLimitMinutes?: number;
    passingScorePercent?: number;
    maxTabSwitchWarnings?: number;
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

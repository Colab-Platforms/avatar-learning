import { StructuredOutputParser } from "@langchain/core/output_parsers";
import Joi from "joi";
import type {
  AiRecommendationOutput,
  QuestionnaireSnapshot,
} from "./recommendation.types.js";

export const recommendationOutputParser =
  StructuredOutputParser.fromNamesAndDescriptions({
    summary:
      "A concise 2-3 sentence overview of the student — their motivations, direction and readiness",
    reasoning:
      "A detailed narrative analysis of the student's interests, personality, learning style and career direction, drawn from their questionnaire answers",
    studentStrengths:
      "JSON array of 3-5 concrete strengths inferred from the questionnaire",
    growthAreas:
      "JSON array of 2-4 growth areas or skills the student should focus on developing",
  });

const aiRecommendationSchema = Joi.object({
  summary: Joi.string().trim().required(),
  reasoning: Joi.string().trim().required(),
  studentStrengths: Joi.array().items(Joi.string().trim()).min(1).required(),
  growthAreas: Joi.array().items(Joi.string().trim()).min(1).required(),
});

function formatAnswer(value: string, other?: string | null): string {
  if (value === "Other" && other?.trim()) {
    return `Other — ${other.trim()}`;
  }
  return value;
}

export function buildQuestionnaireContext(
  profile: QuestionnaireSnapshot,
): string {
  return JSON.stringify(
    {
      careerAndFuturePlans: {
        careerField: formatAnswer(
          profile.careerField,
          profile.careerFieldOther,
        ),
        futureGoal: formatAnswer(profile.futureGoal, profile.futureGoalOther),
        careerPriority: formatAnswer(
          profile.careerPriority,
          profile.careerPriorityOther,
        ),
        studyStream: formatAnswer(
          profile.studyStream,
          profile.studyStreamOther,
        ),
        planningChallenge: formatAnswer(
          profile.planningChallenge,
          profile.planningChallengeOther,
        ),
      },
      personalityAndPreferences: {
        freeTimeActivity: formatAnswer(
          profile.freeTimeActivity,
          profile.freeTimeOther,
        ),
        socialSetting: formatAnswer(
          profile.socialSetting,
          profile.socialSettingOther,
        ),
        workEnvironment: formatAnswer(
          profile.workEnvironment,
          profile.workEnvironmentOther,
        ),
        stressHandling: formatAnswer(
          profile.stressHandling,
          profile.stressHandlingOther,
        ),
        proudMoment: formatAnswer(
          profile.proudMoment,
          profile.proudMomentOther,
        ),
      },
      personalNote: profile.personalNote?.trim() || null,
    },
    null,
    2,
  );
}

export function parseRecommendationResponse(
  rawText: string,
): AiRecommendationOutput {
  const trimmed = rawText.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : trimmed;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const normalized =
    typeof parsed === "object" && parsed !== null
      ? {
          ...(parsed as Record<string, unknown>),
          studentStrengths: coerceStringArray(
            (parsed as Record<string, unknown>).studentStrengths,
          ),
          growthAreas: coerceStringArray(
            (parsed as Record<string, unknown>).growthAreas,
          ),
        }
      : parsed;

  const { error, value } = aiRecommendationSchema.validate(normalized, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return value as AiRecommendationOutput;
}

function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

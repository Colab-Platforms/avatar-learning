import prisma from "@root/prisma.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  getGroqModel,
  getGroqModelName,
  getGroqProviderName,
} from "@/lib/langchain/groqModel.js";
import { normalizeMessageContent } from "@/lib/langchain/normalizeContent.js";
import { logger } from "@/utils/logger.js";
import {
  DIRECT2HIRE_COURSE_CATALOG,
  getCourseBySlug,
  RECOMMENDATION_PROMPT_VERSION,
} from "./recommendation.constants.js";
import { buildRecommendationPrompt } from "./recommendation.prompt.js";
import { parseRecommendationResponse } from "./recommendation.parser.js";
import type {
  CourseRecommendationResponse,
  QuestionnaireSnapshot,
} from "./recommendation.types.js";
import type { CounsellingProfile, CourseRecommendation } from "@prisma/client";

function toResponse(
  record: CourseRecommendation | null,
): CourseRecommendationResponse | null {
  if (!record) return null;

  return {
    id: record.id,
    userId: record.userId,
    counsellingProfileId: record.counsellingProfileId,
    recommendedCourseId: record.recommendedCourseId,
    recommendedCourseSlug: record.recommendedCourseSlug,
    recommendedCourseTitle: record.recommendedCourseTitle,
    confidenceScore: record.confidenceScore,
    reasoning: record.reasoning,
    studentStrengths: Array.isArray(record.studentStrengths)
      ? (record.studentStrengths as string[])
      : null,
    growthAreas: Array.isArray(record.growthAreas)
      ? (record.growthAreas as string[])
      : null,
    summary: record.summary,
    provider: record.provider,
    model: record.model,
    promptVersion: record.promptVersion,
    generatedAt: record.generatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function profileToSnapshot(profile: CounsellingProfile): QuestionnaireSnapshot {
  return {
    careerField: profile.careerField,
    careerFieldOther: profile.careerFieldOther,
    futureGoal: profile.futureGoal,
    futureGoalOther: profile.futureGoalOther,
    careerPriority: profile.careerPriority,
    careerPriorityOther: profile.careerPriorityOther,
    studyStream: profile.studyStream,
    studyStreamOther: profile.studyStreamOther,
    planningChallenge: profile.planningChallenge,
    planningChallengeOther: profile.planningChallengeOther,
    aiUnderstanding: profile.aiUnderstanding,
    aiUnderstandingOther: profile.aiUnderstandingOther,
    aiFieldImpact: profile.aiFieldImpact,
    aiFieldImpactOther: profile.aiFieldImpactOther,
    aiSkillBuilding: profile.aiSkillBuilding,
    aiSkillBuildingOther: profile.aiSkillBuildingOther,
    freeTimeActivity: profile.freeTimeActivity,
    freeTimeOther: profile.freeTimeOther,
    socialSetting: profile.socialSetting,
    socialSettingOther: profile.socialSettingOther,
    workEnvironment: profile.workEnvironment,
    workEnvironmentOther: profile.workEnvironmentOther,
    stressHandling: profile.stressHandling,
    stressHandlingOther: profile.stressHandlingOther,
    proudMoment: profile.proudMoment,
    proudMomentOther: profile.proudMomentOther,
    aiEverydayUse: profile.aiEverydayUse,
    aiEverydayUseOther: profile.aiEverydayUseOther,
    aiCuriosity: profile.aiCuriosity,
    aiCuriosityOther: profile.aiCuriosityOther,
    personalNote: profile.personalNote,
  };
}

export class RecommendationService {
  async getByUserId(userId: string) {
    return prisma.courseRecommendation.findUnique({
      where: { userId },
    });
  }

  async getByCounsellingProfileId(counsellingProfileId: string) {
    return prisma.courseRecommendation.findUnique({
      where: { counsellingProfileId },
    });
  }

  async getResponseByUserId(
    userId: string,
  ): Promise<CourseRecommendationResponse | null> {
    const record = await this.getByUserId(userId);
    return toResponse(record);
  }

  async generateForProfile(
    userId: string,
    profile: CounsellingProfile,
  ): Promise<CourseRecommendationResponse | null> {
    const existing = await this.getByCounsellingProfileId(profile.id);
    if (existing) {
      logger.info(
        `Returning existing course recommendation for profile ${profile.id}`,
      );
      return toResponse(existing);
    }

    try {
      const prompt = buildRecommendationPrompt(profileToSnapshot(profile));
      const model = getGroqModel({ temperature: 0.1, maxTokens: 1800 });

      const response = await model.invoke([
        new SystemMessage(
          "You are a deterministic course recommendation engine. Respond with JSON only.",
        ),
        new HumanMessage(prompt),
      ]);

      const rawText = normalizeMessageContent(response.content).trim();
      const parsed = parseRecommendationResponse(rawText);
      const matchedCourse = getCourseBySlug(parsed.recommendedCourseSlug);

      if (!matchedCourse) {
        throw new Error(
          `Recommended course slug "${parsed.recommendedCourseSlug}" is not in the Direct2Hire catalog`,
        );
      }

      const saved = await prisma.courseRecommendation.create({
        data: {
          userId,
          counsellingProfileId: profile.id,
          recommendedCourseId: matchedCourse.id,
          recommendedCourseSlug: matchedCourse.slug,
          recommendedCourseTitle: matchedCourse.title,
          confidenceScore: parsed.confidenceScore,
          reasoning: parsed.reasoning,
          studentStrengths: parsed.studentStrengths,
          growthAreas: parsed.growthAreas,
          summary: parsed.summary,
          provider: getGroqProviderName(),
          model: getGroqModelName(),
          promptVersion: RECOMMENDATION_PROMPT_VERSION,
          rawResponse: {
            text: rawText,
            parsed: {
              recommendedCourseSlug: parsed.recommendedCourseSlug,
              recommendedCourseTitle: parsed.recommendedCourseTitle,
              confidenceScore: parsed.confidenceScore,
              summary: parsed.summary,
              reasoning: parsed.reasoning,
              studentStrengths: parsed.studentStrengths,
              growthAreas: parsed.growthAreas,
            },
            courseCatalogSize: DIRECT2HIRE_COURSE_CATALOG.length,
          },
          generatedAt: new Date(),
        },
      });

      logger.info(
        `Generated course recommendation ${saved.id} for profile ${profile.id}`,
      );

      return toResponse(saved);
    } catch (error) {
      logger.error(
        `Course recommendation generation failed for profile ${profile.id}`,
        error,
      );
      return null;
    }
  }
}

import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AssessmentAttempt, AssessmentAttemptStatus } from "@prisma/client";
import {
  CreateAssessmentBody,
  UpdateAssessmentBody,
  CreateQuestionBody,
  UpdateQuestionBody,
} from "./assessment.types.js";

// ─── Admin Service ────────────────────────────────────────────────────────────

export class AdminAssessmentService {
  private async getAssessmentById(assessmentId: string) {
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);
    return assessment;
  }

  async createAssessment(courseId: string, data: CreateAssessmentBody) {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

    const existing = await prisma.assessment.findUnique({ where: { courseId } });
    if (existing) throw new ApiError("This course already has an assessment", STATUS_CODES.CONFLICT);

    return prisma.assessment.create({ data: { ...data, courseId } });
  }

  async getAssessmentForAdmin(courseId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { courseId },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
          include: { options: { orderBy: { optionOrder: "asc" } } },
        },
        _count: { select: { attempts: true } },
      },
    });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);
    return assessment;
  }

  async updateAssessment(assessmentId: string, data: UpdateAssessmentBody) {
    await this.getAssessmentById(assessmentId);
    return prisma.assessment.update({ where: { id: assessmentId }, data });
  }

  async deleteAssessment(assessmentId: string) {
    await this.getAssessmentById(assessmentId);
    return prisma.assessment.delete({ where: { id: assessmentId } });
  }

  async togglePublish(assessmentId: string) {
    const assessment = await this.getAssessmentById(assessmentId);
    return prisma.assessment.update({
      where: { id: assessmentId },
      data: { isPublished: !assessment.isPublished },
    });
  }

  async createQuestion(assessmentId: string, data: CreateQuestionBody) {
    await this.getAssessmentById(assessmentId);

    const existing = await prisma.assessmentQuestion.findUnique({
      where: { assessmentId_questionOrder: { assessmentId, questionOrder: data.questionOrder } },
    });
    if (existing) throw new ApiError("A question with this order already exists", STATUS_CODES.CONFLICT);

    return prisma.assessmentQuestion.create({
      data: {
        assessmentId,
        questionText: data.questionText,
        points: data.points ?? 1,
        questionOrder: data.questionOrder,
        options: {
          create: data.options.map((o) => ({
            optionText: o.optionText,
            isCorrect: o.isCorrect,
            optionOrder: o.optionOrder,
          })),
        },
      },
      include: { options: { orderBy: { optionOrder: "asc" } } },
    });
  }

  async updateQuestion(questionId: string, data: UpdateQuestionBody) {
    const question = await prisma.assessmentQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new ApiError("Question not found", STATUS_CODES.NOT_FOUND);

    const { options, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      if (options !== undefined) {
        await tx.assessmentOption.deleteMany({ where: { questionId } });
      }
      return tx.assessmentQuestion.update({
        where: { id: questionId },
        data: {
          ...rest,
          ...(options !== undefined && {
            options: {
              create: options.map((o) => ({
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                optionOrder: o.optionOrder,
              })),
            },
          }),
        },
        include: { options: { orderBy: { optionOrder: "asc" } } },
      });
    });
  }

  async deleteQuestion(questionId: string) {
    const question = await prisma.assessmentQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new ApiError("Question not found", STATUS_CODES.NOT_FOUND);
    return prisma.assessmentQuestion.delete({ where: { id: questionId } });
  }

  async listAttempts(assessmentId: string) {
    await this.getAssessmentById(assessmentId);
    return prisma.assessmentAttempt.findMany({
      where: { assessmentId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAttemptDetail(attemptId: string) {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        answers: { include: { question: true, selectedOption: true } },
      },
    });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);
    return attempt;
  }

  async resetAttempt(attemptId: string) {
    const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);
    return prisma.assessmentAttempt.delete({ where: { id: attemptId } });
  }
}

// ─── User Service ─────────────────────────────────────────────────────────────

export class UserAssessmentService {
  private async getOwnedAttempt(attemptId: string, userId: string): Promise<AssessmentAttempt> {
    const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);
    if (attempt.userId !== userId) throw new ApiError("Not authorized", STATUS_CODES.FORBIDDEN);
    return attempt;
  }

  /** Scores every answer against the correct option, snapshots totals, and closes the attempt. */
  private async finalizeAttempt(attemptId: string, status: AssessmentAttemptStatus) {
    const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);

    const questions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId: attempt.assessmentId },
      include: { options: { where: { isCorrect: true }, select: { id: true } } },
    });
    const answers = await prisma.assessmentAnswer.findMany({ where: { attemptId } });
    const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));

    let score = 0;
    let maxScore = 0;
    for (const q of questions) {
      maxScore += q.points;
      const correctOptionId = q.options[0]?.id ?? null;
      const answer = answerByQuestion.get(q.id);
      if (!answer) continue;

      const isCorrect = !!answer.selectedOptionId && answer.selectedOptionId === correctOptionId;
      const pointsAwarded = isCorrect ? q.points : 0;
      if (isCorrect) score += q.points;

      await prisma.assessmentAnswer.update({
        where: { id: answer.id },
        data: { isCorrect, pointsAwarded },
      });
    }

    const assessment = await prisma.assessment.findUnique({ where: { id: attempt.assessmentId } });
    const scorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const isPassed =
      assessment?.passingScorePercent != null ? scorePercent >= assessment.passingScorePercent : null;

    return prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { status, submittedAt: new Date(), score, maxScore, scorePercent, isPassed },
    });
  }

  /** Server-authoritative expiry check — called at the top of every attempt-touching method. */
  private async checkAndLazilyExpire(attempt: AssessmentAttempt): Promise<AssessmentAttempt> {
    if (attempt.status !== "IN_PROGRESS") return attempt;
    const deadline = new Date(attempt.startedAt.getTime() + attempt.timeLimitMinutes * 60_000);
    if (new Date() > deadline) {
      return this.finalizeAttempt(attempt.id, "AUTO_SUBMITTED_TIMEOUT");
    }
    return attempt;
  }

  async getAssessmentForUser(courseId: string, userId: string) {
    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ApiError("You are not enrolled in this course", STATUS_CODES.FORBIDDEN);
    if (!enrollment.isCompleted) {
      throw new ApiError("Complete all course topics before taking the assessment", STATUS_CODES.FORBIDDEN);
    }

    const assessment = await prisma.assessment.findFirst({
      where: { courseId, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimitMinutes: true,
        passingScorePercent: true,
        maxTabSwitchWarnings: true,
        questions: { select: { id: true } },
      },
    });
    if (!assessment) throw new ApiError("Assessment not available for this course", STATUS_CODES.NOT_FOUND);

    const existing = await prisma.assessmentAttempt.findUnique({
      where: { userId_assessmentId: { userId, assessmentId: assessment.id } },
    });
    const attempt = existing ? await this.checkAndLazilyExpire(existing) : null;

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      timeLimitMinutes: assessment.timeLimitMinutes,
      passingScorePercent: assessment.passingScorePercent,
      maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
      questionCount: assessment.questions.length,
      attempt,
    };
  }

  async startAttempt(courseId: string, userId: string) {
    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ApiError("You are not enrolled in this course", STATUS_CODES.FORBIDDEN);
    if (!enrollment.isCompleted) {
      throw new ApiError("Complete all course topics before taking the assessment", STATUS_CODES.FORBIDDEN);
    }

    const assessment = await prisma.assessment.findFirst({
      where: { courseId, isPublished: true },
      include: { _count: { select: { questions: true } } },
    });
    if (!assessment) throw new ApiError("Assessment not available for this course", STATUS_CODES.NOT_FOUND);
    if (assessment._count.questions === 0) {
      throw new ApiError("This assessment has no questions yet", STATUS_CODES.BAD_REQUEST);
    }

    const existing = await prisma.assessmentAttempt.findUnique({
      where: { userId_assessmentId: { userId, assessmentId: assessment.id } },
    });
    if (existing) {
      const resolved = await this.checkAndLazilyExpire(existing);
      if (resolved.status === "IN_PROGRESS") return resolved; // resume
      throw new ApiError("You have already attempted this assessment", STATUS_CODES.CONFLICT);
    }

    return prisma.assessmentAttempt.create({
      data: { userId, assessmentId: assessment.id, timeLimitMinutes: assessment.timeLimitMinutes },
    });
  }

  async getAttemptState(attemptId: string, userId: string) {
    const owned = await this.getOwnedAttempt(attemptId, userId);
    const attempt = await this.checkAndLazilyExpire(owned);

    const assessment = await prisma.assessment.findUnique({
      where: { id: attempt.assessmentId },
      select: {
        id: true,
        title: true,
        maxTabSwitchWarnings: true,
        questions: {
          orderBy: { questionOrder: "asc" },
          select: {
            id: true,
            questionText: true,
            points: true,
            questionOrder: true,
            options: {
              orderBy: { optionOrder: "asc" },
              select: { id: true, optionText: true, optionOrder: true },
            },
          },
        },
      },
    });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);

    const answers = await prisma.assessmentAnswer.findMany({ where: { attemptId } });
    const answerMap = Object.fromEntries(answers.map((a) => [a.questionId, a.selectedOptionId]));

    const deadline = new Date(attempt.startedAt.getTime() + attempt.timeLimitMinutes * 60_000);

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        tabSwitchCount: attempt.tabSwitchCount,
        startedAt: attempt.startedAt,
        deadline,
        score: attempt.score,
        maxScore: attempt.maxScore,
        scorePercent: attempt.scorePercent,
        isPassed: attempt.isPassed,
      },
      assessment,
      answers: answerMap,
    };
  }

  async saveAnswer(attemptId: string, userId: string, questionId: string, selectedOptionId: string | null) {
    const owned = await this.getOwnedAttempt(attemptId, userId);
    const attempt = await this.checkAndLazilyExpire(owned);
    if (attempt.status !== "IN_PROGRESS") {
      throw new ApiError("This attempt has already been finished", STATUS_CODES.CONFLICT);
    }

    const question = await prisma.assessmentQuestion.findUnique({ where: { id: questionId } });
    if (!question || question.assessmentId !== attempt.assessmentId) {
      throw new ApiError("Question not found", STATUS_CODES.NOT_FOUND);
    }

    if (selectedOptionId) {
      const option = await prisma.assessmentOption.findUnique({ where: { id: selectedOptionId } });
      if (!option || option.questionId !== questionId) {
        throw new ApiError("Option not found", STATUS_CODES.NOT_FOUND);
      }
    }

    return prisma.assessmentAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: { attemptId, questionId, selectedOptionId },
      update: { selectedOptionId, answeredAt: new Date() },
    });
  }

  async reportViolation(attemptId: string, userId: string) {
    const owned = await this.getOwnedAttempt(attemptId, userId);
    const attempt = await this.checkAndLazilyExpire(owned);

    if (attempt.status !== "IN_PROGRESS") {
      return { tabSwitchCount: attempt.tabSwitchCount, maxTabSwitchWarnings: 0, status: attempt.status, autoSubmitted: false };
    }

    const assessment = await prisma.assessment.findUnique({ where: { id: attempt.assessmentId } });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);

    const updated = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: { tabSwitchCount: { increment: 1 } },
    });

    if (updated.tabSwitchCount >= assessment.maxTabSwitchWarnings) {
      const finalized = await this.finalizeAttempt(attemptId, "AUTO_SUBMITTED_VIOLATION");
      return {
        tabSwitchCount: finalized.tabSwitchCount,
        maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
        status: finalized.status,
        autoSubmitted: true,
      };
    }

    return {
      tabSwitchCount: updated.tabSwitchCount,
      maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
      status: updated.status,
      autoSubmitted: false,
    };
  }

  async submitAttempt(attemptId: string, userId: string) {
    const owned = await this.getOwnedAttempt(attemptId, userId);
    const attempt = await this.checkAndLazilyExpire(owned);
    if (attempt.status !== "IN_PROGRESS") return attempt; // idempotent
    return this.finalizeAttempt(attemptId, "SUBMITTED");
  }

  async getAttemptResult(attemptId: string, userId: string) {
    const owned = await this.getOwnedAttempt(attemptId, userId);
    const attempt = await this.checkAndLazilyExpire(owned);
    if (attempt.status === "IN_PROGRESS") {
      throw new ApiError("Attempt is still in progress", STATUS_CODES.CONFLICT);
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: attempt.assessmentId },
      select: {
        id: true,
        title: true,
        passingScorePercent: true,
        questions: {
          orderBy: { questionOrder: "asc" },
          select: {
            id: true,
            questionText: true,
            points: true,
            questionOrder: true,
            options: {
              orderBy: { optionOrder: "asc" },
              select: { id: true, optionText: true, optionOrder: true, isCorrect: true },
            },
          },
        },
      },
    });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);

    const answers = await prisma.assessmentAnswer.findMany({ where: { attemptId } });
    const answerMap = Object.fromEntries(answers.map((a) => [a.questionId, a]));

    return { attempt, assessment, answers: answerMap };
  }
}

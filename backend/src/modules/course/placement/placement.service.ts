import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { PlacementAttempt, PlacementAttemptStatus } from "@prisma/client";
import {
  CreatePlacementAssessmentBody,
  UpdatePlacementAssessmentBody,
  CreatePlacementQuestionBody,
  UpdatePlacementQuestionBody,
  GrantPlacementAttemptsBody,
} from "./placement.types.js";
import {
  computeDurationSeconds,
  getNextAttemptNumber,
  getPlacementAttemptAllowance,
  getPlacementAttemptHistory,
} from "./placement.attempt-policy.js";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Admin Service ────────────────────────────────────────────────────────────

export class AdminPlacementService {
  private async getAssessmentById(assessmentId: string) {
    const assessment = await prisma.placementAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new ApiError("Placement assessment not found", STATUS_CODES.NOT_FOUND);
    return assessment;
  }

  async createAssessment(courseId: string, data: CreatePlacementAssessmentBody) {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

    const existing = await prisma.placementAssessment.findUnique({ where: { courseId } });
    if (existing) throw new ApiError("This course already has a placement assessment", STATUS_CODES.CONFLICT);

    return prisma.placementAssessment.create({ data: { ...data, courseId } });
  }

  async getAssessmentForAdmin(courseId: string) {
    const assessment = await prisma.placementAssessment.findUnique({
      where: { courseId },
      include: {
        questions: {
          orderBy: { questionOrder: "asc" },
          include: { options: { orderBy: { optionOrder: "asc" } } },
        },
        _count: { select: { attempts: true } },
      },
    });
    if (!assessment) throw new ApiError("Placement assessment not found", STATUS_CODES.NOT_FOUND);
    return assessment;
  }

  async updateAssessment(assessmentId: string, data: UpdatePlacementAssessmentBody) {
    await this.getAssessmentById(assessmentId);
    return prisma.placementAssessment.update({ where: { id: assessmentId }, data });
  }

  async deleteAssessment(assessmentId: string) {
    await this.getAssessmentById(assessmentId);
    return prisma.placementAssessment.delete({ where: { id: assessmentId } });
  }

  async togglePublish(assessmentId: string) {
    const assessment = await this.getAssessmentById(assessmentId);
    return prisma.placementAssessment.update({
      where: { id: assessmentId },
      data: { isPublished: !assessment.isPublished },
    });
  }

  async createQuestion(assessmentId: string, data: CreatePlacementQuestionBody) {
    await this.getAssessmentById(assessmentId);

    const existing = await prisma.placementQuestion.findUnique({
      where: {
        placementAssessmentId_questionOrder: { placementAssessmentId: assessmentId, questionOrder: data.questionOrder },
      },
    });
    if (existing) throw new ApiError("A question with this order already exists", STATUS_CODES.CONFLICT);

    return prisma.placementQuestion.create({
      data: {
        placementAssessmentId: assessmentId,
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

  async updateQuestion(questionId: string, data: UpdatePlacementQuestionBody) {
    const question = await prisma.placementQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new ApiError("Question not found", STATUS_CODES.NOT_FOUND);

    const { options, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      if (options !== undefined) {
        await tx.placementOption.deleteMany({ where: { questionId } });
      }
      return tx.placementQuestion.update({
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
    const question = await prisma.placementQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new ApiError("Question not found", STATUS_CODES.NOT_FOUND);
    return prisma.placementQuestion.delete({ where: { id: questionId } });
  }

  async listAttempts(assessmentId: string) {
    await this.getAssessmentById(assessmentId);
    return prisma.placementAttempt.findMany({
      where: { placementAssessmentId: assessmentId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getAttemptDetail(attemptId: string) {
    const attempt = await prisma.placementAttempt.findUnique({
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
    const attempt = await prisma.placementAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);
    return prisma.placementAttempt.delete({ where: { id: attemptId } });
  }

  async getStudentPlacementSummary(userId: string) {
    const booking = await prisma.counsellingBooking.findUnique({
      where: { userId },
      select: { selectedCourseId: true, selectedCourse: { select: { id: true, title: true } } },
    });
    const courseId = booking?.selectedCourseId;
    if (!courseId) {
      return { course: null, assessment: null, summary: null };
    }

    const assessment = await prisma.placementAssessment.findUnique({
      where: { courseId },
      select: { id: true, title: true, maxAttempts: true, passingScorePercent: true },
    });
    if (!assessment) {
      return { course: booking.selectedCourse, assessment: null, summary: null };
    }

    const allowance = await getPlacementAttemptAllowance(userId, assessment.id);
    const history = await getPlacementAttemptHistory(userId, assessment.id);
    const activeAttempt = await prisma.placementAttempt.findFirst({
      where: { userId, placementAssessmentId: assessment.id, status: "IN_PROGRESS" },
      select: { id: true },
    });
    const highestScore = history.reduce<number | null>((best, attempt) => {
      if (attempt.scorePercent == null) return best;
      return best == null ? attempt.scorePercent : Math.max(best, attempt.scorePercent);
    }, null);
    const latestAttempt = history[0] ?? null;

    return {
      course: booking.selectedCourse,
      assessment: { id: assessment.id, title: assessment.title },
      summary: {
        ...allowance,
        highestScore,
        latestScore: latestAttempt?.scorePercent ?? null,
        currentStatus: allowance.hasPassed
          ? "PASSED"
          : activeAttempt
            ? "IN_PROGRESS"
            : allowance.attemptsUsed > 0 && allowance.remainingAttempts === 0
              ? "EXHAUSTED"
              : allowance.attemptsUsed > 0
                ? "FAILED"
                : "NOT_STARTED",
      },
    };
  }

  async getStudentPlacementAttempts(userId: string) {
    const booking = await prisma.counsellingBooking.findUnique({
      where: { userId },
      select: { selectedCourseId: true },
    });
    if (!booking?.selectedCourseId) {
      throw new ApiError("Student has not selected a Direct2Hire course", STATUS_CODES.BAD_REQUEST);
    }

    const assessment = await prisma.placementAssessment.findUnique({
      where: { courseId: booking.selectedCourseId },
      select: { id: true },
    });
    if (!assessment) {
      throw new ApiError("Placement assessment not found for this course", STATUS_CODES.NOT_FOUND);
    }

    return getPlacementAttemptHistory(userId, assessment.id);
  }

  async getStudentPlacementOverrides(userId: string) {
    const booking = await prisma.counsellingBooking.findUnique({
      where: { userId },
      select: { selectedCourseId: true },
    });
    if (!booking?.selectedCourseId) {
      throw new ApiError("Student has not selected a Direct2Hire course", STATUS_CODES.BAD_REQUEST);
    }

    const assessment = await prisma.placementAssessment.findUnique({
      where: { courseId: booking.selectedCourseId },
      select: { id: true },
    });
    if (!assessment) {
      throw new ApiError("Placement assessment not found for this course", STATUS_CODES.NOT_FOUND);
    }

    return prisma.placementAttemptOverride.findMany({
      where: { userId, placementAssessmentId: assessment.id },
      include: {
        grantedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async grantExtraAttempts(userId: string, adminUserId: string, data: GrantPlacementAttemptsBody) {
    const booking = await prisma.counsellingBooking.findUnique({
      where: { userId },
      select: { selectedCourseId: true },
    });
    if (!booking?.selectedCourseId) {
      throw new ApiError("Student has not selected a Direct2Hire course", STATUS_CODES.BAD_REQUEST);
    }

    const assessment = await prisma.placementAssessment.findUnique({
      where: { courseId: booking.selectedCourseId },
      select: { id: true },
    });
    if (!assessment) {
      throw new ApiError("Placement assessment not found for this course", STATUS_CODES.NOT_FOUND);
    }

    return prisma.placementAttemptOverride.create({
      data: {
        userId,
        placementAssessmentId: assessment.id,
        grantedById: adminUserId,
        attemptsGranted: data.attemptsGranted,
        reason: data.reason,
      },
      include: {
        grantedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }
}

// ─── User Service ─────────────────────────────────────────────────────────────

export class UserPlacementService {
  private async getOwnedAttempt(attemptId: string, userId: string): Promise<PlacementAttempt> {
    const attempt = await prisma.placementAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);
    if (attempt.userId !== userId) throw new ApiError("Not authorized", STATUS_CODES.FORBIDDEN);
    return attempt;
  }

  private async assertEnrolled(courseId: string, userId: string) {
    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ApiError("You are not enrolled in this course", STATUS_CODES.FORBIDDEN);
  }

  /** Scores every answer (within the attempt's randomized question set) and closes the attempt. */
  private async finalizeAttempt(attemptId: string, status: PlacementAttemptStatus) {
    const attempt = await prisma.placementAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);

    const questions = await prisma.placementQuestion.findMany({
      where: { id: { in: attempt.questionIds } },
      include: { options: { where: { isCorrect: true }, select: { id: true } } },
    });
    const answers = await prisma.placementAnswer.findMany({ where: { attemptId } });
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

      await prisma.placementAnswer.update({
        where: { id: answer.id },
        data: { isCorrect, pointsAwarded },
      });
    }

    const assessment = await prisma.placementAssessment.findUnique({ where: { id: attempt.placementAssessmentId } });
    const scorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const isPassed = assessment ? scorePercent >= assessment.passingScorePercent : null;
    const submittedAt = new Date();
    const durationSeconds = computeDurationSeconds(attempt.startedAt, submittedAt);

    return prisma.placementAttempt.update({
      where: { id: attemptId },
      data: { status, submittedAt, durationSeconds, score, maxScore, scorePercent, isPassed },
    });
  }

  /** Server-authoritative expiry check — called at the top of every attempt-touching method. */
  private async checkAndLazilyExpire(attempt: PlacementAttempt): Promise<PlacementAttempt> {
    if (attempt.status !== "IN_PROGRESS") return attempt;
    const deadline = new Date(attempt.startedAt.getTime() + attempt.timeLimitMinutes * 60_000);
    if (new Date() > deadline) {
      return this.finalizeAttempt(attempt.id, "AUTO_SUBMITTED_TIMEOUT");
    }
    return attempt;
  }

  /** True if the most recently finalized attempt for this assessment was a pass. */
  private async computeMockInterviewUnlocked(assessmentId: string, userId: string): Promise<boolean> {
    const latestFinalized = await prisma.placementAttempt.findFirst({
      where: { placementAssessmentId: assessmentId, userId, status: { not: "IN_PROGRESS" } },
      orderBy: { submittedAt: "desc" },
    });
    return latestFinalized?.isPassed === true;
  }

  async getAssessmentForUser(courseId: string, userId: string) {
    await this.assertEnrolled(courseId, userId);

    const assessment = await prisma.placementAssessment.findFirst({
      where: { courseId, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        timeLimitMinutes: true,
        passingScorePercent: true,
        questionsPerAttempt: true,
        maxTabSwitchWarnings: true,
        maxAttempts: true,
        questions: { select: { id: true } },
      },
    });
    if (!assessment) throw new ApiError("Placement assessment not available for this course", STATUS_CODES.NOT_FOUND);

    const existing = await prisma.placementAttempt.findFirst({
      where: { userId, placementAssessmentId: assessment.id, status: "IN_PROGRESS" },
    });
    const activeAttempt = existing ? await this.checkAndLazilyExpire(existing) : null;

    const latestAttempt = await prisma.placementAttempt.findFirst({
      where: { userId, placementAssessmentId: assessment.id, status: { not: "IN_PROGRESS" } },
      orderBy: { submittedAt: "desc" },
    });

    const allowance = await getPlacementAttemptAllowance(userId, assessment.id);
    const history = await getPlacementAttemptHistory(userId, assessment.id);
    const highestScore = history.reduce<number | null>((best, attempt) => {
      if (attempt.scorePercent == null) return best;
      return best == null ? attempt.scorePercent : Math.max(best, attempt.scorePercent);
    }, null);

    const currentStatus = allowance.hasPassed
      ? "PASSED"
      : activeAttempt
        ? "IN_PROGRESS"
        : allowance.attemptsUsed > 0 && allowance.remainingAttempts === 0
          ? "EXHAUSTED"
          : allowance.attemptsUsed > 0
            ? "FAILED"
            : "NOT_STARTED";

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      timeLimitMinutes: assessment.timeLimitMinutes,
      passingScorePercent: assessment.passingScorePercent,
      questionsPerAttempt: assessment.questionsPerAttempt,
      maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
      totalQuestionCount: assessment.questions.length,
      attempt: activeAttempt,
      latestAttempt,
      mockInterviewUnlocked: allowance.hasPassed,
      defaultMaxAttempts: allowance.defaultMaxAttempts,
      extraAttemptsGranted: allowance.extraAttemptsGranted,
      effectiveMaxAttempts: allowance.effectiveMaxAttempts,
      attemptsUsed: allowance.attemptsUsed,
      remainingAttempts: allowance.remainingAttempts,
      hasPassed: allowance.hasPassed,
      canStartNewAttempt: allowance.canStartNewAttempt && !activeAttempt,
      assessmentCompleted: allowance.assessmentCompleted,
      assessmentCompletionDate: allowance.assessmentCompletionDate,
      highestScore,
      latestScore: latestAttempt?.scorePercent ?? null,
      currentStatus,
    };
  }

  async listAttemptHistory(courseId: string, userId: string) {
    await this.assertEnrolled(courseId, userId);

    const assessment = await prisma.placementAssessment.findFirst({
      where: { courseId, isPublished: true },
      select: { id: true },
    });
    if (!assessment) throw new ApiError("Placement assessment not available for this course", STATUS_CODES.NOT_FOUND);

    return getPlacementAttemptHistory(userId, assessment.id);
  }

  async startAttempt(courseId: string, userId: string) {
    await this.assertEnrolled(courseId, userId);

    const assessment = await prisma.placementAssessment.findFirst({
      where: { courseId, isPublished: true },
      include: { questions: { select: { id: true } } },
    });
    if (!assessment) throw new ApiError("Placement assessment not available for this course", STATUS_CODES.NOT_FOUND);
    if (assessment.questions.length < assessment.questionsPerAttempt) {
      throw new ApiError(
        `This assessment needs at least ${assessment.questionsPerAttempt} questions to start`,
        STATUS_CODES.BAD_REQUEST,
      );
    }

    const existing = await prisma.placementAttempt.findFirst({
      where: { userId, placementAssessmentId: assessment.id, status: "IN_PROGRESS" },
    });
    if (existing) {
      return this.checkAndLazilyExpire(existing); // resume in-progress attempt
    }

    const allowance = await getPlacementAttemptAllowance(userId, assessment.id);
    if (allowance.hasPassed) {
      throw new ApiError(
        "Assessment already passed. No further attempts are allowed.",
        STATUS_CODES.CONFLICT,
      );
    }
    if (!allowance.canStartNewAttempt) {
      throw new ApiError("Maximum assessment attempts reached.", STATUS_CODES.CONFLICT);
    }

    const questionIds = shuffle(assessment.questions.map((q) => q.id)).slice(0, assessment.questionsPerAttempt);
    const attemptNumber = await getNextAttemptNumber(userId, assessment.id);

    return prisma.placementAttempt.create({
      data: {
        userId,
        placementAssessmentId: assessment.id,
        timeLimitMinutes: assessment.timeLimitMinutes,
        questionIds,
        attemptNumber,
      },
    });
  }

  async getAttemptState(attemptId: string, userId: string) {
    const owned = await this.getOwnedAttempt(attemptId, userId);
    const attempt = await this.checkAndLazilyExpire(owned);

    const assessment = await prisma.placementAssessment.findUnique({ where: { id: attempt.placementAssessmentId } });
    if (!assessment) throw new ApiError("Placement assessment not found", STATUS_CODES.NOT_FOUND);

    const questions = await prisma.placementQuestion.findMany({
      where: { id: { in: attempt.questionIds } },
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
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    // Re-project in the attempt's stored (randomized) order, re-numbering questionOrder 1..n for display.
    const orderedQuestions = attempt.questionIds
      .map((id, idx) => {
        const q = questionMap.get(id);
        return q ? { ...q, questionOrder: idx + 1 } : null;
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    const answers = await prisma.placementAnswer.findMany({ where: { attemptId } });
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
      assessment: {
        id: assessment.id,
        title: assessment.title,
        maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
        questions: orderedQuestions,
      },
      answers: answerMap,
    };
  }

  async saveAnswer(attemptId: string, userId: string, questionId: string, selectedOptionId: string | null) {
    const owned = await this.getOwnedAttempt(attemptId, userId);
    const attempt = await this.checkAndLazilyExpire(owned);
    if (attempt.status !== "IN_PROGRESS") {
      throw new ApiError("This attempt has already been finished", STATUS_CODES.CONFLICT);
    }
    if (!attempt.questionIds.includes(questionId)) {
      throw new ApiError("Question not found", STATUS_CODES.NOT_FOUND);
    }

    if (selectedOptionId) {
      const option = await prisma.placementOption.findUnique({ where: { id: selectedOptionId } });
      if (!option || option.questionId !== questionId) {
        throw new ApiError("Option not found", STATUS_CODES.NOT_FOUND);
      }
    }

    return prisma.placementAnswer.upsert({
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

    const assessment = await prisma.placementAssessment.findUnique({ where: { id: attempt.placementAssessmentId } });
    if (!assessment) throw new ApiError("Placement assessment not found", STATUS_CODES.NOT_FOUND);

    const updated = await prisma.placementAttempt.update({
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

    const assessment = await prisma.placementAssessment.findUnique({ where: { id: attempt.placementAssessmentId } });
    if (!assessment) throw new ApiError("Placement assessment not found", STATUS_CODES.NOT_FOUND);

    const questions = await prisma.placementQuestion.findMany({
      where: { id: { in: attempt.questionIds } },
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
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const orderedQuestions = attempt.questionIds
      .map((id, idx) => {
        const q = questionMap.get(id);
        return q ? { ...q, questionOrder: idx + 1 } : null;
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    const answers = await prisma.placementAnswer.findMany({ where: { attemptId } });
    const answerMap = Object.fromEntries(answers.map((a) => [a.questionId, a]));

    const mockInterviewUnlocked = await this.computeMockInterviewUnlocked(attempt.placementAssessmentId, userId);

    return {
      attempt,
      assessment: { id: assessment.id, title: assessment.title, passingScorePercent: assessment.passingScorePercent, questions: orderedQuestions },
      answers: answerMap,
      mockInterviewUnlocked,
    };
  }
}

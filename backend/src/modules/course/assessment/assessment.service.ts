import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { Assessment, AssessmentAttempt, AssessmentAttemptStatus } from "@prisma/client";
import {
  CreateAssessmentBody,
  UpdateAssessmentBody,
  CreateQuestionBody,
  UpdateQuestionBody,
  WEEKLY_QUESTION_COUNT,
  FINAL_QUESTION_COUNT,
  DEFAULT_FINAL_MAX_ATTEMPTS,
} from "./assessment.types.js";

const TERMINAL_STATUSES: AssessmentAttemptStatus[] = [
  "SUBMITTED",
  "AUTO_SUBMITTED_TIMEOUT",
  "AUTO_SUBMITTED_VIOLATION",
];

export function isAttemptSubmitted(status: AssessmentAttemptStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function expectedQuestionCount(type: "WEEKLY" | "FINAL"): number {
  return type === "WEEKLY" ? WEEKLY_QUESTION_COUNT : FINAL_QUESTION_COUNT;
}

// ─── Admin Service ────────────────────────────────────────────────────────────

export class AdminAssessmentService {
  private async getAssessmentById(assessmentId: string) {
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);
    return assessment;
  }

  private assessmentInclude() {
    return {
      questions: {
        orderBy: { questionOrder: "asc" as const },
        include: { options: { orderBy: { optionOrder: "asc" as const } } },
      },
      lesson: { select: { id: true, title: true, weekNumber: true } },
      _count: { select: { attempts: true } },
    };
  }

  async createAssessment(courseId: string, data: CreateAssessmentBody) {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

    const lessonId = data.type === "WEEKLY" ? data.lessonId! : null;

    if (data.type === "WEEKLY") {
      const lesson = await prisma.lessons.findUnique({ where: { id: lessonId! } });
      if (!lesson || lesson.courseId !== courseId) {
        throw new ApiError("Lesson not found in this course", STATUS_CODES.BAD_REQUEST);
      }
      const existingWeekly = await prisma.assessment.findUnique({ where: { lessonId: lessonId! } });
      if (existingWeekly) {
        throw new ApiError("This week already has a weekly assessment", STATUS_CODES.CONFLICT);
      }
    } else {
      const existingFinal = await prisma.assessment.findFirst({
        where: { courseId, type: "FINAL" },
      });
      if (existingFinal) {
        throw new ApiError("This course already has a final assessment", STATUS_CODES.CONFLICT);
      }
    }

    const { type, title, description, timeLimitMinutes, passingScorePercent, maxTabSwitchWarnings, maxAttempts } =
      data;

    return prisma.assessment.create({
      data: {
        courseId,
        lessonId,
        type,
        title,
        description: description || null,
        questionCount: expectedQuestionCount(type),
        timeLimitMinutes,
        passingScorePercent,
        maxTabSwitchWarnings: maxTabSwitchWarnings ?? 3,
        maxAttempts: type === "FINAL" ? (maxAttempts ?? DEFAULT_FINAL_MAX_ATTEMPTS) : null,
      },
      include: this.assessmentInclude(),
    });
  }

  async listAssessmentsForAdmin(courseId: string) {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw new ApiError("Course not found", STATUS_CODES.NOT_FOUND);

    return prisma.assessment.findMany({
      where: { courseId },
      include: this.assessmentInclude(),
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    });
  }

  /** @deprecated Prefer listAssessmentsForAdmin — kept for transitional callers */
  async getAssessmentForAdmin(courseId: string) {
    const assessments = await this.listAssessmentsForAdmin(courseId);
    const final = assessments.find((a) => a.type === "FINAL");
    if (!final && assessments.length === 0) {
      throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);
    }
    return final ?? assessments[0];
  }

  async getAssessmentByIdForAdmin(assessmentId: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: this.assessmentInclude(),
    });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);
    return assessment;
  }

  async updateAssessment(assessmentId: string, data: UpdateAssessmentBody) {
    await this.getAssessmentById(assessmentId);
    return prisma.assessment.update({
      where: { id: assessmentId },
      data,
      include: this.assessmentInclude(),
    });
  }

  async deleteAssessment(assessmentId: string) {
    await this.getAssessmentById(assessmentId);
    return prisma.assessment.delete({ where: { id: assessmentId } });
  }

  async togglePublish(assessmentId: string) {
    const assessment = await this.getAssessmentById(assessmentId);
    const questionCount = await prisma.assessmentQuestion.count({ where: { assessmentId } });

    if (!assessment.isPublished) {
      if (questionCount === 0) {
        throw new ApiError("Add questions before publishing", STATUS_CODES.BAD_REQUEST);
      }
      if (questionCount !== assessment.questionCount) {
        throw new ApiError(
          `This assessment requires exactly ${assessment.questionCount} questions (currently ${questionCount})`,
          STATUS_CODES.BAD_REQUEST,
        );
      }
    }

    return prisma.assessment.update({
      where: { id: assessmentId },
      data: { isPublished: !assessment.isPublished },
      include: this.assessmentInclude(),
    });
  }

  async createQuestion(assessmentId: string, data: CreateQuestionBody) {
    const assessment = await this.getAssessmentById(assessmentId);

    const currentCount = await prisma.assessmentQuestion.count({ where: { assessmentId } });
    if (currentCount >= assessment.questionCount) {
      throw new ApiError(
        `This assessment already has the maximum of ${assessment.questionCount} questions`,
        STATUS_CODES.CONFLICT,
      );
    }

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

// ─── Unlock helpers (shared with course progress) ─────────────────────────────

export async function getSubmittedAssessmentIds(
  userId: string,
  assessmentIds: string[],
): Promise<Set<string>> {
  if (assessmentIds.length === 0) return new Set();
  const attempts = await prisma.assessmentAttempt.findMany({
    where: {
      userId,
      assessmentId: { in: assessmentIds },
      status: { in: TERMINAL_STATUSES },
    },
    select: { assessmentId: true },
  });
  return new Set(attempts.map((a) => a.assessmentId));
}

export async function areAllLessonTopicsCompleted(
  userId: string,
  topicIds: string[],
): Promise<boolean> {
  if (topicIds.length === 0) return false;
  const completed = await prisma.topicProgress.count({
    where: { userId, topicId: { in: topicIds } },
  });
  return completed === topicIds.length;
}

/** Week is complete when all topics are done AND (if published weekly exists) assessment is submitted. */
export async function isWeekFullyComplete(
  userId: string,
  topicIds: string[],
  weeklyAssessment: { id: string; isPublished: boolean } | null | undefined,
): Promise<boolean> {
  const topicsDone = await areAllLessonTopicsCompleted(userId, topicIds);
  if (!topicsDone) return false;
  if (!weeklyAssessment?.isPublished) return true;
  const submitted = await getSubmittedAssessmentIds(userId, [weeklyAssessment.id]);
  return submitted.has(weeklyAssessment.id);
}

// ─── User Service ─────────────────────────────────────────────────────────────

type PerformanceStatus =
  | "NOT_ATTEMPTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "EXHAUSTED";

type UnlockStatus = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export class UserAssessmentService {
  private async getOwnedAttempt(attemptId: string, userId: string): Promise<AssessmentAttempt> {
    const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new ApiError("Attempt not found", STATUS_CODES.NOT_FOUND);
    if (attempt.userId !== userId) throw new ApiError("Not authorized", STATUS_CODES.FORBIDDEN);
    return attempt;
  }

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
    const submittedAt = new Date();
    const durationSeconds = Math.max(
      0,
      Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000),
    );

    const finalized = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status,
        submittedAt,
        durationSeconds,
        score,
        maxScore,
        scorePercent,
        isPassed,
      },
    });

    if (assessment) {
      const { PublicCourseService } = await import("../course.service.js");
      await new PublicCourseService().recalculateProgressAfterAssessment(
        attempt.userId,
        assessment.courseId,
      );
    }

    return finalized;
  }

  private async checkAndLazilyExpire(attempt: AssessmentAttempt): Promise<AssessmentAttempt> {
    if (attempt.status !== "IN_PROGRESS") return attempt;
    const deadline = new Date(attempt.startedAt.getTime() + attempt.timeLimitMinutes * 60_000);
    if (new Date() > deadline) {
      return this.finalizeAttempt(attempt.id, "AUTO_SUBMITTED_TIMEOUT");
    }
    return attempt;
  }

  private async assertEnrolled(courseId: string, userId: string) {
    const enrollment = await prisma.courseUserMapper.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ApiError("You are not enrolled in this course", STATUS_CODES.FORBIDDEN);
    return enrollment;
  }

  private async assertCanAccessAssessment(assessment: Assessment, userId: string) {
    if (!assessment.isPublished) {
      throw new ApiError("Assessment not available", STATUS_CODES.NOT_FOUND);
    }

    if (assessment.type === "WEEKLY") {
      if (!assessment.lessonId) {
        throw new ApiError("Weekly assessment is misconfigured", STATUS_CODES.SERVER_ERROR);
      }
      const lesson = await prisma.lessons.findUnique({
        where: { id: assessment.lessonId },
        include: { topics: { select: { id: true } } },
      });
      if (!lesson) throw new ApiError("Lesson not found", STATUS_CODES.NOT_FOUND);

      const topicsDone = await areAllLessonTopicsCompleted(
        userId,
        lesson.topics.map((t) => t.id),
      );
      if (!topicsDone) {
        throw new ApiError(
          "Complete this week's topics before taking the weekly assessment",
          STATUS_CODES.FORBIDDEN,
        );
      }
      return;
    }

    const weeklies = await prisma.assessment.findMany({
      where: { courseId: assessment.courseId, type: "WEEKLY", isPublished: true },
      select: { id: true },
    });

    if (weeklies.length > 0) {
      const submitted = await getSubmittedAssessmentIds(
        userId,
        weeklies.map((w) => w.id),
      );
      if (weeklies.some((w) => !submitted.has(w.id))) {
        throw new ApiError(
          "Complete all weekly assessments before taking the final assessment",
          STATUS_CODES.FORBIDDEN,
        );
      }
      return;
    }

    const lessons = await prisma.lessons.findMany({
      where: { courseId: assessment.courseId },
      include: { topics: { select: { id: true } } },
    });
    const topicIds = lessons.flatMap((l) => l.topics.map((t) => t.id));
    const topicsDone = await areAllLessonTopicsCompleted(userId, topicIds);
    if (!topicsDone) {
      throw new ApiError(
        "Complete all course topics before taking the final assessment",
        STATUS_CODES.FORBIDDEN,
      );
    }
  }

  private effectiveMaxAttempts(assessment: Assessment): number | null {
    if (assessment.type === "WEEKLY") return null; // unlimited
    return assessment.maxAttempts ?? DEFAULT_FINAL_MAX_ATTEMPTS;
  }

  private computeStats(attempts: AssessmentAttempt[], assessment: Assessment) {
    const terminal = attempts
      .filter((a) => isAttemptSubmitted(a.status))
      .sort((a, b) => b.attemptNumber - a.attemptNumber);
    const inProgress = attempts.find((a) => a.status === "IN_PROGRESS") ?? null;

    const best =
      terminal.length === 0
        ? null
        : terminal.reduce((acc, cur) =>
            (cur.scorePercent ?? -1) > (acc.scorePercent ?? -1) ? cur : acc,
          );
    const latest = terminal[0] ?? null;
    const maxAttempts = this.effectiveMaxAttempts(assessment);
    const attemptsUsed = terminal.length;
    const remainingAttempts =
      maxAttempts == null ? null : Math.max(0, maxAttempts - attemptsUsed);
    const exhausted = maxAttempts != null && remainingAttempts === 0 && !inProgress;

    let status: PerformanceStatus = "NOT_ATTEMPTED";
    if (inProgress) status = "IN_PROGRESS";
    else if (exhausted) status = "EXHAUSTED";
    else if (terminal.some((a) => a.isPassed === true)) status = "PASSED";
    else if (terminal.length > 0) status = "FAILED";

    return {
      status,
      bestScore: best?.score ?? null,
      bestScorePercent: best?.scorePercent ?? null,
      latestScore: latest?.score ?? null,
      latestScorePercent: latest?.scorePercent ?? null,
      totalAttempts: attemptsUsed,
      lastAttemptAt: latest?.submittedAt ?? latest?.startedAt ?? null,
      inProgressAttempt: inProgress,
      latestAttempt: latest,
      bestAttempt: best,
      maxAttempts,
      attemptsUsed,
      remainingAttempts,
      canStartNew: !inProgress && (maxAttempts == null || attemptsUsed < maxAttempts),
      exhausted,
    };
  }

  private async resolveUnlock(
    assessment: Assessment,
    userId: string,
    stats: ReturnType<UserAssessmentService["computeStats"]>,
  ): Promise<{ unlockStatus: UnlockStatus; lockReason: string | null }> {
    if (stats.inProgressAttempt) {
      return { unlockStatus: "IN_PROGRESS", lockReason: null };
    }
    // For progress gating, any completed attempt counts as "done" for the week
    if (stats.totalAttempts > 0 && assessment.type === "WEEKLY") {
      // Still available for retakes when unlocked
      try {
        await this.assertCanAccessAssessment(assessment, userId);
        return { unlockStatus: "AVAILABLE", lockReason: null };
      } catch {
        return {
          unlockStatus: "LOCKED",
          lockReason: "Complete this week's topics to unlock.",
        };
      }
    }

    try {
      await this.assertCanAccessAssessment(assessment, userId);
      if (stats.exhausted) {
        return { unlockStatus: "COMPLETED", lockReason: null };
      }
      return { unlockStatus: "AVAILABLE", lockReason: null };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Assessment is locked";
      return {
        unlockStatus: "LOCKED",
        lockReason:
          assessment.type === "WEEKLY"
            ? "Complete this week's topics to unlock."
            : message,
      };
    }
  }

  private serializeAssessment(
    assessment: Assessment & {
      questions: { id: string }[];
      lesson?: { id: string; title: string; weekNumber: number } | null;
    },
    stats: ReturnType<UserAssessmentService["computeStats"]>,
    unlockStatus: UnlockStatus,
    lockReason: string | null,
  ) {
    return {
      id: assessment.id,
      courseId: assessment.courseId,
      lessonId: assessment.lessonId,
      type: assessment.type,
      title: assessment.title,
      description: assessment.description,
      questionCount: assessment.questions.length || assessment.questionCount,
      expectedQuestionCount: assessment.questionCount,
      timeLimitMinutes: assessment.timeLimitMinutes,
      passingScorePercent: assessment.passingScorePercent,
      maxTabSwitchWarnings: assessment.maxTabSwitchWarnings,
      maxAttempts: stats.maxAttempts,
      weekNumber: assessment.lesson?.weekNumber ?? null,
      lessonTitle: assessment.lesson?.title ?? null,
      unlockStatus,
      lockReason,
      status: stats.status,
      bestScore: stats.bestScore,
      bestScorePercent: stats.bestScorePercent,
      latestScore: stats.latestScore,
      latestScorePercent: stats.latestScorePercent,
      totalAttempts: stats.totalAttempts,
      attemptsUsed: stats.attemptsUsed,
      remainingAttempts: stats.remainingAttempts,
      lastAttemptAt: stats.lastAttemptAt,
      canStartNew: stats.canStartNew && unlockStatus !== "LOCKED",
      canRetake: assessment.type === "WEEKLY"
        ? unlockStatus !== "LOCKED"
        : stats.canStartNew && unlockStatus !== "LOCKED",
      // Keep `attempt` as the actionable one (in-progress preferred, else latest)
      attempt: stats.inProgressAttempt ?? stats.latestAttempt,
      inProgressAttempt: stats.inProgressAttempt,
      latestAttempt: stats.latestAttempt,
      bestAttempt: stats.bestAttempt,
    };
  }

  private async loadAttemptsForAssessments(userId: string, assessmentIds: string[]) {
    if (assessmentIds.length === 0) return [] as AssessmentAttempt[];
    return prisma.assessmentAttempt.findMany({
      where: { userId, assessmentId: { in: assessmentIds } },
      orderBy: { attemptNumber: "desc" },
    });
  }

  async listAssessmentsForUser(courseId: string, userId: string) {
    await this.assertEnrolled(courseId, userId);

    const assessments = await prisma.assessment.findMany({
      where: { courseId, isPublished: true },
      include: {
        questions: { select: { id: true } },
        lesson: { select: { id: true, title: true, weekNumber: true } },
      },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    });

    const weeklies = assessments
      .filter((a) => a.type === "WEEKLY")
      .sort((a, b) => (a.lesson?.weekNumber ?? 0) - (b.lesson?.weekNumber ?? 0));
    const finals = assessments.filter((a) => a.type === "FINAL");
    const ordered = [...weeklies, ...finals];

    const allAttempts = await this.loadAttemptsForAssessments(
      userId,
      ordered.map((a) => a.id),
    );

    // Lazily expire any in-progress attempts that ran out of time
    const byAssessment = new Map<string, AssessmentAttempt[]>();
    for (const raw of allAttempts) {
      const resolved =
        raw.status === "IN_PROGRESS" ? await this.checkAndLazilyExpire(raw) : raw;
      const list = byAssessment.get(resolved.assessmentId) ?? [];
      list.push(resolved);
      byAssessment.set(resolved.assessmentId, list);
    }

    const result = [];
    for (const assessment of ordered) {
      const attempts = byAssessment.get(assessment.id) ?? [];
      const stats = this.computeStats(attempts, assessment);
      const { unlockStatus, lockReason } = await this.resolveUnlock(assessment, userId, stats);
      result.push(this.serializeAssessment(assessment, stats, unlockStatus, lockReason));
    }

    return result;
  }

  async getAssessmentForUser(courseId: string, userId: string, assessmentId?: string) {
    if (!assessmentId) {
      const list = await this.listAssessmentsForUser(courseId, userId);
      const preferred =
        list.find((a) => a.type === "FINAL" && a.unlockStatus !== "LOCKED") ??
        list.find((a) => a.unlockStatus === "AVAILABLE" || a.unlockStatus === "IN_PROGRESS") ??
        list.find((a) => a.type === "FINAL") ??
        list[0];
      if (!preferred) throw new ApiError("Assessment not available for this course", STATUS_CODES.NOT_FOUND);
      return preferred;
    }

    const list = await this.listAssessmentsForUser(courseId, userId);
    const found = list.find((a) => a.id === assessmentId);
    if (!found) throw new ApiError("Assessment not available for this course", STATUS_CODES.NOT_FOUND);
    return found;
  }

  async getAttemptHistory(courseId: string, assessmentId: string, userId: string) {
    await this.assertEnrolled(courseId, userId);

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, courseId, isPublished: true },
      include: { lesson: { select: { weekNumber: true, title: true } } },
    });
    if (!assessment) throw new ApiError("Assessment not found", STATUS_CODES.NOT_FOUND);

    const attempts = await prisma.assessmentAttempt.findMany({
      where: { userId, assessmentId, status: { in: TERMINAL_STATUSES } },
      orderBy: { attemptNumber: "desc" },
    });

    const stats = this.computeStats(
      await this.loadAttemptsForAssessments(userId, [assessmentId]),
      assessment,
    );

    return {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        weekNumber: assessment.lesson?.weekNumber ?? null,
        passingScorePercent: assessment.passingScorePercent,
        maxAttempts: stats.maxAttempts,
      },
      summary: {
        status: stats.status,
        bestScore: stats.bestScore,
        bestScorePercent: stats.bestScorePercent,
        latestScore: stats.latestScore,
        latestScorePercent: stats.latestScorePercent,
        totalAttempts: stats.totalAttempts,
        attemptsUsed: stats.attemptsUsed,
        remainingAttempts: stats.remainingAttempts,
        lastAttemptAt: stats.lastAttemptAt,
      },
      attempts: attempts.map((a) => ({
        id: a.id,
        attemptNumber: a.attemptNumber,
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        durationSeconds: a.durationSeconds,
        score: a.score,
        maxScore: a.maxScore,
        scorePercent: a.scorePercent,
        isPassed: a.isPassed,
      })),
    };
  }

  async startAttempt(courseId: string, userId: string, assessmentId: string) {
    await this.assertEnrolled(courseId, userId);

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, courseId, isPublished: true },
      include: { _count: { select: { questions: true } } },
    });
    if (!assessment) throw new ApiError("Assessment not available for this course", STATUS_CODES.NOT_FOUND);
    if (assessment._count.questions === 0) {
      throw new ApiError("This assessment has no questions yet", STATUS_CODES.BAD_REQUEST);
    }

    await this.assertCanAccessAssessment(assessment, userId);

    const existingInProgress = await prisma.assessmentAttempt.findFirst({
      where: { userId, assessmentId: assessment.id, status: "IN_PROGRESS" },
    });
    if (existingInProgress) {
      return this.checkAndLazilyExpire(existingInProgress);
    }

    const maxAttempts = this.effectiveMaxAttempts(assessment);
    if (maxAttempts != null) {
      const used = await prisma.assessmentAttempt.count({
        where: {
          userId,
          assessmentId: assessment.id,
          status: { in: TERMINAL_STATUSES },
        },
      });
      if (used >= maxAttempts) {
        throw new ApiError("Maximum assessment attempts reached", STATUS_CODES.CONFLICT);
      }
    }

    const last = await prisma.assessmentAttempt.findFirst({
      where: { userId, assessmentId: assessment.id },
      orderBy: { attemptNumber: "desc" },
      select: { attemptNumber: true },
    });
    const attemptNumber = (last?.attemptNumber ?? 0) + 1;

    return prisma.assessmentAttempt.create({
      data: {
        userId,
        assessmentId: assessment.id,
        attemptNumber,
        timeLimitMinutes: assessment.timeLimitMinutes,
      },
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
        type: true,
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
        attemptNumber: attempt.attemptNumber,
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
      return {
        tabSwitchCount: attempt.tabSwitchCount,
        maxTabSwitchWarnings: 0,
        status: attempt.status,
        autoSubmitted: false,
      };
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
    if (attempt.status !== "IN_PROGRESS") return attempt;
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
      include: {
        lesson: { select: { weekNumber: true, title: true } },
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

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    for (const q of assessment.questions) {
      const ans = answerMap[q.id];
      if (!ans?.selectedOptionId) {
        skipped += 1;
        continue;
      }
      if (ans.isCorrect) correct += 1;
      else wrong += 1;
    }

    const allAttempts = await this.loadAttemptsForAssessments(userId, [assessment.id]);
    const stats = this.computeStats(allAttempts, assessment);
    const { unlockStatus } = await this.resolveUnlock(assessment, userId, stats);

    return {
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        durationSeconds: attempt.durationSeconds,
        timeLimitMinutes: attempt.timeLimitMinutes,
        tabSwitchCount: attempt.tabSwitchCount,
        score: attempt.score,
        maxScore: attempt.maxScore,
        scorePercent: attempt.scorePercent,
        isPassed: attempt.isPassed,
      },
      assessment: {
        id: assessment.id,
        courseId: assessment.courseId,
        title: assessment.title,
        type: assessment.type,
        weekNumber: assessment.lesson?.weekNumber ?? null,
        passingScorePercent: assessment.passingScorePercent,
        maxAttempts: stats.maxAttempts,
        questions: assessment.questions,
      },
      answers: answerMap,
      breakdown: {
        correct,
        wrong,
        skipped,
        total: assessment.questions.length,
      },
      summary: {
        status: stats.status,
        bestScore: stats.bestScore,
        bestScorePercent: stats.bestScorePercent,
        latestScore: stats.latestScore,
        latestScorePercent: stats.latestScorePercent,
        totalAttempts: stats.totalAttempts,
        attemptsUsed: stats.attemptsUsed,
        remainingAttempts: stats.remainingAttempts,
        canRetake:
          assessment.type === "WEEKLY"
            ? unlockStatus !== "LOCKED"
            : stats.canStartNew && unlockStatus !== "LOCKED",
      },
    };
  }
}


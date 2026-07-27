import prisma from "@root/prisma.js";
import { PlacementAttemptStatus } from "@prisma/client";
import { ATTEMPT_COOLDOWN_MS } from "./placement.types.js";

const FINALIZED_STATUSES: PlacementAttemptStatus[] = [
  "SUBMITTED",
  "AUTO_SUBMITTED_TIMEOUT",
  "AUTO_SUBMITTED_VIOLATION",
];

export type PlacementAttemptAllowance = {
  defaultMaxAttempts: number;
  extraAttemptsGranted: number;
  effectiveMaxAttempts: number;
  attemptsUsed: number;
  remainingAttempts: number;
  hasPassed: boolean;
  /** True when the student may start a new attempt right now (not passed, has remaining, cooldown elapsed). */
  canStartNewAttempt: boolean;
  assessmentCompleted: boolean;
  assessmentCompletionDate: Date | null;
  /** When the next attempt becomes available after a failed attempt-1 cooldown; null if none. */
  nextAttemptAvailableAt: Date | null;
  /** True while waiting for the 12h cooldown between attempt 1 (fail) and attempt 2. */
  cooldownActive: boolean;
};

export type PlacementAttemptHistoryItem = {
  id: string;
  attemptNumber: number;
  status: PlacementAttemptStatus;
  questionIds: string[];
  score: number | null;
  maxScore: number | null;
  scorePercent: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  durationSeconds: number | null;
  isPassed: boolean | null;
};

export type PlacementAssessmentCurrentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED"
  | "COOLDOWN"
  | "EXHAUSTED";

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Assigns a fixed question set for a new attempt.
 *
 * - Prefer questions never used in prior finalized attempts (so attempt 1 + 2 partition the bank).
 * - Randomize display order once; the caller persists the returned order on the attempt.
 * - If the unused pool is smaller than `questionsPerAttempt` (legacy attempts / bank edits),
 *   fill from already-used questions so the attempt can still start.
 */
export function selectQuestionIdsForAttempt(
  allQuestionIds: string[],
  previouslyAssignedIds: string[],
  questionsPerAttempt: number,
): string[] {
  if (allQuestionIds.length === 0 || questionsPerAttempt <= 0) return [];

  const used = new Set(previouslyAssignedIds);
  const unused = allQuestionIds.filter((id) => !used.has(id));

  let pool: string[];
  if (unused.length >= questionsPerAttempt) {
    pool = shuffle(unused).slice(0, questionsPerAttempt);
  } else {
    const fromUsed = shuffle(allQuestionIds.filter((id) => used.has(id)));
    pool = [...shuffle(unused), ...fromUsed].slice(0, questionsPerAttempt);
    pool = shuffle(pool);
  }

  return pool;
}

export async function getPlacementAttemptAllowance(
  userId: string,
  placementAssessmentId: string,
): Promise<PlacementAttemptAllowance> {
  const assessment = await prisma.placementAssessment.findUnique({
    where: { id: placementAssessmentId },
    select: { maxAttempts: true },
  });
  if (!assessment) {
    throw new Error("Placement assessment not found");
  }

  const [extraAggregate, finalizedAttempts, passedAttempt] = await Promise.all([
    prisma.placementAttemptOverride.aggregate({
      where: { userId, placementAssessmentId },
      _sum: { attemptsGranted: true },
    }),
    prisma.placementAttempt.findMany({
      where: {
        userId,
        placementAssessmentId,
        status: { in: FINALIZED_STATUSES },
      },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        attemptNumber: true,
        submittedAt: true,
        isPassed: true,
      },
    }),
    prisma.placementAttempt.findFirst({
      where: {
        userId,
        placementAssessmentId,
        status: { in: FINALIZED_STATUSES },
        isPassed: true,
      },
      orderBy: { submittedAt: "asc" },
      select: { submittedAt: true },
    }),
  ]);

  const extraAttemptsGranted = extraAggregate._sum.attemptsGranted ?? 0;
  const effectiveMaxAttempts = assessment.maxAttempts + extraAttemptsGranted;
  const attemptsUsed = finalizedAttempts.length;
  const hasPassed = !!passedAttempt;
  const remainingAttempts = Math.max(0, effectiveMaxAttempts - attemptsUsed);

  // 12h cooldown only between a failed attempt 1 and starting attempt 2.
  let nextAttemptAvailableAt: Date | null = null;
  let cooldownActive = false;
  if (!hasPassed && remainingAttempts > 0 && attemptsUsed === 1) {
    const firstFinalized = finalizedAttempts[0];
    if (firstFinalized?.submittedAt && firstFinalized.isPassed === false) {
      nextAttemptAvailableAt = new Date(firstFinalized.submittedAt.getTime() + ATTEMPT_COOLDOWN_MS);
      cooldownActive = Date.now() < nextAttemptAvailableAt.getTime();
    }
  }

  return {
    defaultMaxAttempts: assessment.maxAttempts,
    extraAttemptsGranted,
    effectiveMaxAttempts,
    attemptsUsed,
    remainingAttempts,
    hasPassed,
    canStartNewAttempt: !hasPassed && remainingAttempts > 0 && !cooldownActive,
    assessmentCompleted: hasPassed,
    assessmentCompletionDate: passedAttempt?.submittedAt ?? null,
    nextAttemptAvailableAt,
    cooldownActive,
  };
}

export function resolvePlacementCurrentStatus(params: {
  hasPassed: boolean;
  hasActiveAttempt: boolean;
  attemptsUsed: number;
  remainingAttempts: number;
  cooldownActive: boolean;
}): PlacementAssessmentCurrentStatus {
  const { hasPassed, hasActiveAttempt, attemptsUsed, remainingAttempts, cooldownActive } = params;
  if (hasPassed) return "PASSED";
  if (hasActiveAttempt) return "IN_PROGRESS";
  if (attemptsUsed > 0 && remainingAttempts === 0) return "EXHAUSTED";
  if (cooldownActive) return "COOLDOWN";
  if (attemptsUsed > 0) return "FAILED";
  return "NOT_STARTED";
}

export async function getPreviouslyAssignedQuestionIds(
  userId: string,
  placementAssessmentId: string,
): Promise<string[]> {
  const attempts = await prisma.placementAttempt.findMany({
    where: {
      userId,
      placementAssessmentId,
      status: { in: FINALIZED_STATUSES },
    },
    select: { questionIds: true },
  });
  const ids = new Set<string>();
  for (const attempt of attempts) {
    for (const id of attempt.questionIds) ids.add(id);
  }
  return [...ids];
}

export async function getPlacementAttemptHistory(
  userId: string,
  placementAssessmentId: string,
): Promise<PlacementAttemptHistoryItem[]> {
  const attempts = await prisma.placementAttempt.findMany({
    where: {
      userId,
      placementAssessmentId,
      status: { in: FINALIZED_STATUSES },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      attemptNumber: true,
      status: true,
      questionIds: true,
      score: true,
      maxScore: true,
      scorePercent: true,
      startedAt: true,
      submittedAt: true,
      durationSeconds: true,
      isPassed: true,
    },
  });

  return attempts;
}

export async function getNextAttemptNumber(userId: string, placementAssessmentId: string): Promise<number> {
  const latest = await prisma.placementAttempt.findFirst({
    where: { userId, placementAssessmentId },
    orderBy: { attemptNumber: "desc" },
    select: { attemptNumber: true },
  });
  return (latest?.attemptNumber ?? 0) + 1;
}

export function computeDurationSeconds(startedAt: Date, submittedAt: Date): number {
  return Math.max(0, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000));
}

import prisma from "@root/prisma.js";
import { PlacementAttemptStatus } from "@prisma/client";

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
  canStartNewAttempt: boolean;
  assessmentCompleted: boolean;
  assessmentCompletionDate: Date | null;
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

  const [extraAggregate, attemptsUsed, passedAttempt] = await Promise.all([
    prisma.placementAttemptOverride.aggregate({
      where: { userId, placementAssessmentId },
      _sum: { attemptsGranted: true },
    }),
    prisma.placementAttempt.count({
      where: {
        userId,
        placementAssessmentId,
        status: { in: FINALIZED_STATUSES },
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
  const hasPassed = !!passedAttempt;
  const remainingAttempts = Math.max(0, effectiveMaxAttempts - attemptsUsed);

  return {
    defaultMaxAttempts: assessment.maxAttempts,
    extraAttemptsGranted,
    effectiveMaxAttempts,
    attemptsUsed,
    remainingAttempts,
    hasPassed,
    canStartNewAttempt: !hasPassed && remainingAttempts > 0,
    assessmentCompleted: hasPassed,
    assessmentCompletionDate: passedAttempt?.submittedAt ?? null,
  };
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

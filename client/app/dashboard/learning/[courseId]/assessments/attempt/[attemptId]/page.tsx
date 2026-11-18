"use client";

import { use } from "react";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { AssessmentAttemptView } from "@/components/learning/AssessmentAttemptView";

interface PageProps {
  params: Promise<{ courseId: string; attemptId: string }>;
}

export default function DashboardAssessmentAttemptPage({ params }: PageProps) {
  const { courseId, attemptId } = use(params);
  return (
    <LearningRouteProvider courseId={courseId} scope="dashboard">
      <AssessmentAttemptView courseId={courseId} attemptId={attemptId} />
    </LearningRouteProvider>
  );
}

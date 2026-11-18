"use client";

import { use } from "react";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { AssessmentResultsView } from "@/components/learning/AssessmentResultsView";

interface PageProps {
  params: Promise<{ courseId: string; attemptId: string }>;
}

export default function DashboardAssessmentResultsPage({ params }: PageProps) {
  const { courseId, attemptId } = use(params);
  return (
    <LearningRouteProvider courseId={courseId} scope="dashboard">
      <div className="min-h-full bg-slate-50">
        <AssessmentResultsView courseId={courseId} attemptId={attemptId} />
      </div>
    </LearningRouteProvider>
  );
}

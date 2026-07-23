"use client";

import { use } from "react";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { AssessmentHistoryView } from "@/components/learning/AssessmentHistoryView";

interface PageProps {
  params: Promise<{ courseId: string; assessmentId: string }>;
}

export default function DashboardAssessmentHistoryPage({ params }: PageProps) {
  const { courseId, assessmentId } = use(params);
  return (
    <LearningRouteProvider courseId={courseId} scope="dashboard">
      <div className="min-h-full bg-slate-50">
        <AssessmentHistoryView courseId={courseId} assessmentId={assessmentId} />
      </div>
    </LearningRouteProvider>
  );
}

"use client";

import { use } from "react";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { AssessmentIntroView } from "@/components/learning/AssessmentIntroView";

interface PageProps {
  params: Promise<{ courseId: string; assessmentId: string }>;
}

export default function DashboardAssessmentIntroPage({ params }: PageProps) {
  const { courseId, assessmentId } = use(params);
  return (
    <LearningRouteProvider courseId={courseId} scope="dashboard">
      <div className="min-h-full bg-slate-50">
        <AssessmentIntroView courseId={courseId} assessmentId={assessmentId} />
      </div>
    </LearningRouteProvider>
  );
}

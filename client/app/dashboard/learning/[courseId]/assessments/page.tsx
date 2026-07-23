"use client";

import { use } from "react";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { AssessmentHubView } from "@/components/learning/AssessmentHubView";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function DashboardAssessmentsPage({ params }: PageProps) {
  const { courseId } = use(params);
  return (
    <LearningRouteProvider courseId={courseId} scope="dashboard">
      <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
        <AssessmentHubView courseId={courseId} />
      </div>
    </LearningRouteProvider>
  );
}

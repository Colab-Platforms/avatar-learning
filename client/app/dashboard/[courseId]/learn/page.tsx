"use client";

import { use } from "react";
import { LearningRouteProvider } from "@/components/learning/LearningRouteContext";
import { CourseLearnPlayer } from "@/components/learning/CourseLearnPlayer";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default function BasicCourseLearnPage({ params }: PageProps) {
  const { courseId } = use(params);

  return (
    <LearningRouteProvider courseId={courseId} scope="dashboard">
      <CourseLearnPlayer courseId={courseId} track="BASIC" />
    </LearningRouteProvider>
  );
}

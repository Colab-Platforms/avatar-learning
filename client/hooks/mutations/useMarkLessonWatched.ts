"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markLessonWatched } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useMarkLessonWatched(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => markLessonWatched(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrolledCourse(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments });
      queryClient.invalidateQueries({ queryKey: queryKeys.direct2hireStatus });
    },
  });
}

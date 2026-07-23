"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markTopicWatched } from "@/lib/coursesApi";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useMarkTopicWatched(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topicId: string) => markTopicWatched(topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enrolledCourse(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myEnrollments });
      queryClient.invalidateQueries({ queryKey: queryKeys.direct2hireStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments(courseId) });
    },
  });
}

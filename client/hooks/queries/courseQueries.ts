import {
  fetchHeroCourses,
  fetchPublishedCoursesPaginated,
  fetchCourseBySlug,
} from "@/lib/coursesApi";
import { useQuery } from "@tanstack/react-query";

export function useHeroCourses() {
  return useQuery({
    queryKey: ["heroCourses"],
    queryFn: fetchHeroCourses,
  });
}

export function useCourses(page: number) {
  return useQuery({
    queryKey: ["courses", page],
    queryFn: () => fetchPublishedCoursesPaginated(page),
  });
}

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseBySlug(slug),
  });
}

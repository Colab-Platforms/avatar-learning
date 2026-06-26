export const queryKeys = {
  courses: ["courses"] as const,
  coursesPage: (page: number) => ["courses", page] as const,
  course: (slug: string) => ["course", slug] as const,
  enrolledCourse: (slug: string) => ["enrolled-course", slug] as const,
  enrollment: (courseId: string) => ["course-enrollment", courseId] as const,
  myEnrollments: ["my-enrollments"] as const,
};

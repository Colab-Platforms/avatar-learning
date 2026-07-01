export const queryKeys = {
  courses: ["courses"] as const,
  coursesPage: (page: number) => ["courses", page] as const,
  course: (slug: string) => ["course", slug] as const,
  enrolledCourse: (slug: string) => ["enrolled-course", slug] as const,
  enrollment: (courseId: string) => ["course-enrollment", courseId] as const,
  myEnrollments: ["my-enrollments"] as const,
  internships: ["internships"] as const,
  internshipsPage: (page: number, categoryId?: string) =>
    ["internships", page, categoryId] as const,
  internship: (slug: string) => ["internship", slug] as const,
  internshipApplication: (internshipId: string) =>
    ["internship-application", internshipId] as const,
  myApplications: ["my-applications"] as const,
};

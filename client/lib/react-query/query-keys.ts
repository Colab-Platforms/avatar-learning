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
  internshipCategories: ["internship-categories"] as const,
  direct2hireStatus: ["direct2hire-status"] as const,
  counsellingProfile: ["counselling-profile"] as const,
  counsellingBooking: ["counselling-booking"] as const,
  direct2hireLead: ["direct2hire-lead"] as const,
  adminDirect2hireStudent: (userId: string) =>
    ["admin-direct2hire-student", userId] as const,
  adminDirect2hireStudents: ["admin-direct2hire-students"] as const,
  assessment: (courseId: string) => ["assessment", courseId] as const,
  assessmentAttempt: (attemptId: string) => ["assessment-attempt", attemptId] as const,
  assessmentResult: (attemptId: string) => ["assessment-result", attemptId] as const,
};

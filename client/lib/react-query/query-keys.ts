export const queryKeys = {
  courses: ["courses"] as const,
  coursesPage: (page: number) => ["courses", page] as const,
  course: (slug: string) => ["course", slug] as const,
  enrolledCourse: (slug: string, track?: string | null) =>
    ["enrolled-course", slug, track ?? null] as const,
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
  pricing: ["pricing"] as const,
  currentUser: ["current-user"] as const,
  profile: ["profile"] as const,
  counsellingProfile: ["counselling-profile"] as const,
  counsellingBooking: ["counselling-booking"] as const,
  counsellingFeedback: ["counselling-feedback"] as const,
  courseSelection: ["course-selection"] as const,
  direct2hireLead: ["direct2hire-lead"] as const,
  adminDirect2hireStudent: (userId: string) =>
    ["admin-direct2hire-student", userId] as const,
  adminDirect2hireStudents: ["admin-direct2hire-students"] as const,
  adminBasicStudent: (userId: string) =>
    ["admin-basic-student", userId] as const,
  internshipTasks: ["direct2hire-internship-tasks"] as const,
  internshipTask: (taskId: string) =>
    ["direct2hire-internship-task", taskId] as const,
  adminInternshipTasks: (courseId: string) =>
    ["admin-internship-tasks", courseId] as const,
  assessment: (courseId: string) => ["assessment", courseId] as const,
  assessments: (courseId: string, track?: string | null) =>
    ["assessments", courseId, track ?? null] as const,
  assessmentDetail: (courseId: string, assessmentId: string) =>
    ["assessment", courseId, assessmentId] as const,
  assessmentHistory: (courseId: string, assessmentId: string) =>
    ["assessment-history", courseId, assessmentId] as const,
  assessmentAttempt: (attemptId: string) =>
    ["assessment-attempt", attemptId] as const,
  assessmentResult: (attemptId: string) =>
    ["assessment-result", attemptId] as const,
  placementAssessment: (courseId: string) =>
    ["placement-assessment", courseId] as const,
  placementAttemptHistory: (courseId: string) =>
    ["placement-attempt-history", courseId] as const,
  placementAttempt: (attemptId: string) =>
    ["placement-attempt", attemptId] as const,
  placementResult: (attemptId: string) =>
    ["placement-result", attemptId] as const,
  adminStudentPlacementSummary: (userId: string, courseId?: string) =>
    ["admin-student-placement-summary", userId, courseId ?? null] as const,
  adminStudentPlacementAttempts: (userId: string, courseId?: string) =>
    ["admin-student-placement-attempts", userId, courseId ?? null] as const,
  adminStudentPlacementOverrides: (userId: string, courseId?: string) =>
    ["admin-student-placement-overrides", userId, courseId ?? null] as const,
  mockInterview: ["mock-interview"] as const,
  adminMockInterview: (userId: string, courseId?: string) =>
    ["admin-mock-interview", userId, courseId ?? null] as const,
  jobPlacementJourney: ["job-placement-journey"] as const,
  adminJobPlacementJourney: (userId: string) =>
    ["admin-job-placement-journey", userId] as const,
  introVideo: ["direct2hire-intro-video"] as const,
  adminIntroVideo: ["admin-direct2hire-intro-video"] as const,
  adminCategories: ["admin-categories"] as const,
  adminCategoriesPage: (page: number, pageSize: number, search?: string) =>
    ["admin-categories", page, pageSize, search ?? ""] as const,
  adminCourses: ["admin-courses"] as const,
  adminCoursesPage: (page: number, pageSize: number, search?: string) =>
    ["admin-courses", page, pageSize, search ?? ""] as const,
  adminCourse: (id: string) => ["admin-course", id] as const,
  adminWebinarRegistrations: (
    page: number,
    pageSize: number,
    search?: string,
    status?: string,
  ) => ["admin-webinar-registrations", page, pageSize, search ?? "", status ?? ""] as const,
  adminWebinarRegistration: (id: string) =>
    ["admin-webinar-registration", id] as const,
  webinarRegistrationStatus: (registrationId: string) =>
    ["webinar-registration-status", registrationId] as const,
  adminWebinarSchedules: ["admin-webinar-schedules"] as const,
  webinarLiveSchedule: ["webinar-live-schedule"] as const,
};

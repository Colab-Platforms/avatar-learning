import type { AdminStudentInternshipProgressDto } from "../internship/internship.types.js";

export interface AdminD2HPaymentInfo {
  provider: string;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  amount: number;
  productType: string;
  status: string;
  paidAt: Date | null;
}

export interface AdminD2HStudentListItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  institutionName: string | null;
  currentEducation: string | null;
  city: string | null;
  state: string | null;
  paymentCompleted: boolean;
  enrollmentStatus: string;
  joinedAt: Date;
  hasSubmittedCounselling: boolean;
  hasRecommendation: boolean;
  recommendedCourseTitle: string | null;
  bookingStatus: string | null;
  bookingMode: string | null;
  payment: AdminD2HPaymentInfo | null;
}

/** One row in the D2H enrollments table — one per user, courses nested. */
export interface AdminD2HUserRow {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNo: string | null;
  };
  courseCount: number;
  totalPaid: number; // paise
  firstPaidAt: Date | null;
  courses: {
    enrollmentId: string;
    courseId: string;
    courseTitle: string;
    courseSlug: string;
    status: string;
    paidAt: Date | null;
  }[];
}

/** One row in the Basic (₹499) purchases table — one per user, courses nested. */
export interface AdminBasicUserRow {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNo: string | null;
  };
  courses: {
    courseId: string;
    courseTitle: string;
    courseSlug: string;
    tier: string; // BASIC | BOTH
    enrolledAt: Date;
    progress: number;
    isCompleted: boolean;
    payments: AdminD2HPaymentInfo[];
  }[];
}

/** Single-student view for the Basic (₹499) plan page. */
export interface AdminBasicStudentProfile {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNo: string | null;
    profileImage: string | null;
    createdAt: Date;
  };
  courses: {
    courseId: string;
    courseTitle: string;
    courseSlug: string;
    tier: string; // BASIC | BOTH
    enrolledAt: Date;
    progress: number;
    isCompleted: boolean;
    payments: AdminD2HPaymentInfo[];
  }[];
}

/** Everything genuinely scoped to a single course for one student. */
export interface AdminD2HCourseBlock {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  tier: string | null; // BASIC | D2H | BOTH, null if no CourseUserMapper yet
  enrollmentId: string | null;
  enrollmentStatus: string | null;
  assessmentCounsellingPaidAt: Date | null;
  tracks: { track: string; progress: number; isCompleted: boolean }[];
  payments: AdminD2HPaymentInfo[];
  booking: {
    preferredMode: string;
    notes: string | null;
    status: string;
    counsellorName: string | null;
    meetingLink: string | null;
    phoneNumber: string | null;
    scheduledAt: Date | null;
    createdAt: Date;
    counsellingCompleted: boolean;
    counsellingCompletedAt: Date | null;
    selectedCourseId: string | null;
    selectedCourseAt: Date | null;
    selectedCourse: { id: string; title: string; slug: string } | null;
  } | null;
}

export interface AdminD2HStudentProfile {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNo: string | null;
    profileImage: string | null;
    gender: string | null;
    address: string | null;
    state: string | null;
    country: string | null;
    city: string | null;
    currentStudyLevel: string | null;
    createdAt: Date;
  };
  lead: {
    fullName: string;
    email: string;
    phoneNumber: string;
    institutionName: string;
    currentEducation: string;
    city: string;
    state: string;
    country: string;
    paymentCompleted: boolean;
    createdAt: Date;
  } | null;
  counselling: Record<string, unknown> | null;
  recommendation: {
    recommendedCourseTitle: string;
    recommendedCourseSlug: string;
    confidenceScore: number | null;
    reasoning: string;
    studentStrengths: unknown;
    growthAreas: unknown;
    summary: string | null;
    generatedAt: Date;
  } | null;
  feedback: {
    assessmentAlignment: string;
    recommendedCourse: string;
    communicationRating: string;
    motivationLevel: string;
    overallPotential: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  internship: AdminStudentInternshipProgressDto;
  courses: AdminD2HCourseBlock[];
}
